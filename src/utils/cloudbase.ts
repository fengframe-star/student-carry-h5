import cloudbase from "@cloudbase/js-sdk";

export const app = cloudbase.init({
  env: "student-carry-d9g3jiujafb8857c5",
});

export const cloudbaseDb = app.database();

let loginPromise: Promise<void> | null = null;

export function ensureCloudbaseLogin() {
  if (!loginPromise) {
    loginPromise = (async () => {
      const auth = app.auth({ persistence: "local" });
      const loginState = await auth.getLoginState();
      if (!loginState) {
        const result = await auth.signInAnonymously();
        if (result.error) {
          throw new Error(result.error.message || "CloudBase anonymous login failed.");
        }
      }
    })();
  }

  return loginPromise;
}
