import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { animate, stagger, easings } from "animejs";
import { createProjectLinkGesture } from "./projectLinkGesture";
import "./styles/ProjectsSection.css";

interface IProjectsSection {
  visible: boolean;
}

const projects = [
  {
    id: "project-4",
    name: "Banana City",
    title: ["Banana", "City"],
    description: "A collaborative world built using Nano Banana",
    blurb:
      "A shared 3D city that anyone can add to. Visitors generate a building with Nano Banana, drop it on an open lot, and it joins the skyline for everyone who shows up after them.",
    tags: ["Three.js", "Web", "3D"],
    gradient: "linear-gradient(135deg, #1f2937, #f59e0b)",
    accent: "rgba(245, 158, 11, 0.45)",
    image: "/dolp.webp",
    link: "https://banana.h4nk.com/",
  },
  {
    id: "project-3",
    name: "2022 Portfolio",
    title: ["2022", "Portfolio"],
    description: "My previous portfolio site for showing off coding and art",
    blurb:
      "The site this one replaced. A WebGL portfolio built to put my code and my 3D art on the same page — still online because I like the way it moves.",
    tags: ["Web", "Design"],
    gradient: "linear-gradient(135deg, #f093fb, #f5576c)",
    accent: "rgba(245, 87, 108, 0.45)",
    image: "/portfolio2022.webp",
    link: "https://portfolio2022.hanksberger.workers.dev/",
  },
  {
    id: "project-1",
    name: "Motion Planning",
    title: ["Motion", "Planning"],
    description: "Agents navigating dynamic obstacles in real-time 3D",
    blurb:
      "A real-time playground for path planning. Agents negotiate a field of moving obstacles and re-plan every frame, with the search drawn on top so you can watch the algorithm think.",
    tags: ["Three.js", "Web", "Animation"],
    gradient: "linear-gradient(135deg, #667eea, #764ba2)",
    accent: "rgba(139, 156, 255, 0.5)",
    image: "/pathplanning.webp",
    link: "https://hankberger.github.io/PathPlanningThreeJS/",
  },
  {
    id: "project-2",
    name: "Gaussian Splatting",
    title: ["Gaussian", "Splatting"],
    description: "Mobile app for capturing 3D scenes from your phone",
    blurb:
      "Point your phone at something, walk around it, and get a 3D scene back. A capture app that feeds photogrammetry into a Gaussian splat pipeline and renders the result on device.",
    tags: ["Mobile", "Python"],
    gradient: "linear-gradient(135deg, #4facfe, #00f2fe)",
    accent: "rgba(79, 172, 254, 0.5)",
    image: "/splatapp.webp",
    video: true,
    link: "https://assets.h4nk.com/splatapp.mp4",
  },
];

export default function ProjectsSection({ visible }: IProjectsSection) {
  const hasAnimated = useRef(false);
  const [linkGesture] = useState(createProjectLinkGesture);

  // The page scrolls vertically under the buttons, so a flick that happens to
  // start on one must not open the project.
  useEffect(() => {
    if (!visible) return;
    const move = (event: PointerEvent) =>
      linkGesture.move(event.pointerId, event.clientX, event.clientY);
    const end = (event: PointerEvent) =>
      linkGesture.end(event.pointerId, event.clientX, event.clientY);
    const cancel = (event: PointerEvent) => linkGesture.cancel(event.pointerId);
    const scroll = () => linkGesture.scroll(performance.now());
    document.addEventListener("pointerdown", linkGesture.reset, { capture: true, passive: true });
    document.addEventListener("pointermove", move, { capture: true, passive: true });
    document.addEventListener("pointerup", end, { capture: true, passive: true });
    document.addEventListener("pointercancel", cancel, { capture: true, passive: true });
    document.addEventListener("scroll", scroll, { capture: true, passive: true });
    return () => {
      document.removeEventListener("pointerdown", linkGesture.reset, true);
      document.removeEventListener("pointermove", move, true);
      document.removeEventListener("pointerup", end, true);
      document.removeEventListener("pointercancel", cancel, true);
      document.removeEventListener("scroll", scroll, true);
      linkGesture.reset();
    };
  }, [visible, linkGesture]);

  useEffect(() => {
    if (visible && !hasAnimated.current) {
      hasAnimated.current = true;

      animate(".projects-section .section-header", {
        opacity: [0, 1],
        y: ["1rem", "0rem"],
        delay: 900,
        duration: 600,
        ease: easings.eases.outQuart,
      });

      animate(".projects-section .section-rule", {
        scaleX: [0, 1],
        delay: 950,
        duration: 700,
        ease: easings.eases.outQuart,
      });

      animate(".project-poster", {
        opacity: [0, 1],
        y: ["1.5rem", "0rem"],
        delay: stagger(90, { start: 1000 }),
        duration: 650,
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
    <div className="projects-section">
      <div className="section-header">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z" />
        </svg>
        <div className="currently">Projects</div>
        <div className="section-rule" />
      </div>

      <div className="projects-list">
        {projects.map((project, i) => (
          <article
            key={project.id}
            className="project-poster"
            // Per-project border tint, so each card keeps a little of its own
            // personality without four sets of rules.
            style={{ "--poster-accent": project.accent } as CSSProperties}
          >
            <div className="poster-media">
              {project.image ? (
                <img src={project.image} alt="" draggable={false} loading="lazy" />
              ) : (
                <div className="poster-fill" style={{ background: project.gradient }} />
              )}
              <span
                className="poster-wash"
                style={{ background: project.gradient }}
                aria-hidden="true"
              />
            </div>

            <h3 className="poster-title">
              {project.title.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </h3>

            <div className="poster-panel">
              <p className="poster-blurb">{project.blurb}</p>
              <div className="poster-foot">
                <div className="poster-tags">
                  {project.tags.map((tag) => (
                    <span key={tag} className="poster-tag">
                      {tag}
                    </span>
                  ))}
                </div>
                {/* The button is the only hit target on the card. The play
                    triangle leads, the arrow follows, so both read left to right. */}
                <a
                  className="poster-button"
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  draggable={false}
                  aria-label={
                    project.video
                      ? `Watch the ${project.name} demo`
                      : `Take a look at ${project.name}`
                  }
                  onPointerDown={(event) => {
                    if (!event.isPrimary || event.button > 1) return;
                    linkGesture.start(i, event.pointerId, event.clientX, event.clientY, performance.now());
                  }}
                  onClick={(event) => {
                    if (!linkGesture.consume(i, event.detail)) event.preventDefault();
                  }}
                  onAuxClick={(event) => {
                    if (event.button === 1 && !linkGesture.consume(i, event.detail)) event.preventDefault();
                  }}
                >
                  {project.video && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                  {project.video ? "Watch the demo" : "Take a look"}
                  {!project.video && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                      <path d="M13.2 4.6 20.6 12l-7.4 7.4-1.5-1.4 4.9-5H3.4v-2h13.2l-4.9-5z" />
                    </svg>
                  )}
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
