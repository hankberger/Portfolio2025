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
              {introVideoDone ? (
                <video src="test.webm" autoPlay muted loop></video>
              ) : (
                <video
                  src="first.webm"
                  autoPlay
                  muted
                  onEnded={() => {
                    setIntroVideoDone(true);
                  }}
                ></video>
              )}
            </div>
            <div className="intro">
              <h3>Welcome</h3>
              <a>
                <svg
                  fill="#ffffff"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 640 640"
                >
                  <path d="M581.7 188.1C575.5 164.4 556.9 145.8 533.4 139.5C490.9 128 320.1 128 320.1 128C320.1 128 149.3 128 106.7 139.5C83.2 145.8 64.7 164.4 58.4 188.1C47 231 47 320.4 47 320.4C47 320.4 47 409.8 58.4 452.7C64.7 476.3 83.2 494.2 106.7 500.5C149.3 512 320.1 512 320.1 512C320.1 512 490.9 512 533.5 500.5C557 494.2 575.5 476.3 581.8 452.7C593.2 409.8 593.2 320.4 593.2 320.4C593.2 320.4 593.2 231 581.8 188.1zM264.2 401.6L264.2 239.2L406.9 320.4L264.2 401.6z" />
                </svg>
                Watch how I made this
              </a>
              <div>
                Hey! I'm Hank. I'm a web, mobile, and animation expert.
                <br />I love pushing technology to the limit to create joyful
                experiences.
              </div>
            </div>
          </div>
          <div className="section">
            <h3>Anotha section</h3>
            <div>TODO: Add more content</div>
          </div>
        </div>
      </div>
    </div>
  );
}
