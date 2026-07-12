/** Per-tab flag: welcome already shown in this tab (cleared when tab closes). */
const TAB_WELCOME_KEY = "kiwitrail.home.welcomeShownThisTab";

export function wasWelcomeShownThisTab(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(TAB_WELCOME_KEY) === "1";
}

export function markWelcomeShownThisTab(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(TAB_WELCOME_KEY, "1");
}

/** Show welcome once per new tab. */
export function shouldShowHomeWelcome(): boolean {
  return !wasWelcomeShownThisTab();
}

export async function logHomeVisit(
  backendUrl: string,
  options?: { userEmail?: string | null; page?: string },
): Promise<void> {
  try {
    const response = await fetch(`${backendUrl}/analytics/home-visit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_email: options?.userEmail ?? null,
        page: options?.page ?? "home",
      }),
    });
    if (!response.ok) {
      console.warn("Home visit log failed:", response.status);
    }
  } catch (error) {
    console.warn("Home visit log error:", error);
  }
}
