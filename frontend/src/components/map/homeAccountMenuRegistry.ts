/** Lets map chrome (e.g. layers toggle) close the home account dropdown. */
let closeHomeAccountMenu: (() => void) | null = null;

export function registerCloseHomeAccountMenu(fn: (() => void) | null): void {
  closeHomeAccountMenu = fn;
}

export function requestCloseHomeAccountMenu(): void {
  closeHomeAccountMenu?.();
}
