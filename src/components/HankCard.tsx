import { useEffect, useRef, useState } from "react";
import "./styles/HankCard.css";
import { animate, stagger, splitText, easings } from "animejs";
import { getVideoSrc } from "../util/browserDetection";

interface IHankCard {
  scatterCallback: (shouldScatter: boolean) => void;
  onExpandChange?: (expanded: boolean) => void;
}

export default function HankCard(props: IHankCard) {
  const scatterCallback = props.scatterCallback;
  const [bigButton, setBigButton] = useState(false);
  const hasToggled = useRef(false);

  useEffect(() => {
    const { chars } = splitText("h1", { words: false, chars: true });
    animate(chars, {
      opacity: {
        from: 0,
        to: 1,
        ease: easings.eases.inBounce(1),
        duration: 400,
        delay: stagger(55, { start: 1200 }),
      },
      x: [{ from: "1rem", to: "0rem", delay: stagger(50, { start: 1200 }) }],
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
        delay: stagger(55, { start: 1200 }),
      },
      x: [{ from: "1rem", to: "0rem", delay: stagger(50, { start: 1200 }) }],
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
        delay: 1750,
        duration: 400,
      },
      y: [{ from: ".5rem", to: "0rem", delay: 1750 }],
    } as any);
  }, []);

  useEffect(() => {
    if (!bigButton) {
      animate(".chevronPath", {
        translateX: [
          { from: 0, to: 150 },
          { from: 150, to: 0 },
        ],
        duration: 2400,
        ease: easings.eases.inOutCirc,
        loop: true,
      } as any);
    }
  }, [bigButton]);

  const toggle = async () => {
    hasToggled.current = true;

    // Scroll to top instantly before collapsing (back to the fish)
    if (bigButton) {
      const container = document.querySelector(".constraint");
      if (container) {
        container.scrollTop = 0;
      }
    }

    scatterCallback(!bigButton);
    props.onExpandChange?.(!bigButton);
    // Fade out current button (moves down, mirrors the fade in)
    await animate(".getStarted", {
      opacity: {
        from: 1,
        to: 0,
        duration: 200,
        ease: easings.eases.outQuad,
      },
      y: [{ from: "0rem", to: "0.5rem", ease: easings.eases.outQuad }],
      duration: 200,
      ease: easings.eases.outQuad,
    } as any).then(() => {
      setBigButton(!bigButton);
    });
  };

  // Fade in new button after state change (same as mount animation)
  useEffect(() => {
    if (!hasToggled.current) return;

    animate(".getStarted", {
      opacity: {
        from: 0,
        to: 1,
        ease: easings.eases.inBounce(1),
        delay: 200,
        duration: 400,
      },
      y: [{ from: "0.5rem", to: "0rem", delay: 200 }],
    } as any);
  }, [bigButton]);

  const [introVideoDone, setIntroVideoDone] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const introVideoRef = useRef<HTMLVideoElement>(null);

  const introSrc = getVideoSrc("first");
  const loopSrc = getVideoSrc("test");

  const handleVideoLoaded = () => {
    const video = introVideoRef.current;
    if (!video) return;

    video.play().catch(() => {
      setVideoFailed(true);
    });
  };

  return (
    <div className="HankCard">
      <div className="title row">
        <div className="video-container">
          {videoFailed ? (
            <img src="/fallback.webp" alt="" className="fallback-image" />
          ) : (
            <>
              <video
                src={loopSrc}
                autoPlay
                muted
                loop
                playsInline
                style={{ opacity: introVideoDone ? 1 : 0 }}
                onError={() => setVideoFailed(true)}
                // @ts-ignore
                webkit-playsinline="true"
              />
              <video
                ref={introVideoRef}
                src={introSrc}
                autoPlay
                muted
                playsInline
                loop={false}
                onEnded={() => setIntroVideoDone(true)}
                onError={() => setVideoFailed(true)}
                onLoadedData={handleVideoLoaded}
                style={{ opacity: introVideoDone ? 0 : 1 }}
                // @ts-ignore
                webkit-playsinline="true"
              />
            </>
          )}
        </div>
        <div className="column">
          <h1>HANK BERGER</h1>
          <h2>Developer & Motion Designer </h2>
          <button
            className={`getStarted${bigButton ? " active" : ""}`}
            onClick={toggle}
          >
            <span className="buttonContent">
              {!bigButton ? (
                <>
                  Get Started
                  <svg
                    className="buttonIcon"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 640 640"
                  >
                    <path
                      className="chevronPath"
                      fill="white"
                      d="M212.5 205.5C251.7 172.5 304.6 144 368 144C431.4 144 484.3 172.5 523.5 205.5C562.6 238.5 590.4 277.9 604.5 305.3C609.2 314.5 609.2 325.4 604.5 334.6C590.4 362 562.6 401.4 523.5 434.4C484.3 467.5 431.5 495.9 368 495.9C304.5 495.9 251.7 467.4 212.5 434.4C196.3 420.7 182 405.9 169.8 391.3L80.1 443.6C67.6 450.9 51.7 448.9 41.4 438.7C31.1 428.5 29 412.7 36.1 400.1L82 320L36.2 239.9C29 227.3 31.2 211.5 41.5 201.3C51.8 191.1 67.6 189.1 80.2 196.4L169.9 248.7C182.1 234.1 196.4 219.3 212.6 205.6zM480 320C480 302.3 465.7 288 448 288C430.3 288 416 302.3 416 320C416 337.7 430.3 352 448 352C465.7 352 480 337.7 480 320z"
                    />
                  </svg>
                </>
              ) : (
                <>
                  <svg
                    className="buttonIcon"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 640 640"
                  >
                    <path
                      fill="white"
                      d="M169.4 297.4C156.9 309.9 156.9 330.2 169.4 342.7L361.4 534.7C373.9 547.2 394.2 547.2 406.7 534.7C419.2 522.2 419.2 501.9 406.7 489.4L237.3 320L406.6 150.6C419.1 138.1 419.1 117.8 406.6 105.3C394.1 92.8 373.8 92.8 361.3 105.3L169.3 297.3z"
                    />
                  </svg>
                  Back to the fish
                </>
              )}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
