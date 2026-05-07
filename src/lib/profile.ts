export type StoredProfile = {
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
