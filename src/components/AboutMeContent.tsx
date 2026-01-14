import { useEffect, useState } from "react";
import "./styles/AboutMeContent.css";
import { animate, easings, stagger } from "animejs";

interface IAboutMeContent {
  closeCallback: () => void;
}

export default function AboutMeContent(props: IAboutMeContent) {
  const { closeCallback } = props;
  const [introVideoDone, setIntroVideoDone] = useState(false);

  useEffect(() => {
    animate(".frame", {
      width: {
        to: "100px",
        duration: 1200,
        delay: stagger(100, { start: 100 }),
        ease: easings.eases.outCirc,
      },
      height: {
        to: "100px",
        duration: 1200,
        delay: stagger(100, { start: 100 }),
        ease: easings.eases.outCirc,
      },
      opacity: {
        from: 0,
        to: 1,
        duration: 400,
      },
    });
  }, []);

  function isSafari() {
    if (typeof navigator === "undefined") return false;
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  }

  const safari = isSafari();

  const introSrc = safari ? "first.mov" : "first.webm";
  const loopSrc = safari ? "test.mov" : "test.webm";

  return (
    <div className="AboutMeContent">
      <div className="menu">
        <button onClick={closeCallback} className="backButton">
          <svg
            fill="#ffffff"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 640 640"
          >
            <path d="M169.4 297.4C156.9 309.9 156.9 330.2 169.4 342.7L361.4 534.7C373.9 547.2 394.2 547.2 406.7 534.7C419.2 522.2 419.2 501.9 406.7 489.4L237.3 320L406.6 150.6C419.1 138.1 419.1 117.8 406.6 105.3C394.1 92.8 373.8 92.8 361.3 105.3L169.3 297.3z" />
          </svg>
          Back to the fish
        </button>
      </div>
      <div className="restOfDaCard row">
        <div className="realStuff">
          <div className="section firstSection">
            <div className="introGraphic">
              <video
                src={loopSrc}
                autoPlay
                muted
                loop
                playsInline
                style={{ opacity: introVideoDone ? 1 : 0 }}
                // @ts-ignore
                webkit-playsinline="true"
              />
              <video
                src={introSrc}
                autoPlay
                muted
                playsInline
                loop={false}
                onEnded={() => setIntroVideoDone(true)}
                style={{ opacity: introVideoDone ? 0 : 1 }}
                // @ts-ignore
                webkit-playsinline="true"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
