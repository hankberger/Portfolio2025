import React, { useEffect, useRef } from "react";
import "./styles/HankCard.css";
import { animate, stagger, splitText, spring, easings, svg } from "animejs";

export default function HankCard() {
  const navbarRef = useRef<HTMLElement>(null);
  const chevronPathRef = useRef<SVGPathElement>(null); // <— path we morph

  useEffect(() => {
    const { chars } = splitText("h1", { words: false, chars: true });
    animate(chars, {
      opacity: {
        from: 0,
        to: 1,
        ease: easings.eases.inBounce(1),
        duration: 400,
        delay: stagger(55),
      },
      x: [{ from: "1rem", to: "0rem", delay: stagger(50) }],
    } as any);
  }, []);

  useEffect(() => {
    const { chars } = splitText("h2", { words: false, chars: true });
    animate(chars, {
      opacity: {
        from: 0,
        to: 1,
        ease: easings.eases.inBounce(1),
        duration: 400,
        delay: stagger(55),
      },
      x: [{ from: "1rem", to: "0rem", delay: stagger(50) }],
    } as any);
  }, []);

  useEffect(() => {
    const sparkle = document.getElementsByClassName("sparkle");
    animate(sparkle, {
      opacity: {
        from: 0,
        to: 1,
        ease: easings.eases.inBounce(1),
        duration: 400,
      },
      x: [{ from: "1rem", to: "0rem", delay: stagger(50) }],
    } as any);
  }, []);

  useEffect(() => {
    animate(".getStarted", {
      opacity: {
        from: 0,
        to: 1,
        ease: easings.eases.inBounce(1),
        delay: 800,
        duration: 400,
      },
      y: [{ from: ".5rem", to: "0rem", delay: 800 }],
    } as any);
  }, []);

  return (
    <div className="HankCard">
      <div className="title row">
        <img className="sparkle" src="sparkle.svg" />
        <div className="column">
          <h1>HANK BERGER</h1>
          <h2>Frontend Developer</h2>
        </div>
      </div>

      <div className="content">
        <button className="getStarted">
          Get Started
          <svg
            className="chevron"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 640 640"
            fill="white"
          >
            {/* Hidden fish target path (in <defs> so it's not rendered) */}
            <defs>
              <path
                id="fish-shape"
                d="M212.5 205.5C251.7 172.5 304.6 144 368 144C431.4 144 484.3 172.5 523.5 205.5C562.6 238.5 590.4 277.9 604.5 305.3C609.2 314.5 609.2 325.4 604.5 334.6C590.4 362 562.6 401.4 523.5 434.4C484.3 467.5 431.5 495.9 368 495.9C304.5 495.9 251.7 467.4 212.5 434.4C196.3 420.7 182 405.9 169.8 391.3L80.1 443.6C67.6 450.9 51.7 448.9 41.4 438.7C31.1 428.5 29 412.7 36.1 400.1L82 320L36.2 239.9C29 227.3 31.2 211.5 41.5 201.3C51.8 191.1 67.6 189.1 80.2 196.4L169.9 248.7C182.1 234.1 196.4 219.3 212.6 205.6zM480 320C480 302.3 465.7 288 448 288C430.3 288 416 302.3 416 320C416 337.7 430.3 352 448 352C465.7 352 480 337.7 480 320z"
              />
            </defs>

            {/* Chevron path we actually morph */}
            <path
              ref={chevronPathRef}
              className="yeet"
              d="M471.1 297.4C483.6 309.9 483.6 330.2 471.1 342.7L279.1 534.7C266.6 547.2 246.3 547.2 233.8 534.7C221.3 522.2 221.3 501.9 233.8 489.4L403.2 320L233.9 150.6C221.4 138.1 221.4 117.8 233.9 105.3C246.4 92.8 266.7 92.8 279.2 105.3L471.2 297.3z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
