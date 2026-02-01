import { useEffect, useRef } from "react";
import { animate, stagger, easings } from "animejs";
import "./styles/AboutMe.css";

interface IAboutMe {
  visible: boolean;
}

const skills = [
  {
    id: "web",
    label: "Web",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
      </svg>
    ),
    description: "React, Three.js, WebGL, Node.js",
  },
  {
    id: "mobile",
    label: "Mobile",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z" />
      </svg>
    ),
    description: "React Native, iOS, Android",
  },
  {
    id: "animation",
    label: "Animation",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M7.5 5.6L10 7 8.6 4.5 10 2 7.5 3.4 5 2l1.4 2.5L5 7zm12 9.8L17 14l1.4 2.5L17 19l2.5-1.4L22 19l-1.4-2.5L22 14zM22 2l-2.5 1.4L17 2l1.4 2.5L17 7l2.5-1.4L22 7l-1.4-2.5zm-7.63 5.29a.996.996 0 0 0-1.41 0L1.29 18.96a.996.996 0 0 0 0 1.41l2.34 2.34c.39.39 1.02.39 1.41 0L16.7 11.05a.996.996 0 0 0 0-1.41l-2.33-2.35zm-1.03 5.49l-2.12-2.12 2.44-2.44 2.12 2.12-2.44 2.44z" />
      </svg>
    ),
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
      } as any);

      animate(".about-me .about-tagline, .about-me .about-description", {
        opacity: [0, 1],
        y: ["1rem", "0rem"],
        delay: 800,
        duration: 600,
        ease: easings.eases.outQuart,
      } as any);

      animate(".about-me .skill-detail", {
        opacity: [0, 1],
        y: ["1rem", "0rem"],
        delay: stagger(100, { start: 1000 }),
        duration: 600,
        ease: easings.eases.outQuart,
      } as any);
    }

    if (!visible) {
      hasAnimated.current = false;
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="about-me">
      <div className="section-header">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
        <div className="currently">About Me</div>
      </div>

      <div className="about-me-content">
        <div className="about-tagline">
          <span className="tagline-text">
            Combining design + engineering to make cool sh*t
          </span>
        </div>

        <div className="about-description">
          <p>
            I've been obsessed with digital art and programming for almost a
            decade now. What started as two seperate hobbies has now become an
            insanely synergistic skillset - empowering me to create incredible
            experiences.
          </p>
        </div>

        <div className="skill-details">
          {skills.map((skill) => (
            <div key={skill.id} className="skill-detail">
              <div className="skill-detail-icon">{skill.icon}</div>
              <div className="skill-detail-info">
                <span className="skill-detail-label">{skill.label}</span>
                <span className="skill-detail-desc">{skill.description}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
