import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { animate, stagger, easings } from "animejs";
import "./styles/ArtworkSection.css";

const tools = [
  {
    id: "houdini",
    label: "Houdini",
    icon: `
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  id="Layer_1"
                  data-name="Layer 1"
                  viewBox="0 0 500 500"
                >
                  <defs></defs>
                  <path
                    fill="#ffffff"
                    d="M0,409.03v90.98h79.64C40.95,477.98,13.61,444.5,0,409.03Z"
                  />
                  <path
                    fill="#ffffff"
                    d="M334.21,314.15c-.11-84.06-67.58-165-168.98-168.5-71.84-2.48-127.74,23.87-165.23,62.8v87.76c25.49-73.63,95.73-107.41,154.58-106.82,73.52.74,130.23,56.19,130.56,118.87.32,59.91-24.78,104.01-92.52,114.88-36.93,5.93-94.73-15.73-92.16-71.53,1.33-28.77,23.73-45.02,49.41-43.84-25.12,33.66,8.14,58.34,31.66,53.31,29.11-6.22,40.97-32.07,40.97-52.13,0-21.15-19.93-55.32-69.4-54.15-61.22,1.45-99.74,45.49-101.04,99.93-1.63,68.56,62.49,113.62,128.31,114.44,96.63,1.2,153.96-62.19,153.83-155.02Z"
                  />
                  <path
                    fill="#ffffff"
                    d="M0,0v143.85c43-33,98.96-54.35,165.23-54.31,141.87.08,231.94,99.21,231.9,224.27-.03,86.88-40.57,152.21-104.05,186.2h206.92V0H0Z"
                  />
                </svg>`,
  },
  {
    id: "unreal",
    label: "Unreal Engine",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 1280">
      <circle cx="640" cy="640" r="640" fill="#ffffff"/>
      <path fill="rgba(0,0,0,0.6)" d="M803.7,995.81c156.5-73.92,205.56-210.43,216.6-263.61c-57.22,58.6-120.53,118-163.11,76.88c0,0-2.33-219.45-2.33-309.43c0-121,114.75-211.18,114.75-211.18c-63.11,11.24-138.89,33.71-219.33,112.65c-7.26,7.2-14.14,14.76-20.62,22.67c-34.47-26.39-79.14-18.48-79.14-18.48c24.14,13.26,48.23,51.88,48.23,83.85v314.26c0,0-52.63,46.3-93.19,46.3c-9.14,0.07-18.17-2.05-26.33-6.18c-8.16-4.13-15.21-10.15-20.56-17.56c-3.21-4.19-5.87-8.78-7.91-13.65V424.07c-11.99,9.89-52.51,18.04-52.51-49.22c0-41.79,30.11-91.6,83.73-122.15c-73.63,11.23-142.59,43.04-198.92,91.76c-42.8,36.98-77.03,82.85-100.31,134.4c-23.28,51.55-35.06,107.55-34.51,164.12c0,0,39.21-122.51,88.32-133.83c7.15-1.88,14.65-2.07,21.89-0.54c7.24,1.53,14.02,4.72,19.81,9.34c5.79,4.61,10.41,10.51,13.51,17.23c3.1,6.72,4.59,14.07,4.34,21.46V844.3c0,29.16-18.8,35.53-36.17,35.22c-11.77-0.83-23.4-3.02-34.66-6.53c35.86,48.53,82.46,88.12,136.15,115.66c53.69,27.54,113.03,42.29,173.37,43.1l106.05-106.6L803.7,995.81z"/>
    </svg>`,
  },
  {
    id: "blender",
    label: "Blender",
    icon: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#ffffff" d="M12.51 13.214c.046-.8.438-1.506 1.03-2.006a3.424 3.424 0 0 1 2.212-.79c.85 0 1.631.3 2.211.79.592.5.983 1.206 1.028 2.005.045.823-.285 1.586-.865 2.153a3.389 3.389 0 0 1-2.374.938 3.393 3.393 0 0 1-2.376-.938c-.58-.567-.91-1.33-.865-2.152M7.35 14.831c.006.314.106.922.256 1.398a7.372 7.372 0 0 0 1.593 2.757 8.227 8.227 0 0 0 2.787 2.001 8.947 8.947 0 0 0 3.66.76 8.964 8.964 0 0 0 3.657-.772 8.285 8.285 0 0 0 2.785-2.01 7.428 7.428 0 0 0 1.592-2.762 6.964 6.964 0 0 0 .25-3.074 7.123 7.123 0 0 0-1.016-2.779 7.764 7.764 0 0 0-1.852-2.043h.002L13.566 2.55l-.02-.015c-.492-.378-1.319-.376-1.86.002-.547.382-.609 1.015-.123 1.415l-.001.001 3.126 2.543-9.53.01h-.013c-.788.001-1.545.518-1.695 1.172-.154.665.38 1.217 1.2 1.22V8.9l4.83-.01-8.62 6.617-.034.025c-.813.622-1.075 1.658-.563 2.313.52.667 1.625.668 2.447.004L7.414 14s-.069.52-.063.831zm12.09 1.741c-.97.988-2.326 1.548-3.795 1.55-1.47.004-2.827-.552-3.797-1.538a4.51 4.51 0 0 1-1.036-1.622 4.282 4.282 0 0 1 .282-3.519 4.702 4.702 0 0 1 1.153-1.371c.942-.768 2.141-1.183 3.396-1.185 1.256-.002 2.455.41 3.398 1.175.48.391.87.854 1.152 1.367a4.28 4.28 0 0 1 .522 1.706 4.236 4.236 0 0 1-.239 1.811 4.54 4.54 0 0 1-1.035 1.626"/></svg>`,
  },
];

