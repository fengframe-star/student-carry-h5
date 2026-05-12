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
        try {
          const result = await auth.signInAnonymously();
          if (result.error) {
            console.warn("CloudBase anonymous login is not available yet.", result.error.message);
          }
        } catch (error) {
          console.warn("CloudBase anonymous login is not available yet.", error);
        }
      }
    })();
  }

  return loginPromise;
}
