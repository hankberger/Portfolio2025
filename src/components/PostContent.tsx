import { useEffect, useRef } from "react";
import { animate, easings } from "animejs";
import "./styles/PostContent.css";

interface IPostContent {
  visible: boolean;
}

export default function PostContent({ visible }: IPostContent) {
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (visible && !hasAnimated.current) {
      hasAnimated.current = true;
      animate(".post-content", {
        opacity: {
          from: 0,
          to: 1,
          duration: 400,
          ease: easings.eases.outQuad,
        },
        y: [{ from: "1rem", to: "0rem" }],
        delay: 300,
      } as any);
    }

    if (!visible) {
      hasAnimated.current = false;
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="post-content">
      <div className="dummy-section">
        <span className="dummy-label">Content Section</span>
      </div>
    </div>
  );
}
