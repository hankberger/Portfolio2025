import React, { useEffect, useRef } from "react";
import "./styles/HankCard.css";
import { animate, stagger, splitText, spring, easings } from "animejs";

export default function HankCard() {
  const navbarRef = useRef<HTMLElement>(null);

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

    animate(document.getElementsByClassName("divider")[0], {
      width: {
        from: 0,
        to: "calc(100% - 4.5rem)",
        duration: 600,
        delay: 1300,
      },
      height: {
        from: 0,
        to: "calc(100%)",
        duration: 1000,
        ease: easings.spring({ mass: 2 }),
        delay: 1300,
      },
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
        <div className="divider"></div>
      </div>

      {/* <nav>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
            <path
              d="M341.8 72.6C329.5 61.2 310.5 61.2 298.3 72.6L74.3 280.6C64.7 289.6 61.5 303.5 66.3 315.7C71.1 327.9 82.8 336 96 336L112 336L112 512C112 547.3 140.7 576 176 576L464 576C499.3 576 528 547.3 528 512L528 336L544 336C557.2 336 569 327.9 573.8 315.7C578.6 303.5 575.4 289.5 565.8 280.6L341.8 72.6zM304 384L336 384C362.5 384 384 405.5 384 432L384 528L256 528L256 432C256 405.5 277.5 384 304 384z"
              fill="#ffffffff"
            />
          </svg>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
            <path
              d="M341.8 72.6C329.5 61.2 310.5 61.2 298.3 72.6L74.3 280.6C64.7 289.6 61.5 303.5 66.3 315.7C71.1 327.9 82.8 336 96 336L112 336L112 512C112 547.3 140.7 576 176 576L464 576C499.3 576 528 547.3 528 512L528 336L544 336C557.2 336 569 327.9 573.8 315.7C578.6 303.5 575.4 289.5 565.8 280.6L341.8 72.6zM304 384L336 384C362.5 384 384 405.5 384 432L384 528L256 528L256 432C256 405.5 277.5 384 304 384z"
              fill="#ffffffff"
            />
          </svg>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
            <path
              d="M341.8 72.6C329.5 61.2 310.5 61.2 298.3 72.6L74.3 280.6C64.7 289.6 61.5 303.5 66.3 315.7C71.1 327.9 82.8 336 96 336L112 336L112 512C112 547.3 140.7 576 176 576L464 576C499.3 576 528 547.3 528 512L528 336L544 336C557.2 336 569 327.9 573.8 315.7C578.6 303.5 575.4 289.5 565.8 280.6L341.8 72.6zM304 384L336 384C362.5 384 384 405.5 384 432L384 528L256 528L256 432C256 405.5 277.5 384 304 384z"
              fill="#ffffffff"
            />
          </svg>
        </nav> */}
    </div>
  );
}
