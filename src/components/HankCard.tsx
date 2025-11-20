import { useEffect, useRef, useState } from "react";
import "./styles/HankCard.css";
import { animate, stagger, splitText, easings } from "animejs";
import ButtonContent from "./ButtonContent";

interface IHankCard {
  scatterCallback: (shouldScatter: boolean) => void;
}

export default function HankCard(props: IHankCard) {
  const scatterCallback = props.scatterCallback;
  let contentHeight = 48;
  let buttonWidth = 178;
  const [bigButton, setBigButton] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);

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
    //const path = document.querySelector(".chevron .yeet") as SVGPathElement;

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

    const el = buttonRef.current;
    if (!el) return;

    el.addEventListener("click", toggle);
    el.addEventListener("keydown", keyHandler);

    return () => {
      el.removeEventListener("click", toggle);
      el.removeEventListener("keydown", keyHandler);
    };
  }, []);

  const keyHandler = (e: KeyboardEvent) => {
    if (e.key === "Enter") toggle();
  };

  const toggle = () => {
    const hankcard = document.getElementsByClassName("HankCard")[0];

    hankcard.classList.toggle("big");

    const gettinBigger = hankcard.classList.contains("big");
    scatterCallback(gettinBigger);
    setBigButton(gettinBigger);
    console.log(bigButton);

    if (gettinBigger) {
      buttonRef.current?.removeEventListener("click", toggle);
      buttonRef.current?.removeEventListener("keydown", keyHandler);

      contentHeight =
        contentHeight == 0
          ? document.getElementsByClassName("content")[0].clientHeight
          : contentHeight;
      buttonWidth =
        buttonWidth == 0
          ? document.getElementsByClassName("getStarted")[0].clientWidth
          : buttonWidth;

      console.log({ buttonWidth, contentHeight });

      animate(".getStarted", {
        width: {
          to: "100%",
          duration: 400,
          ease: easings.spring({ mass: 1 }),
        },
        borderRadius: {
          from: "5px",
          to: "25px",
          duration: 200,
        },
      });

      animate(".content", {
        height: {
          to: "75%",
          duration: `400`,
          ease: easings.spring({ mass: 1 }),
        },
      });
    } else {
      buttonRef.current?.addEventListener("click", toggle);
      buttonRef.current?.addEventListener("keydown", keyHandler);
      animate(".getStarted", {
        width: {
          from: "100%",
          to: `${buttonWidth}px`,
          duration: 1200,
          ease: easings.spring({ mass: 1 }),
        },
        borderRadius: {
          to: "5px",
          duration: 200,
        },
      });

      animate(".content", {
        height: {
          from: "75%",
          to: `${contentHeight}px`,
          duration: 1200,
          ease: easings.spring({ mass: 1 }),
        },
      });
    }
  };

  return (
    <main>
      <div className="constraint">
        <div className="HankCard">
          <div className="title row">
            <img className="sparkle" src="sparkle.svg" />
            <div className="column">
              <h1>HANK BERGER</h1>
              <h2>Frontend Engineer</h2>
            </div>
          </div>

          <div className="content">
            <div
              ref={buttonRef}
              role="button"
              tabIndex={0}
              className={`getStarted`}
            >
              <ButtonContent bigButton={bigButton} closeCallback={toggle} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
