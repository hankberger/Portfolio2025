const TAP_SLOP_PX = 10;
const SCROLL_SETTLE_MS = 200;

/** Distinguish a deliberate project tap from a click synthesized after scrolling. */
export function createProjectLinkGesture() {
  let lastScroll = -Infinity;
  let gesture: {
    project: number;
    pointer: number;
    x: number;
    y: number;
    blocked: boolean;
    released: boolean;
  } | null = null;

  const move = (pointer: number, x: number, y: number) => {
    if (!gesture || gesture.pointer !== pointer) return;
    if (Math.hypot(x - gesture.x, y - gesture.y) > TAP_SLOP_PX) {
      gesture.blocked = true;
    }
  };

  return {
    reset() { gesture = null; },
    start(project: number, pointer: number, x: number, y: number, now: number) {
      gesture = { project, pointer, x, y, released: false,
        blocked: now - lastScroll < SCROLL_SETTLE_MS };
    },
    move,
    end(pointer: number, x: number, y: number) {
      move(pointer, x, y);
      if (gesture?.pointer === pointer) gesture.released = true;
    },
    cancel(pointer: number) {
      if (gesture?.pointer === pointer) gesture.blocked = true;
    },
    scroll(now: number) {
      lastScroll = now;
      if (gesture) gesture.blocked = true;
    },
    consume(project: number, clickDetail: number) {
      // Keyboard and assistive activation do not have a pointer sequence.
      const allowed = clickDetail === 0 || !!(gesture &&
        gesture.project === project && gesture.released && !gesture.blocked);
      gesture = null;
      return allowed;
    },
  };
}
