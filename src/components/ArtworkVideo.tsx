import { useEffect, useRef, useState } from "react";

interface ArtworkVideoProps {
  src: string;
  selected: boolean;
  visible: boolean;
  label: string;
}

/** Only load the selected, visible movie; blocked playback leaves a quiet poster. */
export default function ArtworkVideo({ src, selected, visible, label }: ArtworkVideoProps) {
  const mediaRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [inView, setInView] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [hasFrame, setHasFrame] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.25,
    });
    observer.observe(media);
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
      if (!loaded) return;
      // Set the DOM properties too, before play(), for mobile WebKit.
      video.defaultMuted = true;
      video.muted = true;
      void video.play().catch(() => {
        if (!cancelled) setHasFrame(false);
      });
    };
    syncPlayback();
    document.addEventListener("visibilitychange", syncPlayback);
    // A later gesture can unlock playback without presenting any player UI.
    document.addEventListener("pointerup", syncPlayback, { passive: true });
    motion.addEventListener("change", syncPlayback);
    return () => {
      cancelled = true;
      video.pause();
      document.removeEventListener("visibilitychange", syncPlayback);
      document.removeEventListener("pointerup", syncPlayback);
      motion.removeEventListener("change", syncPlayback);
    };
  }, [visible, selected, inView, loaded, failed]);

  return (
    <div ref={mediaRef} className="artwork-media">
      <img className="artwork-card-poster" src={src.replace(/\.mp4$/, ".jpg")}
        alt={label} draggable={false} />
      <video
        ref={videoRef}
        src={loaded && !failed ? src : undefined}
        preload="none"
        loop
        muted
        playsInline
        controls={false}
        disablePictureInPicture
        disableRemotePlayback
        aria-hidden="true"
        tabIndex={-1}
        className={`artwork-card-video${hasFrame && !failed ? " has-frame" : ""}`}
        onPlaying={() => setHasFrame(true)}
        onError={() => setFailed(true)}
      />
    </div>
  );
}
