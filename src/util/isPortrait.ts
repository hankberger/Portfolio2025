export function isPortrait(): boolean {
  // Prefer the standardized ScreenOrientation API if available
  if (window.screen?.orientation?.type) {
    return window.screen.orientation.type.startsWith("portrait");
  }

  // Fallback: compare viewport dimensions
  return window.innerHeight >= window.innerWidth;
}
