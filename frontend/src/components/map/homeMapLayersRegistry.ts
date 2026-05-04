/** Wired on the home map only; used to close the layers list from the account control. */
let collapseHomeMapLayers: (() => void) | null = null;

export function registerHomeMapLayersCollapse(fn: (() => void) | null): void {
  collapseHomeMapLayers = fn;
}

export function requestCollapseHomeMapLayers(): void {
  collapseHomeMapLayers?.();
}
