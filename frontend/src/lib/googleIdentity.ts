/** Public OAuth 2.0 client ID (Web). Override with `VITE_GOOGLE_CLIENT_ID` in `.env`. */
export const GOOGLE_OAUTH_CLIENT_ID =
  (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) ||
  "408502857060-sh10gs0v6kibl8tc17nfteooemmlc3pf.apps.googleusercontent.com";

const GIS_SCRIPT_SRC = "https://accounts.google.com/gsi/client";
const GIS_SCRIPT_SRC1 = "https://accounts.google.com/gsi/client";

let gsiScriptPromise: Promise<void> | null = null;

export function loadGoogleIdentityScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.accounts?.oauth2) return Promise.resolve();

  if (gsiScriptPromise) return gsiScriptPromise;

  gsiScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${GIS_SCRIPT_SRC}"]`,
    );
    if (existing) {
      if (window.google?.accounts?.oauth2) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Google Identity script failed")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = GIS_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      gsiScriptPromise = null;
      reject(new Error("Failed to load Google Identity script"));
    };
    document.head.appendChild(script);
  });

  return gsiScriptPromise;
}

export type GoogleUserInfo = {
  email: string;
  name: string;
  picture?: string;
};

export async function fetchGoogleUserInfo(
  accessToken: string,
): Promise<GoogleUserInfo> {
  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Userinfo request failed: ${res.status}`);
  }
  const data = (await res.json()) as {
    email?: string;
    name?: string;
    picture?: string;
  };
  if (!data.email) {
    throw new Error("Google account has no email");
  }
  return {
    email: data.email,
    name: data.name ?? data.email,
    picture: data.picture,
  };
}

export function revokeGoogleAccessToken(
  accessToken: string,
  onDone?: () => void,
): void {
  const oauth2 = window.google?.accounts?.oauth2;
  if (!oauth2?.revoke) {
    onDone?.();
    return;
  }
  oauth2.revoke(accessToken, () => {
    onDone?.();
  });
}
