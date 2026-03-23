import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { animate, stagger, easings } from "animejs";
import "./styles/ProjectsSection.css";

interface IProjectsSection {
  visible: boolean;
}

const projects = [
  {
    id: "project-3",
    name: "2022 Portfolio",
    description: "My previous portfolio site for showing off coding and art",
    tags: ["Web", "Design"],
    gradient: "linear-gradient(135deg, #f093fb, #f5576c)",
    image: "/portfolio2022.webp",
    link: "https://portfolio2022.hanksberger.workers.dev/",
  },
  {
    id: "project-1",
    name: "Motion Planning",
    description: "Agents navigating dynamic obstacles in real-time 3D",
    tags: ["Three.js", "Web", "Animation"],
    gradient: "linear-gradient(135deg, #667eea, #764ba2)",
    image: "/pathplanning.webp",
    link: "https://hankberger.github.io/PathPlanningThreeJS/",
  },
  {
    id: "project-2",
    name: "Gaussian Splatting",
    description: "Mobile app for capturing 3D scenes from your phone",
    tags: ["Mobile", "Python"],
    gradient: "linear-gradient(135deg, #4facfe, #00f2fe)",
    image: "/splatapp.webp",
    video: true,
    link: "https://assets.h4nk.com/splatapp.mp4",
  },
];

