import { cloudbaseAuth, cloudbaseDb } from "../utils/cloudbase";
import type { StoredProfile } from "./profile";

const profileKey = "studentCarryProfile";
const usersCollectionName = "users";

export type LoginMethod = "email" | "phone";

type CloudbaseUser = {
  id?: string;
  uid?: string;
  email?: string;
  phone?: string;
  user_metadata?: {
    nickName?: string;
    name?: string;
  };
};

type AuthErrorLike = {
  code?: string;
  message?: string;
  category?: string;
};

type ResetPasswordCallback = (attributes: { nonce: string; password: string }) => Promise<{
  data?: { user?: CloudbaseUser; session?: { user?: CloudbaseUser } };
  error?: AuthErrorLike | null;
}>;

export type PendingPasswordReset = {
  account: string;
  updateUser: ResetPasswordCallback;
};

function userId(user?: CloudbaseUser | null) {
  return String(user?.uid || user?.id || "");
}

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const withoutCountry = digits.startsWith("86") && digits.length > 11 ? digits.slice(2) : digits;
  if (withoutCountry.length !== 11) {
    throw new Error("Please enter a valid Mainland China phone number.");
  }
  return `+86${withoutCountry}`;
}

export function normalizeAuthAccount(method: LoginMethod, rawAccount: string) {
  const account = method === "phone" ? normalizePhone(rawAccount) : rawAccount.trim().toLowerCase();
  if (method === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account)) {
    throw new Error("Please enter a valid email address.");
  }
  return account;
}

function loginPayload(method: LoginMethod, account: string, password: string) {
  return method === "email"
    ? { email: account, password }
    : { phone: account, password };
}

function signupPayload(method: LoginMethod, account: string, password: string, token: string, verificationToken: string) {
  return method === "email"
    ? { email: account, password, verification_code: token, verification_token: verificationToken }
    : { phone_number: account, password, verification_code: token, verification_token: verificationToken };
}

function profileFromUser(user: CloudbaseUser, method: LoginMethod, account: string, existing?: Partial<StoredProfile>): StoredProfile {
  const ownerId = userId(user);
  return {
    ...existing,
    ownerId,
    nickname: existing?.nickname || user.user_metadata?.nickName || user.user_metadata?.name || "",
    email: user.email || (method === "email" ? account : "") || existing?.email || "",
    phoneNumber: user.phone || (method === "phone" ? account : "") || existing?.phoneNumber || "",
    provider: method === "phone" ? "Phone password" : "Email password",
    currentCity: existing?.currentCity || "",
    schoolOrUniversity: existing?.schoolOrUniversity || "",
    studentVerification: Boolean(existing?.schoolOrUniversity),
    identityVerified: Boolean(existing?.identityVerified),
    verificationLater: existing?.verificationLater || "No",
  };
}

export function isProfileComplete(profile: StoredProfile | null) {
  return Boolean(profile?.ownerId && profile.nickname?.trim() && profile.currentCity?.trim());
}

export async function readCloudbaseUser() {
  const loginState = await cloudbaseAuth.getLoginState();
  return loginState?.user as CloudbaseUser | undefined;
}

async function profileForUser(user: CloudbaseUser, method: LoginMethod, account: string, profileSeed?: Partial<StoredProfile>) {
  const ownerId = userId(user);
  if (!ownerId) {
    throw new Error("CloudBase did not return a user id.");
  }

  let cloudProfile: Partial<StoredProfile> | undefined;
  try {
    const existing = await cloudbaseDb.collection(usersCollectionName).doc(ownerId).get();
    cloudProfile = existing.data?.[0] as Partial<StoredProfile> | undefined;
  } catch {
    cloudProfile = undefined;
  }

  const profile = profileFromUser(user, method, account, { ...cloudProfile, ...profileSeed });
  await saveProfile(profile);
  return profile;
}

export async function checkAccountStatus(method: LoginMethod, rawAccount: string) {
  const account = normalizeAuthAccount(method, rawAccount);
  const exists = await cloudbaseAuth.isUsernameRegistered(account);
  return { account, exists };
}

export async function signInWithAccountPassword(method: LoginMethod, account: string, password: string) {
  const result = await cloudbaseAuth.signInWithPassword(loginPayload(method, account, password));
  if (result.error) {
    throw new Error(result.error.message || "Unable to log in.");
  }

  const user = result.data?.user || result.data?.session?.user || await readCloudbaseUser();
  if (!user) {
    throw new Error("Login succeeded but CloudBase did not return a user.");
  }

  return profileForUser(user, method, account);
}

export async function sendCreateAccountCode(method: LoginMethod, account: string) {
  const result = await cloudbaseAuth.getVerification(
    method === "email" ? { email: account } : { phone_number: account },
  );

  if (result.is_user) {
    throw new Error("Account already exists. Please log in with password.");
  }

  if (!result.verification_id) {
    throw new Error("Unable to send verification code.");
  }

  return result.verification_id;
}

export async function createAccountWithPassword(
  method: LoginMethod,
  account: string,
  verificationId: string,
  token: string,
  password: string,
  legalAgreementAcceptedAt: number,
) {
  const verification = await cloudbaseAuth.verify({
    verification_id: verificationId,
    verification_code: token.trim(),
  });

  if (!verification.verification_token) {
    throw new Error("Verification failed.");
  }

  const result = await cloudbaseAuth.signUp(
    signupPayload(method, account, password, token.trim(), verification.verification_token) as never,
  );

  if (result.error) {
    throw new Error(result.error.message || "Unable to create account.");
  }

  const user = result.data?.user || result.data?.session?.user || await readCloudbaseUser();
  if (!user) {
    throw new Error("Account created but CloudBase did not return a user.");
  }

  return profileForUser(user, method, account, { legalAgreementAcceptedAt });
}

export async function sendPasswordResetCode(account: string): Promise<PendingPasswordReset> {
  const result = await cloudbaseAuth.resetPasswordForEmail(account);
  if (result.error || !result.data?.updateUser) {
    throw new Error(result.error?.message || "Unable to send reset code.");
  }

  return { account, updateUser: result.data.updateUser };
}

export async function resetPasswordAndSignIn(
  method: LoginMethod,
  pending: PendingPasswordReset,
  token: string,
  password: string,
) {
  const result = await pending.updateUser({ nonce: token.trim(), password });
  if (result.error) {
    throw new Error(result.error.message || "Unable to reset password.");
  }

  const user = result.data?.user || result.data?.session?.user || await readCloudbaseUser();
  if (!user) {
    throw new Error("Password reset succeeded but CloudBase did not return a user.");
  }

  return profileForUser(user, method, pending.account);
}

export async function saveProfile(profile: StoredProfile) {
  window.localStorage.setItem(profileKey, JSON.stringify(profile));
  if (!profile.ownerId) {
    return profile;
  }

  await cloudbaseDb.collection(usersCollectionName).doc(profile.ownerId).set({
    ownerId: profile.ownerId,
    nickname: profile.nickname,
    currentCity: profile.currentCity,
    schoolOrUniversity: profile.schoolOrUniversity || "",
    studentVerification: Boolean(profile.schoolOrUniversity),
    legalAgreementAcceptedAt: profile.legalAgreementAcceptedAt || null,
    updatedAt: Date.now(),
  });
  return profile;
}

export async function signOut() {
  await cloudbaseAuth.signOut();
  window.localStorage.removeItem(profileKey);
}
