import { useEffect } from "react";

// Sends the fish for a lap through the tab title every 30 seconds, then parks
// it back on the end of the name until the next cycle.
//
// The emoji faces left in every major emoji font, so it swims right-to-left:
// out of its resting spot, through the name a character at a time, and clear
// off the left side. The jump back to the end happens while it is already past
// the text, so it reads as the fish having swum away and come back.
//
// REST_TITLE must match the <title> in index.html, or the tab flickers to a
// different string on mount.

const NAME = "Hank Berger";
const FISH = "🐟";
const REST_TITLE = `${NAME} ${FISH}`;

const STEP_DURATION = 140;
const CYCLE_INTERVAL = 30000;

// One frame per character position, from the end of the name to before the
// start, plus a final frame with the fish fully clear of the text.
const SWIM_FRAMES = [
  ...Array.from({ length: NAME.length + 1 }, (_, step) => {
    const at = NAME.length - step;
    return `${NAME.slice(0, at)}${FISH}${NAME.slice(at)}`;
  }),
  `${FISH} ${NAME}`,
];

function prefersReducedMotion(): boolean {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Animates `document.title` on a loop for as long as the app is mounted.
 *
 * Note that hidden tabs clamp timers to roughly 1s (and to once a minute after
 * a few minutes of being hidden), so a backgrounded tab shows the same swim in
 * slow motion. There is no way around that — `requestAnimationFrame` stops
 * outright when the tab is hidden, which is the case this exists for.
 */
export function useTitleFish(): void {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    // -1 is the resting state, with the fish parked at the end of the title.
    let frame = -1;

    const tick = () => {
      // Read per cycle rather than once on mount, so toggling the OS setting
      // takes effect without a reload.
      if (frame < 0 && prefersReducedMotion()) {
        timer = setTimeout(tick, CYCLE_INTERVAL);
        return;
      }

      frame += 1;

      if (frame < SWIM_FRAMES.length) {
        document.title = SWIM_FRAMES[frame];
        timer = setTimeout(tick, STEP_DURATION);
        return;
      }

      frame = -1;
      document.title = REST_TITLE;
      timer = setTimeout(tick, CYCLE_INTERVAL);
    };

    document.title = REST_TITLE;
    timer = setTimeout(tick, CYCLE_INTERVAL);

    return () => {
      clearTimeout(timer);
      document.title = REST_TITLE;
    };
  }, []);
}
