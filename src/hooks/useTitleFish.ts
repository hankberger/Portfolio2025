import { useEffect } from "react";

// Sends the fish for a lap through the tab title every few seconds, then parks
// it back on the end of the name until the next cycle.
//
// The emoji faces left in every major emoji font, so it swims right-to-left,
// out of its resting spot and through the name a character at a time. It stops
// just past the H rather than carrying on to the front: an emoji ahead of the
// name shoves the whole title sideways, and a tab title that shifts its left
// edge reads as a glitch rather than as a fish.
//
// The swim ends on a beat with no fish at all, so it reappears at its resting
// spot rather than visibly teleporting there from beside the H.
//
// REST_TITLE must match the <title> in index.html, or the tab flickers to a
// different string on mount.

const NAME = "Hank Berger";
const FISH = "🐟";
const REST_TITLE = `${NAME} ${FISH}`;

const STEP_DURATION = 140;
const GONE_PAUSE = 450;
const CYCLE_INTERVAL = 20000;

// One frame per character position, from the end of the name down to the gap
// after its first letter, then the name on its own. Everything left of the fish
// stays put, so the title grows rightwards and the first letter never moves.
const SWIM_FRAMES = [
  ...Array.from({ length: NAME.length }, (_, step) => {
    const at = NAME.length - step;
    return `${NAME.slice(0, at)}${FISH}${NAME.slice(at)}`;
  }),
  NAME,
];

// The last frame is the fishless beat, which holds longer than a swim step.
const GONE_FRAME = SWIM_FRAMES.length - 1;

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
        timer = setTimeout(
          tick,
          frame === GONE_FRAME ? GONE_PAUSE : STEP_DURATION
        );
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
