import { useEffect } from "react";
import { animate, easings } from "animejs";
import "./styles/PointerHint.css";

export default function PointerHint() {
  useEffect(() => {
    // Fade in the whole hint container
    animate(".pointer-hint", {
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
    } as any);

    // Organic curved motion - traces a smooth loop pattern
    animate(".pointer-icon", {
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
    } as any);
  }, []);

  return (
    <div className="pointer-hint">
      <img src="/pointer.svg" alt="" className="pointer-icon" />
      <span className="pointer-text">Drag around to move your fish</span>
    </div>
  );
}
