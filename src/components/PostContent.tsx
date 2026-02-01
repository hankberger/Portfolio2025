import { useEffect, useRef, useState } from "react";
import { animate, stagger, easings } from "animejs";
import EmploymentCard from "./EmploymentCard";
import "./styles/PostContent.css";

interface IPostContent {
  visible: boolean;
}

const projectItems = [
  {
    name: "Project 1",
    image: "https://picsum.photos/seed/proj1/200/150",
    url: "#",
  },
  {
    name: "Project 2",
    image: "https://picsum.photos/seed/proj2/200/150",
    url: "#",
  },
  {
    name: "Project 3",
    image: "https://picsum.photos/seed/proj3/200/150",
    url: "#",
  },
  {
    name: "Project 4",
    image: "https://picsum.photos/seed/proj4/200/150",
    url: "#",
  },
  {
    name: "Project 5",
    image: "https://picsum.photos/seed/proj5/200/150",
    url: "#",
  },
];

const socialLinks = [
  {
    name: "Github",
    url: "https://github.com/hankberger",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
      </svg>
    ),
  },
  {
    name: "LinkedIn",
    url: "https://linkedin.com/in/hankberger",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    name: "X",
    url: "https://x.com/h4nkdog",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    name: "Instagram",
    url: "https://instagram.com/h4nkdog",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
];

export default function PostContent({ visible }: IPostContent) {
  const hasAnimated = useRef(false);
  const projectsCarouselRef = useRef<HTMLDivElement>(null);
  const [projectsScrollState, setProjectsScrollState] = useState({
    atStart: true,
    atEnd: false,
  });
  const [focusedProject, setFocusedProject] = useState(0);
  const isScrollingRef = useRef(false);

  const updateProjectsScrollState = () => {
    if (projectsCarouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        projectsCarouselRef.current;
      setProjectsScrollState({
        atStart: scrollLeft <= 5,
        atEnd: scrollLeft + clientWidth >= scrollWidth - 5,
      });

      // Only update focus from scroll if not programmatically scrolling
      if (!isScrollingRef.current) {
        const cards =
          projectsCarouselRef.current.querySelectorAll(".project-card");
        const containerCenter = scrollLeft + clientWidth / 2;
        let closestIndex = 0;
        let closestDistance = Infinity;

        cards.forEach((card, index) => {
          const cardElement = card as HTMLElement;
          const cardCenter =
            cardElement.offsetLeft + cardElement.offsetWidth / 2;
          const distance = Math.abs(containerCenter - cardCenter);
          if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = index;
          }
        });

        setFocusedProject(closestIndex);
      }
    }
  };

  const scrollProjectsCarousel = (direction: "left" | "right") => {
    if (projectsCarouselRef.current) {
      const cards =
        projectsCarouselRef.current.querySelectorAll(".project-card");
      const newIndex =
        direction === "left"
          ? Math.max(0, focusedProject - 1)
          : Math.min(cards.length - 1, focusedProject + 1);

      const targetCard = cards[newIndex] as HTMLElement;
      if (targetCard) {
        isScrollingRef.current = true;
        setFocusedProject(newIndex);
        targetCard.scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest",
        });
        setTimeout(() => {
          isScrollingRef.current = false;
        }, 500);
      }
    }
  };

  // Center first project card on mount
  useEffect(() => {
    if (visible && projectsCarouselRef.current) {
      const firstCard = projectsCarouselRef.current.querySelector(
        ".project-card",
      ) as HTMLElement;
      if (firstCard) {
        firstCard.scrollIntoView({
          behavior: "instant",
          inline: "center",
          block: "nearest",
        });
      }
    }
  }, [visible]);

  useEffect(() => {
    if (visible && !hasAnimated.current) {
      hasAnimated.current = true;

      // Buttons fade in smoothly
      animate(".social-button", {
        opacity: {
          from: 0,
          to: 1,
          duration: 400,
          delay: stagger(80, { start: 200 }),
        },
        scale: [{ from: 0.85, to: 1, delay: stagger(80, { start: 200 }) }],
        y: [{ from: "0.5rem", to: "0rem", delay: stagger(80, { start: 200 }) }],
        delay: stagger(80, { start: 200 }),
        duration: 500,
        ease: easings.eases.outQuart,
      } as any);

      // Hello card fade in
      animate(".hello-card", {
        opacity: [0, 1],
        y: ["1rem", "0rem"],
        delay: 500,
        duration: 600,
        ease: easings.eases.outQuart,
      } as any);

      // Projects section fade in
      animate(".section-header", {
        opacity: [0, 1],
        y: ["1rem", "0rem"],
        delay: 700,
        duration: 600,
        ease: easings.eases.outQuart,
      } as any);

      // Skill pills fade in
      animate(".skill-pill", {
        opacity: [0, 1],
        y: ["0.5rem", "0rem"],
        delay: stagger(100, { start: 850 }),
        duration: 400,
        ease: easings.eases.outQuart,
      } as any);
    }

    if (!visible) {
      hasAnimated.current = false;
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="post-content">
      <div className="content-section">
        {socialLinks.map((social) => (
          <a
            key={social.name}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            className="social-button"
            aria-label={social.name}
          >
            {social.icon}
          </a>
        ))}
      </div>
      <EmploymentCard />

      <div className="section-header">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z" />
        </svg>
        <div className="currently">About Me</div>
      </div>
      <div className="skill-pills">
        <span className="skill-pill">Web</span>
        <span className="skill-pill">Mobile</span>
        <span className="skill-pill">Animation</span>
      </div>
    </div>
  );
}
