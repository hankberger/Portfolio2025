import { useEffect } from "react";
import { animate, easings } from "animejs";
import "./styles/VRButton.css";

interface VRButtonProps {
  active: boolean;
  onToggle: () => void;
}

// Only rendered when the browser reports immersive-vr support (see App.tsx),
// so desktop/mobile visitors never see it.
export default function VRButton({ active, onToggle }: VRButtonProps) {
  useEffect(() => {
    animate(".vr-button", {
      opacity: {
        from: 0,
        to: 1,
        duration: 600,
        delay: 1500,
        ease: easings.eases.outCirc,
      },
      y: {
        from: "1rem",
        to: "0rem",
        duration: 800,
        delay: 1500,
        ease: easings.spring({ mass: 1, stiffness: 80 }),
      },
    } as any);
  }, []);

  return (
    <button className="vr-button" onClick={onToggle}>
      <span className={`vr-button-dot${active ? " active" : ""}`} />
      <span className="vr-button-label">
        {active ? "Exit VR" : "Enter VR"}
      </span>
    </button>
  );
}
