import { useEffect, useRef, useState } from "react";
import HankCard from "./components/HankCard";
import PostContent from "./components/PostContent";
import PointerHint from "./components/PointerHint";
import { useFishScene } from "./hooks/useFishScene";
import { usePointerHint } from "./hooks/usePointerHint";
import { useTitleFish } from "./hooks/useTitleFish";
import "./App.css";

// The three-layer stack: a background canvas that captures pointer input, the
// DOM/UI layer, and a transparent foreground canvas that draws the fish *over*
// the UI. See src/scene/index.ts for why it is built this way.

function App() {
  const [contentVisible, setContentVisible] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState(false);
  const constraintRef = useRef<HTMLDivElement>(null);

  const hint = usePointerHint();
  useTitleFish();
  const scene = useFishScene({ onPointerInput: hint.notifyPointerInput });

  // Expanding the card scatters the fish out of the way, and suppresses the
  // pointer hint while they're gone.
  const handleExpandChange = (expanded: boolean) => {
    // Jump back to the top before collapsing, so returning to the fish doesn't
    // leave the card scrolled halfway down.
    if (!expanded && constraintRef.current) {
      constraintRef.current.scrollTop = 0;
    }

    setContentVisible(expanded);
    scene.setScatter(expanded);
    hint.setScattered(expanded);
  };

  // Delay enabling scroll until content is fully rendered and laid out.
  // On mobile Safari, touch scroll bounds are cached at gesture start — if we
  // enable scroll the same frame the content mounts, the browser uses stale
  // (near-zero) scrollHeight, causing the scrollbar thumb to fill ~90% of the
  // track.
  useEffect(() => {
    if (!contentVisible) {
      setScrollEnabled(false);
      return;
    }

    let cancelled = false;
    // Two frames: frame 1 = React DOM commit, frame 2 = browser layout + paint
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!cancelled) setScrollEnabled(true);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [contentVisible]);

  // The background canvas covers the scroll container, so wheel events land on
  // the canvas instead. Forward them through.
  useEffect(() => {
    const bgCanvas = scene.bgCanvasRef.current;
    if (!scrollEnabled || !bgCanvas) return;

    const handleWheel = (e: WheelEvent) => {
      const container = constraintRef.current;
      if (!container) return;
      container.scrollTop += e.deltaY;
      e.preventDefault();
    };

    bgCanvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => bgCanvas.removeEventListener("wheel", handleWheel);
  }, [scrollEnabled, scene.bgCanvasRef]);

  return (
    <div className="stage">
      {/* Background layer: pointer surface for fish steering. Nothing is drawn here. */}
      <canvas
        ref={scene.bgCanvasRef}
        className={`stage-bg${scrollEnabled ? " scroll-enabled" : ""}`}
      />

      {/* UI layer */}
      <main className={scrollEnabled ? "scrollable" : ""}>
        <div
          ref={constraintRef}
          className={`constraint${scrollEnabled ? " scrollable" : ""}`}
        >
          <HankCard
            onExpandChange={handleExpandChange}
            vrSupported={scene.vrSupported}
            vrActive={scene.vrActive}
            onToggleVR={scene.toggleVR}
          />
          <PostContent visible={contentVisible} />
        </div>
      </main>

      {/* Portrait-only interaction hint, shown until the user touches the screen */}
      {hint.visible && (
        <PointerHint exiting={hint.exiting} onExited={hint.onExited} />
      )}

      {/* Foreground layer: the fish, drawn over the UI */}
      <canvas ref={scene.fgCanvasRef} className="stage-fg" />
    </div>
  );
}

export default App;