interface IArtworkSection {
  visible: boolean;
}

const artworks = [
  { id: "artwork-0", video: "/art/HankBerger0.mp4" },
  { id: "artwork-1", video: "/art/HankBerger1.mp4" },
  { id: "artwork-2", video: "/art/HankBerger2.mp4" },
  { id: "artwork-3", video: "/art/HankBerger3.mp4" },
  { id: "artwork-4", video: "/art/HankBerger4.mp4" },
  { id: "artwork-5", video: "/art/HankBerger5.mp4" },
  { id: "artwork-6", video: "/art/HankBerger6.mp4" },
  { id: "artwork-7", video: "/art/HankBerger7.mp4" },
];

export default function ArtworkSection({ visible }: IArtworkSection) {
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
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const updateTrackPadding = useCallback(() => {
    if (!carouselRef.current) return;
    const track = carouselRef.current;
    const card = track.querySelector(".artwork-card") as HTMLElement | null;
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
      ".artwork-card",
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
    const cards = track.querySelectorAll(".artwork-card");
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
        : Math.min(artworks.length - 1, focusedIndex + 1);
    flushSync(() => setFocusedIndex(next));
    requestAnimationFrame(() => scrollToIndex(next));
  };

  useEffect(() => {
    if (visible && !hasAnimated.current) {
      hasAnimated.current = true;

      animate(".artwork-section .section-header", {
        opacity: [0, 1],
        y: ["1rem", "0rem"],
        delay: 1300,
        duration: 600,
        ease: easings.eases.outQuart,
      });

      animate(".artwork-section .section-rule", {
        scaleX: [0, 1],
        delay: 1350,
        duration: 700,
        ease: easings.eases.outQuart,
      });

      animate(".artwork-tool, .artwork-tool-divider", {
        opacity: [0, 1],
        y: ["0.75rem", "0rem"],
        delay: 1350,
        duration: 600,
        ease: easings.eases.outQuart,
      });

      animate(".artwork-carousel-container", {
        opacity: [0, 1],
        y: ["1rem", "0rem"],
        delay: 1300,
        duration: 600,
        ease: easings.eases.outQuart,
      });

      animate(".artwork-card", {
        y: ["1rem", "0rem"],
        delay: stagger(80, { start: 1400 }),
        duration: 500,
        ease: easings.eases.outQuart,
      });
    }

    if (!visible) {
      hasAnimated.current = false;
    }
  }, [visible]);

  // Play only the focused video, pause the rest
  useEffect(() => {
    videoRefs.current.forEach((video, i) => {
      if (!video) return;
      if (i === focusedIndex) {
        video.play();
      } else {
        video.pause();
      }
    });
  }, [focusedIndex]);

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
    <div className="artwork-section">
      <div className="section-header">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M7 14c-1.66 0-3 1.34-3 3 0 1.31-1.16 2-2 2 .92 1.22 2.49 2 4 2 2.21 0 4-1.79 4-4 0-1.66-1.34-3-3-3zm13.71-9.37l-1.34-1.34a.996.996 0 00-1.41 0L9 12.25 11.75 15l8.96-8.96a.996.996 0 000-1.41z" />
        </svg>
        <div className="currently">Artwork</div>
        <div className="section-rule" />
      </div>

      <div className="artwork-tools">
        {tools.map((tool, i) => (
          <Fragment key={tool.id}>
            {i > 0 && <div className="artwork-tool-divider" />}
            <span className="artwork-tool">
              {tool.icon && (
                <span
                  className="artwork-tool-icon"
                  dangerouslySetInnerHTML={{ __html: tool.icon }}
                />
              )}
              {tool.label}
            </span>
          </Fragment>
        ))}
      </div>

      <div className="artwork-carousel-container">
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
            {artworks.map((artwork, i) => (
              <div
                key={artwork.id}
                className="artwork-card"
                onClick={() => {
                  if (focusedIndex !== i) {
                    flushSync(() => setFocusedIndex(i));
                    requestAnimationFrame(() => scrollToIndex(i));
                  }
                }}
              >
                <video
                  ref={(el) => {
                    videoRefs.current[i] = el;
                  }}
                  src={artwork.video}
                  autoPlay={i === 0}
                  loop
                  muted
                  playsInline
                  className="artwork-card-video"
                />
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
