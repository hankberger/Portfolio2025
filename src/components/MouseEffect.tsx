import { useEffect } from "react";
import "./styles/MouseEffect.css";
import { createAnimatable, utils, stagger } from "animejs";
import { getMemoryLengthFromType } from "three/src/nodes/core/NodeUtils.js";

export default function MouseEffect() {
  useEffect(() => {
    const circles = createAnimatable(".circle", {
      x: stagger(200, { from: "first", start: 200 }),
      y: stagger(200, { from: "first", start: 200 }),
      ease: "out(4)",
    });

    const onMouseMove = (e: MouseEvent) => {
      circles.x(e.clientX - 5).y(e.clientY - 5);
    };

    window.addEventListener("mousemove", onMouseMove);
  });

  return (
    <>
      <div className="circle"></div>
      <div className="circle"></div>
      <div className="circle"></div>
    </>
  );
}
