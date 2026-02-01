import { useRef, useState } from "react";

const carouselLinks = [
  {
    name: "MyChart Bedside",
    url: "https://www.epic.com/software/mychart-bedside",
  },
  { name: "Epic Systems", url: "https://www.epic.com" },
  { name: "Healthcare IT", url: "https://www.healthcareitnews.com" },
  { name: "Patient Portal", url: "https://www.mychart.com" },
  { name: "FHIR Standards", url: "https://www.hl7.org/fhir" },
];

export default function EmploymentCard() {
  const [expanded, setExpanded] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = useState({
    atStart: true,
    atEnd: false,
  });

  const updateScrollState = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setScrollState({
        atStart: scrollLeft <= 5,
        atEnd: scrollLeft + clientWidth >= scrollWidth - 5,
      });
    }
  };

  const scrollCarousel = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const scrollAmount = 150;
      carouselRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div
      className={`hello-card column ${expanded ? "expanded" : ""}`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="row">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
          <path d="M264 112L376 112C380.4 112 384 115.6 384 120L384 160L256 160L256 120C256 115.6 259.6 112 264 112zM208 120L208 160L128 160C92.7 160 64 188.7 64 224L64 320L576 320L576 224C576 188.7 547.3 160 512 160L432 160L432 120C432 89.1 406.9 64 376 64L264 64C233.1 64 208 89.1 208 120zM576 368L384 368L384 384C384 401.7 369.7 416 352 416L288 416C270.3 416 256 401.7 256 384L256 368L64 368L64 480C64 515.3 92.7 544 128 544L512 544C547.3 544 576 515.3 576 480L576 368z" />
        </svg>
        <div className="currently">Employment</div>
      </div>

      <div>
        <h1 className="hello-title">Software Developer</h1>
        <h2 className="hello-sub"> Epic Systems | MyChart Bedside</h2>
      </div>

      <div className="expanded-content">
        <p>
          Building patient-facing healthcare applications that help people
          manage their hospital stay and recovery journey.
        </p>
        <div className="carousel-container">
          <button
            className="carousel-btn carousel-btn-left"
            onClick={(e) => {
              e.stopPropagation();
              scrollCarousel("left");
            }}
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
          <div
            className="carousel-track-wrapper"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            <div
              className={`carousel-track ${scrollState.atStart ? "at-start" : ""} ${scrollState.atEnd ? "at-end" : ""}`}
              ref={carouselRef}
              onScroll={updateScrollState}
            >
              {carouselLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="carousel-link"
                  onClick={(e) => e.stopPropagation()}
                >
                  {link.name}
                </a>
              ))}
            </div>
          </div>
          <button
            className="carousel-btn carousel-btn-right"
            onClick={(e) => {
              e.stopPropagation();
              scrollCarousel("right");
            }}
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

      <div className={`read-more-button ${expanded ? "expanded" : ""}`}>
        <span>{expanded ? "Show less" : "Click to read more"}</span>
        <svg
          className="chevron-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </div>
  );
}
