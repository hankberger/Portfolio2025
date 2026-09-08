import { useEffect, useRef, useState } from "react";
import "./styles/HankCard.css";
import { animate, stagger, splitText, easings } from "animejs";
import { getVideoSrc } from "../util/browserDetection";
import VRButton from "./VRButton";

interface IHankCard {
  /** Fired when the card expands or collapses. */
  onExpandChange?: (expanded: boolean) => void;
  vrSupported?: boolean;
  vrActive?: boolean;
  onToggleVR?: () => void;
}

export default function HankCard(props: IHankCard) {
  const [bigButton, setBigButton] = useState(false);
  const hasToggled = useRef(false);

  // Stagger the heading in character by character. Each heading gets its own
  // stagger so they reveal in parallel rather than one after the other.
  useEffect(() => {
    const revealChars = (selector: string) => {
      const { chars } = splitText(selector, { words: false, chars: true });
      animate(chars, {
        opacity: {
          from: 0,
          to: 1,
          // "linear" is what this has always actually done. The old
          // `easings.eases.inBounce(1)` *called* the ease function at t=1,
          // producing the number 1 rather than an ease — anime.js then fell
          // back to linear. For the bounce that was presumably intended, pass
          // the function itself: `ease: easings.eases.inBounce`.
          ease: "linear",
          duration: 400,
          delay: stagger(55, { start: 100 }),
        },
        x: [{ from: "1rem", to: "0rem", delay: stagger(50, { start: 100 }) }],
      });
    };

    // Scope to the card: PostContent is mounted (hidden) from page load for
    // SEO, so a bare "h1"/"h2" selector would also split its headings.
    revealChars(".HankCard h1");
    // Keep the subtitle intact so narrow screens wrap at word boundaries.
  }, []);

  useEffect(() => {
    animate(".getStarted", {
      opacity: {
        from: 0,
        to: 1,
        ease: "linear", // see the note in the heading reveal above
        delay: 0,
        duration: 400,
      },
      y: [{ from: ".5rem", to: "0rem", delay: 0 }],
    });
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
      });
    }
  }, [bigButton]);

  const toggle = () => {
    hasToggled.current = true;
    const expanded = !bigButton;
    setBigButton(expanded);
    props.onExpandChange?.(expanded);
  };

  // Fade in new button after state change (same as mount animation)
  useEffect(() => {
    if (!hasToggled.current) return;

    animate(".getStarted", {
      opacity: {
        from: 0,
        to: 1,
        ease: "linear", // see the note in the heading reveal above
        delay: 200,
        duration: 400,
      },
      y: [{ from: "0.5rem", to: "0rem", delay: 200 }],
    });
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
                webkit-playsinline="true"
              />
            </>
          )}
        </div>
        <div className="column">
          <h1>HANK BERGER</h1>
          <h2>Software Developer & Motion Designer </h2>
          <div className="ctaRow">
            <button
              className={`getStarted${bigButton ? " active" : ""}`}
              onClick={toggle}
              aria-expanded={bigButton}
              aria-controls="portfolio-content"
            >
            <span className="buttonContent">
              {!bigButton ? (
                <>
                  View my work
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
            {props.vrSupported && (
              <VRButton
                active={!!props.vrActive}
                onToggle={() => props.onToggleVR?.()}
              />
            )}
          </div>
          <p className="hero-description">Interactive websites, 3D experiences, and motion design.</p>
          <nav className="hero-links" aria-label="Contact and résumé" data-fish-ignore>
            <a href="/resume" target="_blank" rel="noopener noreferrer">Résumé</a>
            <a href="https://linkedin.com/in/hankberger" target="_blank" rel="noopener noreferrer">Connect on LinkedIn</a>
          </nav>
        </div>
      </div>
    </div>
  );
}