export default function ProjectsSection({ visible }: IProjectsSection) {
  const hasAnimated = useRef(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [scrollState, setScrollState] = useState({
    atStart: true,
    atEnd: false,
  });

  const focusedRef = useRef(0);
  const snapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSnapping = useRef(false);

  const updateTrackPadding = useCallback(() => {
    if (!carouselRef.current) return;
    const track = carouselRef.current;
    const card = track.querySelector(".project-card") as HTMLElement | null;
    if (!card) return;
    const pad = (track.clientWidth - card.offsetWidth) / 2;
    const left = track.querySelector(
      ".carousel-spacer-left",
    ) as HTMLElement | null;
    const right = track.querySelector(
      ".carousel-spacer-right",
    ) as HTMLElement | null;
    if (left) left.style.minWidth = `${pad}px`;
    if (right) right.style.minWidth = `${pad}px`;
  }, []);

  const updateCardScales = useCallback(() => {
    if (!carouselRef.current) return;
    const track = carouselRef.current;
    const trackRect = track.getBoundingClientRect();
    const trackCenter = trackRect.left + trackRect.width / 2;
    const cards = track.querySelectorAll(
      ".project-card",
    ) as NodeListOf<HTMLElement>;

    let closestIndex = 0;
    let closestDist = Infinity;

    cards.forEach((card, i) => {
      const cardRect = card.getBoundingClientRect();
      const cardCenter = cardRect.left + cardRect.width / 2;
      const dist = Math.abs(cardCenter - trackCenter);
      const maxDist = trackRect.width / 2;
      const t = Math.min(dist / maxDist, 1);

      card.style.scale = String(1.05 - t * 0.23);
      card.style.translate = `0 0 ${-t * 100}px`;
      card.style.opacity = String(1 - t * 0.6);

      if (dist < closestDist) {
        closestDist = dist;
        closestIndex = i;
      }
    });

    if (closestIndex !== focusedRef.current) {
      focusedRef.current = closestIndex;
      setFocusedIndex(closestIndex);
    }
  }, []);

  const scrollToIndex = useCallback((index: number) => {
    if (!carouselRef.current) return;
    const track = carouselRef.current;
    const cards = track.querySelectorAll(".project-card");
    const card = cards[index] as HTMLElement | undefined;
    if (!card) return;
    const cardCenter = card.offsetLeft + card.offsetWidth / 2;
    const scrollTarget = cardCenter - track.clientWidth / 2;
    track.scrollTo({ left: scrollTarget, behavior: "smooth" });
  }, []);

  const snapToNearest = useCallback(() => {
    if (!carouselRef.current) return;
    isSnapping.current = true;
    scrollToIndex(focusedRef.current);
    setTimeout(() => {
      isSnapping.current = false;
    }, 400);
  }, [scrollToIndex]);

  const updateScrollState = useCallback(() => {
    if (!carouselRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
    setScrollState({
      atStart: scrollLeft <= 5,
      atEnd: scrollLeft + clientWidth >= scrollWidth - 5,
    });
    updateCardScales();

    // Debounce snap — when scrolling stops, lock to nearest card
    if (!isSnapping.current) {
      if (snapTimer.current) clearTimeout(snapTimer.current);
      snapTimer.current = setTimeout(snapToNearest, 100);
    }
  }, [updateCardScales, snapToNearest]);

  const selectCard = (direction: "left" | "right") => {
    const next =
      direction === "left"
        ? Math.max(0, focusedIndex - 1)
        : Math.min(projects.length - 1, focusedIndex + 1);
    flushSync(() => setFocusedIndex(next));
    requestAnimationFrame(() => scrollToIndex(next));
  };

  useEffect(() => {
    if (visible && !hasAnimated.current) {
      hasAnimated.current = true;

      animate(".projects-section .section-header", {
        opacity: [0, 1],
        y: ["1rem", "0rem"],
        delay: 900,
        duration: 600,
        ease: easings.eases.outQuart,
      } as any);

      animate(".projects-section .section-rule", {
        scaleX: [0, 1],
        delay: 950,
        duration: 700,
        ease: easings.eases.outQuart,
      } as any);

      animate(".projects-carousel-container", {
        opacity: [0, 1],
        y: ["1rem", "0rem"],
        delay: 900,
        duration: 600,
        ease: easings.eases.outQuart,
      } as any);

      animate(".project-card", {
        y: ["1rem", "0rem"],
        delay: stagger(80, { start: 1000 }),
        duration: 500,
        ease: easings.eases.outQuart,
      } as any);
    }

    if (!visible) {
      hasAnimated.current = false;
    }
  }, [visible]);

  // Set track padding and apply initial scales on mount + resize
  useEffect(() => {
    if (!visible) return;
    updateTrackPadding();
    scrollToIndex(0);
    updateCardScales();
    const onResize = () => {
      updateTrackPadding();
      updateCardScales();
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, [visible, scrollToIndex, updateCardScales, updateTrackPadding]);

  if (!visible) return null;

  return (
    <div className="projects-section">
      <div className="section-header">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z" />
        </svg>
        <div className="currently">Projects</div>
        <div className="section-rule" />
      </div>

      <div className="projects-carousel-container">
        <button
          className="carousel-btn carousel-btn-left"
          onClick={() => selectCard("left")}
          aria-label="Scroll left"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div className="carousel-track-wrapper">
          <div
            className={`carousel-track ${scrollState.atStart ? "at-start" : ""} ${scrollState.atEnd ? "at-end" : ""}`}
            ref={carouselRef}
            onScroll={updateScrollState}
          >
            <div className="carousel-spacer-left" />
            {projects.map((project, i) => (
              <div
                key={project.id}
                className="project-card"
                onClick={() => {
                  if (focusedIndex === i && project.link) {
                    window.open(project.link, "_blank", "noopener,noreferrer");
                  } else {
                    flushSync(() => setFocusedIndex(i));
                    requestAnimationFrame(() => scrollToIndex(i));
                  }
                }}
              >
                <div
                  className="project-card-image"
                  style={
                    project.image ? undefined : { background: project.gradient }
                  }
                >
                  {project.image && (
                    <img src={project.image} alt={project.name} />
                  )}
                </div>
                <div className="project-card-info">
                  <div className="project-name">
                    {project.name}
                    {project.link && (
                      <svg
                        className="project-link-icon"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                      >
                        {project.video ? (
                          <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
                        ) : (
                          <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
                        )}
                      </svg>
                    )}
                  </div>
                  <div className="project-description">
                    {project.description}
                  </div>
                  <div className="project-tags">
                    {project.tags.map((tag) => (
                      <span key={tag} className="project-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            <div className="carousel-spacer-right" />
          </div>
        </div>

        <button
          className="carousel-btn carousel-btn-right"
          onClick={() => selectCard("right")}
          aria-label="Scroll right"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
