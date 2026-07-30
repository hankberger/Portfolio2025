import { useEffect } from "react";
import { animate } from "animejs";
import "./styles/VRButton.css";

interface VRButtonProps {
  active: boolean;
  onToggle: () => void;
}

// Only rendered when the browser reports immersive-vr support (see App.tsx),
// so desktop/mobile visitors never see it.
export default function VRButton({ active, onToggle }: VRButtonProps) {
  useEffect(() => {
    // Entrance mirrors the Get Started button it sits beside
    animate(".vr-button", {
      opacity: {
        from: 0,
        to: 1,
        // Matches the Get Started button — see the note in HankCard.tsx.
        ease: "linear",
        delay: 1750,
        duration: 400,
      },
      y: [{ from: ".5rem", to: "0rem", delay: 1750 }],
    });
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
