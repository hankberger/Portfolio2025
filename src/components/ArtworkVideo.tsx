import { useEffect, useRef, useState } from "react";

interface ArtworkVideoProps {
  src: string;
  selected: boolean;
  visible: boolean;
  label: string;
}

/** Keep posters cheap; load a movie only when selected and actually in view. */
export default function ArtworkVideo({ src, selected, visible, label }: ArtworkVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [inView, setInView] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [needsPlay, setNeedsPlay] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.25,
    });
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || failed) return;
    let cancelled = false;
    const active = visible && selected && inView;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPlayback = () => {
      if (!active || document.hidden || motion.matches) {
        video.pause();
        return;
      }
      setLoaded(true);
      // The source is committed before this effect's next run.
      if (!loaded) return;
      video.play().then(() => {
        if (!cancelled) setNeedsPlay(false);
      }).catch(() => {
        if (!cancelled) setNeedsPlay(true);
      });
    };
    // Reduced-motion visitors can still load and play intentionally via controls.
    if (active) setLoaded(true);
    syncPlayback();
    document.addEventListener("visibilitychange", syncPlayback);
    motion.addEventListener("change", syncPlayback);
    return () => {
      cancelled = true;
      video.pause();
      document.removeEventListener("visibilitychange", syncPlayback);
      motion.removeEventListener("change", syncPlayback);
    };
  }, [visible, selected, inView, loaded, failed]);

  return (
    <>
      <video
        ref={videoRef}
        src={loaded && !failed ? src : undefined}
        poster={src.replace(/\.mp4$/, ".jpg")}
        preload="none"
        loop
        muted
        playsInline
        controls={selected && loaded && !failed}
        aria-hidden={!loaded}
        aria-label={label}
        className="artwork-card-video"
        onError={() => setFailed(true)}
      />
      {selected && (needsPlay || failed) && (
        <p className="artwork-playback-status" role="status">
          {failed ? "Video unavailable. Showing the preview." : "Use the play control to watch."}
        </p>
      )}
    </>
  );
}
