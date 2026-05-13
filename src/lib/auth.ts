import { cloudbaseAuth, cloudbaseDb } from "../utils/cloudbase";
import type { StoredProfile } from "./profile";

const profileKey = "studentCarryProfile";
const usersCollectionName = "users";

export type LoginMethod = "email" | "phone";

export type PendingOtpLogin = {
  method: LoginMethod;
  account: string;
  verifyOtp: (params: { email?: string; phone?: string; token: string }) => Promise<{
    data?: { user?: CloudbaseUser; session?: { user?: CloudbaseUser } };
    error?: { message?: string } | null;
  }>;
};

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

function profileFromUser(user: CloudbaseUser, method: LoginMethod, account: string, existing?: Partial<StoredProfile>): StoredProfile {
  const ownerId = userId(user);
  return {
    ...existing,
    ownerId,
    nickname: existing?.nickname || user.user_metadata?.nickName || user.user_metadata?.name || "",
    email: user.email || (method === "email" ? account : "") || existing?.email || "",
    phoneNumber: user.phone || (method === "phone" ? account : "") || existing?.phoneNumber || "",
    provider: method === "phone" ? "Phone code" : "Email code",
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

export async function sendLoginCode(method: LoginMethod, rawAccount: string): Promise<PendingOtpLogin> {
  const account = method === "phone" ? normalizePhone(rawAccount) : rawAccount.trim().toLowerCase();
  if (method === "email" && !account.includes("@")) {
    throw new Error("Please enter a valid email address.");
  }

  const result = await cloudbaseAuth.signInWithOtp({
    [method]: account,
    options: { shouldCreateUser: true },
  });

  if (result.error || !result.data?.verifyOtp) {
    throw new Error(result.error?.message || "Unable to send verification code.");
  }

  return { method, account, verifyOtp: result.data.verifyOtp };
}

export async function verifyLoginCode(pending: PendingOtpLogin, code: string) {
  const result = await pending.verifyOtp({
    [pending.method]: pending.account,
    token: code.trim(),
  });

  if (result.error) {
    throw new Error(result.error.message || "Verification failed.");
  }

  const user = result.data?.user || result.data?.session?.user || await readCloudbaseUser();
  const ownerId = userId(user);
  if (!user || !ownerId) {
    throw new Error("Login succeeded but user id was not returned.");
  }

  let cloudProfile: Partial<StoredProfile> | undefined;
  try {
    const existing = await cloudbaseDb.collection(usersCollectionName).doc(ownerId).get();
    cloudProfile = existing.data?.[0] as Partial<StoredProfile> | undefined;
  } catch {
    cloudProfile = undefined;
  }

  const profile = profileFromUser(user, pending.method, pending.account, cloudProfile);
  await saveProfile(profile);
  return profile;
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
    updatedAt: Date.now(),
  });
  return profile;
}

export async function signOut() {
  await cloudbaseAuth.signOut();
  window.localStorage.removeItem(profileKey);
}
