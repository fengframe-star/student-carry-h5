export type StoredProfile = {
  ownerId?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  nickname: string;
  email: string;
  phoneNumber?: string;
  provider: string;
  currentCity?: string;
  schoolOrUniversity?: string;
  studentVerification?: boolean;
  identityVerified?: boolean;
  verificationLater?: string;
};

const profileKey = "studentCarryProfile";
const anonymousOwnerKey = "studentCarryAnonymousOwnerId";

export function readStoredProfile(): StoredProfile | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(profileKey);
    return raw ? (JSON.parse(raw) as StoredProfile) : null;
  } catch {
    return null;
  }
}

export function profileNickname() {
  const profile = readStoredProfile();
  return profile?.nickname || profile?.name || profile?.firstName || "Student Carry User";
}

function makeOwnerId(prefix = "local") {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function ownerIdForProfile(profile: Pick<StoredProfile, "ownerId" | "email" | "provider" | "nickname">) {
  if (profile.ownerId) {
    return profile.ownerId;
  }

  const basis = [profile.provider, profile.email || profile.nickname].filter(Boolean).join(":");
  return basis ? `profile:${basis}` : makeOwnerId("profile");
}

export function currentOwnerId() {
  const profile = readStoredProfile();
  if (profile) {
    return ownerIdForProfile(profile);
  }

  if (typeof window === "undefined") {
    return "anonymous";
  }

  const existing = window.localStorage.getItem(anonymousOwnerKey);
  if (existing) {
    return existing;
  }

  const next = makeOwnerId("anonymous");
  window.localStorage.setItem(anonymousOwnerKey, next);
  return next;
}
