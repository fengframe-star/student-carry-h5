import cloudbase from "@cloudbase/js-sdk";

export const app = cloudbase.init({
  env: "student-carry-d9g3jiujafb8857c5",
  region: "ap-shanghai",
});

export const cloudbaseDb = app.database();
export const cloudbaseAuth = app.auth({ persistence: "local" });

type CloudbaseLoginUser = {
  uid?: string;
  id?: string;
};

function uidFromUser(user?: CloudbaseLoginUser | null) {
  return String(user?.uid || user?.id || "");
}

export function ensureCloudbaseLogin() {
  return (async () => {
    const loginState = await cloudbaseAuth.getLoginState();
    const uid = uidFromUser(loginState?.user as CloudbaseLoginUser | undefined);
    if (!loginState?.user || !uid) {
      throw new Error("Login required.");
    }
    return uid;
  })();
}

export async function getCloudbaseUid() {
  const loginState = await cloudbaseAuth.getLoginState();
  return uidFromUser(loginState?.user as CloudbaseLoginUser | undefined);
}
