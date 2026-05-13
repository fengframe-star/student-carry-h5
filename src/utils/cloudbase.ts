import cloudbase from "@cloudbase/js-sdk";

export const app = cloudbase.init({
  env: "student-carry-d9g3jiujafb8857c5",
  region: "ap-shanghai",
});

export const cloudbaseDb = app.database();
export const cloudbaseAuth = app.auth({ persistence: "local" });

export function ensureCloudbaseLogin() {
  return (async () => {
    const loginState = await cloudbaseAuth.getLoginState();
    if (!loginState?.user) {
      throw new Error("Login required.");
    }
  })();
}
