import { useEffect, useRef } from "react";
import { animate, easings } from "animejs";
import "./styles/PointerHint.css";

interface IPointerHint {
  /** When true, play the exit animation and then call onExited. */
  exiting?: boolean;
  onExited?: () => void;
}

export default function PointerHint({ exiting, onExited }: IPointerHint) {
  const hintRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLImageElement>(null);

  // Fade in the whole hint container. The long delay lets the card intro land first.
  useEffect(() => {
    if (!hintRef.current) return;

    animate(hintRef.current, {
      opacity: {
        from: 0,
        to: 1,
        duration: 600,
        delay: 2000,
        ease: easings.eases.outCirc,
      },
      y: {
        from: "1rem",
        to: "0rem",
        duration: 800,
        delay: 2000,
        ease: easings.spring({ mass: 1, stiffness: 80 }),
      },
    });
  }, []);

  // Organic curved motion - traces a smooth loop pattern
  useEffect(() => {
    if (!iconRef.current) return;

    animate(iconRef.current, {
      x: [
        { to: "4px", duration: 400, ease: easings.eases.outCirc },
        { to: "6px", duration: 300, ease: easings.eases.inOutCirc },
        { to: "2px", duration: 350, ease: easings.eases.inOutCirc },
        { to: "-8px", duration: 500, ease: easings.eases.inOutCirc },
        { to: "-14px", duration: 300, ease: easings.eases.inOutCirc },
        { to: "-4px", duration: 350, ease: easings.eases.inOutCirc },
        { to: "0px", duration: 400, ease: easings.eases.outCirc },
      ],
      y: [
        { to: "-6px", duration: 400, ease: easings.eases.outCirc },
        { to: "2px", duration: 300, ease: easings.eases.inOutCirc },
        { to: "-10px", duration: 350, ease: easings.eases.inOutCirc },
        { to: "-4px", duration: 500, ease: easings.eases.inOutCirc },
        { to: "4px", duration: 300, ease: easings.eases.inOutCirc },
        { to: "-8px", duration: 350, ease: easings.eases.inOutCirc },
        { to: "0px", duration: 400, ease: easings.eases.outCirc },
      ],
      rotate: [
        { to: "8deg", duration: 400, ease: easings.eases.outCirc },
        { to: "-4deg", duration: 300, ease: easings.eases.inOutCirc },
        { to: "12deg", duration: 350, ease: easings.eases.inOutCirc },
        { to: "-10deg", duration: 500, ease: easings.eases.inOutCirc },
        { to: "6deg", duration: 300, ease: easings.eases.inOutCirc },
        { to: "-8deg", duration: 350, ease: easings.eases.inOutCirc },
        { to: "0deg", duration: 400, ease: easings.eases.outCirc },
      ],
      scale: [
        { to: 1, duration: 700 },
        { to: 1.15, duration: 150, ease: easings.eases.outCirc },
        { to: 1, duration: 200, ease: easings.spring({ stiffness: 300, damping: 10 }) },
        { to: 1, duration: 800 },
        { to: 1.1, duration: 150, ease: easings.eases.outCirc },
        { to: 1, duration: 200, ease: easings.spring({ stiffness: 300, damping: 10 }) },
      ],
      delay: 2600,
      loop: true,
      loopDelay: 2000,
    });
  }, []);

  // Exit animation. Owned here rather than by the caller, so this component
  // stays the only thing that touches its own DOM.
  useEffect(() => {
    if (!exiting || !hintRef.current) return;

    animate(hintRef.current, {
      opacity: {
        to: 0,
        duration: 500,
        ease: easings.eases.inOutCirc,
      },
      y: {
        to: "1.5rem",
        duration: 600,
        ease: easings.eases.inCirc,
      },
      onComplete: () => onExited?.(),
    });
  }, [exiting, onExited]);

  return (
    <div className="pointer-hint" ref={hintRef}>
      <img src="/pointer.svg" alt="" className="pointer-icon" ref={iconRef} />
      <span className="pointer-text">Drag around to move your fish</span>
    </div>
  );
}
