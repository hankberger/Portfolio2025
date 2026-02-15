import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { animate, stagger, easings } from "animejs";
import "./styles/ArtworkSection.css";

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
      } as any);

      animate(".artwork-section .section-rule", {
        scaleX: [0, 1],
        delay: 1350,
        duration: 700,
        ease: easings.eases.outQuart,
      } as any);

      animate(".artwork-carousel-container", {
        opacity: [0, 1],
        y: ["1rem", "0rem"],
        delay: 1300,
        duration: 600,
        ease: easings.eases.outQuart,
      } as any);

      animate(".artwork-card", {
        y: ["1rem", "0rem"],
        delay: stagger(80, { start: 1400 }),
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
    <div className="artwork-section">
      <div className="section-header">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M7 14c-1.66 0-3 1.34-3 3 0 1.31-1.16 2-2 2 .92 1.22 2.49 2 4 2 2.21 0 4-1.79 4-4 0-1.66-1.34-3-3-3zm13.71-9.37l-1.34-1.34a.996.996 0 00-1.41 0L9 12.25 11.75 15l8.96-8.96a.996.996 0 000-1.41z" />
        </svg>
        <div className="currently">Artwork</div>
        <div className="section-rule" />
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
                  src={artwork.video}
                  autoPlay
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
