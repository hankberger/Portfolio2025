/**
 * Browser detection utilities for video format selection
 *
 * Detects browser type and provides appropriate video file extensions
 * for alpha channel video playback compatibility.
 *
 * Browser Support:
 * - Instagram iOS (in-app browser): Uses WKWebView (Safari engine) → .mov with HEVC
 * - Twitter/X iOS (in-app browser): Uses WKWebView (Safari engine) → .mov with HEVC
 * - Safari (desktop/mobile): → .mov with HEVC (H.265) codec for alpha transparency
 * - Chrome/Firefox/Edge: → .webm with VP9 codec for alpha transparency
 *
 * IMPORTANT: .mov files MUST be encoded with HEVC (H.265) codec, NOT H.264.
 * H.264 does not support alpha channels. Use ffmpeg with libx265 encoder.
 */

export type BrowserType = "instagram-ios" | "twitter-ios" | "safari" | "chrome";

/**
 * Detects the current browser type based on user agent string
 *
 * Priority order (most specific first):
 * 1. Instagram iOS - Detected by Instagram UA + iPhone/iPad platform
 * 2. Twitter/X iOS - Detected by Twitter UA + iPhone/iPad platform
 * 3. Safari - Detected by Safari UA (excluding Chrome/Android)
 * 4. Default - Assumes Chrome/Firefox/Edge (WebM compatible)
 *
 * @returns {BrowserType} The detected browser type
 */
export function detectBrowser(): BrowserType {
  // Handle SSR case (server-side rendering or Node environment)
  if (typeof navigator === "undefined") {
    return "chrome"; // Default to WebM for SSR
  }

  const ua = navigator.userAgent;

  // Instagram iOS in-app browser uses WKWebView (Safari rendering engine)
  // Must check this BEFORE Safari detection to avoid false positives
  if (/Instagram/i.test(ua) && /iPhone|iPad/i.test(ua)) {
    return "instagram-ios";
  }

  // Twitter/X iOS in-app browser also uses WKWebView (Safari rendering engine)
  // Does NOT support WebM — must use .mov with HEVC for alpha transparency
  if (/Twitter/i.test(ua) && /iPhone|iPad/i.test(ua)) {
    return "twitter-ios";
  }

  // Safari desktop/mobile (but NOT Chrome or Android browsers that spoof Safari UA)
  if (/^((?!chrome|android).)*safari/i.test(ua)) {
    return "safari";
  }

  // Default: Chrome, Firefox, Edge, Opera, etc. (WebM compatible)
  return "chrome";
}

/**
 * Returns the appropriate video file path for the current browser
 *
 * @param {string} baseName - The video filename without extension (e.g., "first", "test")
 * @returns {string} The full video path with correct extension (e.g., "/first.webm" or "/first.mov")
 *
 * @example
 * // In Chrome: returns "/first.webm"
 * // In Safari: returns "/first.mov"
 * // In Instagram iOS: returns "/first.mov"
 * const videoSrc = getVideoSrc("first");
 */
export function getVideoSrc(baseName: string): string {
  const browser = detectBrowser();
  const ext = browser === "chrome" ? "webm" : "mov";
  return `/${baseName}.${ext}`;
}

