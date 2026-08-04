// Orientation detection.
//
// This deliberately delegates to the *same* `(orientation: portrait)` media
// query the stylesheets use, so JS and CSS can never disagree about what
// "portrait" means — same engine, same definition, no drift.
//
// The previous implementation read `screen.orientation.type`, which describes
// the physical *device*, not the viewport. Those are different things:
//
//   - A pivoted/vertical external monitor reports "portrait-primary" even when
//     the browser window on it is wide.
//   - A tall narrow window on a normal landscape monitor reports
//     "landscape-primary" while CSS correctly sees a portrait viewport.
//
// Because `screen.orientation` exists in every current browser, the old
// viewport fallback below was effectively dead code on desktop, so the camera
// framing and the CSS layout could disagree on the same screen.

const PORTRAIT_QUERY = "(orientation: portrait)";

export function isPortrait(): boolean {
  if (typeof window.matchMedia === "function") {
    return window.matchMedia(PORTRAIT_QUERY).matches;
  }

  // Only reached in environments without matchMedia.
  return window.innerHeight >= window.innerWidth;
}

/**
 * Calls `handler` whenever the viewport flips between portrait and landscape.
 * Returns an unsubscribe function.
 *
 * More reliable than listening for `resize`: it fires exactly on the
 * transition, and only on the transition.
 */
export function subscribeToOrientation(handler: () => void): () => void {
  if (typeof window.matchMedia !== "function") {
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }

  const query = window.matchMedia(PORTRAIT_QUERY);

  // Safari only gained MediaQueryList.addEventListener in 14; fall back to the
  // deprecated addListener so older iOS still tracks rotation.
  if (typeof query.addEventListener === "function") {
    query.addEventListener("change", handler);
    return () => query.removeEventListener("change", handler);
  }

  query.addListener(handler);
  return () => query.removeListener(handler);
}
