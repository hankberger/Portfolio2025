import { Fragment, useEffect, useRef } from "react";
import { animate, easings } from "animejs";
import "./styles/AboutMe.css";

interface IAboutMe {
  visible: boolean;
}

const skills = [
  {
    id: "web",
    label: "Web",
    description: "React, Three.js, WebGL, Node.js",
  },
  {
    id: "mobile",
    label: "Mobile",
    description: "React Native, iOS, Android",
  },
  {
    id: "animation",
    label: "Animation",
    description: "Motion design, Shaders, 3D",
  },
];

export default function AboutMe({ visible }: IAboutMe) {
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (visible && !hasAnimated.current) {
      hasAnimated.current = true;

      animate(".about-me .section-header", {
        opacity: [0, 1],
        y: ["1rem", "0rem"],
        delay: 700,
        duration: 600,
        ease: easings.eases.outQuart,
      });

      animate(".about-me .section-rule", {
        scaleX: [0, 1],
        delay: 700,
        duration: 600,
        ease: easings.eases.outQuart,
      });

      animate(".about-me .skill-detail, .about-me .skill-divider", {
        opacity: [0, 1],
        y: ["0.75rem", "0rem"],
        delay: 700,
        duration: 600,
        ease: easings.eases.outQuart,
      });

      animate(".about-me .about-description", {
        opacity: [0, 1],
        y: ["1rem", "0rem"],
        delay: 700,
        duration: 600,
        ease: easings.eases.outQuart,
      });
    }

    if (!visible) {
      hasAnimated.current = false;
    }
  }, [visible]);

  // Rendered even while PostContent is hidden, so the content is in the DOM
  // for crawlers. Animations above still key off `visible`.
  return (
    <div className="about-me">
      <div className="section-header">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
        <div className="currently">About Me</div>
        <div className="section-rule" />
      </div>

      <div className="about-me-content">
        <div className="skill-details">
          {skills.map((skill, i) => (
            <Fragment key={skill.id}>
              {i > 0 && <div className="skill-divider" />}
              <div className="skill-detail">
                <span className="skill-detail-label">{skill.label}</span>
                <span className="skill-detail-desc">{skill.description}</span>
              </div>
            </Fragment>
          ))}
        </div>

        <div className="about-description">
          <p>
            I've been obsessed with digital art and programming for almost a
            decade now. What started as two separate hobbies has now become an
            insanely synergistic skillset, empowering me to create
            incredible experiences.
          </p>
        </div>
      </div>
    </div>
  );
}
