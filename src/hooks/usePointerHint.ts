import { useCallback, useEffect, useRef, useState } from "react";
import { isPortrait, subscribeToOrientation } from "../util/isPortrait";

// State machine for the "drag around to move your fish" hint.
//
// Touch users get no cursor to discover the interaction with, so the hint shows
// on load in portrait, disappears as soon as they touch, and comes back if they
// go idle. It never appears in landscape, where a cursor makes it redundant.

const IDLE_DELAY = 5000;

export interface PointerHint {
  /** Whether the hint should be mounted. */
  visible: boolean;
  /** Whether it should be playing its exit animation. */
  exiting: boolean;
  /** Call when the exit animation finishes. */
  onExited: () => void;
  /** Call on pointer activity — dismisses the hint and restarts the idle clock. */
  notifyPointerInput: () => void;
  /** Suppresses the hint while the card is expanded and the fish have scattered. */
  setScattered: (scattered: boolean) => void;
}

export function usePointerHint(): PointerHint {
  const [visible, setVisible] = useState(() => isPortrait());
  const [exiting, setExiting] = useState(false);

  // Mirrors of the above for use inside timers and callbacks, which would
  // otherwise capture stale state.
  const exitingRef = useRef(false);
  const scatteredRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scheduleReveal = useCallback(() => {
    clearTimer();
    timerRef.current = setTimeout(() => {
      // Re-checked at fire time, not schedule time: the user may have rotated
      // the device or expanded the card in the meantime.
      if (scatteredRef.current || !isPortrait()) return;
      exitingRef.current = false;
      setExiting(false);
      setVisible(true);
    }, IDLE_DELAY);
  }, [clearTimer]);

  const dismiss = useCallback(() => {
    if (exitingRef.current) return;
    exitingRef.current = true;
    setExiting(true);
  }, []);

  const onExited = useCallback(() => {
    setVisible(false);
    scheduleReveal();
  }, [scheduleReveal]);

  const notifyPointerInput = useCallback(() => {
    dismiss();
    scheduleReveal();
  }, [dismiss, scheduleReveal]);

  const setScattered = useCallback(
    (scattered: boolean) => {
      scatteredRef.current = scattered;
      if (scattered) {
        dismiss();
        clearTimer();
      } else {
        scheduleReveal();
      }
    },
    [clearTimer, dismiss, scheduleReveal]
  );

  // Rotating the device mid-hint used to leave it stranded on screen, because
  // orientation was only consulted on mount and when the idle timer fired.
  useEffect(() => {
    return subscribeToOrientation(() => {
      if (isPortrait()) {
        scheduleReveal();
        return;
      }
      clearTimer();
      exitingRef.current = false;
      setExiting(false);
      setVisible(false);
    });
  }, [clearTimer, scheduleReveal]);

  useEffect(() => clearTimer, [clearTimer]);

  return { visible, exiting, onExited, notifyPointerInput, setScattered };
}
