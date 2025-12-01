import { useEffect, useState } from "react";
import "./styles/Showcase.css";

export default function Showcase() {
  const [videos, setVideos] = useState<string[]>([]);

  useEffect(() => {
    const loadVideos = async () => {
      const potentialVideos = [
        "lastwords.mp4",
        "cloud.mp4",
        "fancyclown.mp4",

        "eclipse.mp4",

        "tree1.mp4",
      ];

      const availableVideos: string[] = [];

      for (const video of potentialVideos) {
        try {
          const response = await fetch(`/showcase/${video}`, {
            method: "HEAD",
          });
          if (response.ok) {
            availableVideos.push(`/showcase/${video}`);
          }
        } catch (error) {
          // Video doesn't exist, skip it
        }
      }

      setVideos(availableVideos);
    };

    loadVideos();
  }, []);

  return (
    <div className="Showcase">
      <div className="sectionChild">
        <h3>Showcase</h3>
        {videos.length === 0 ? (
          <div className="no-videos">
            <p>No showcase videos available yet.</p>
            <p>
              Add videos to the <code>/public/showcase/</code> directory to see
              them here.
            </p>
          </div>
        ) : (
          <div className="video-grid">
            {videos.map((video, index) => (
              <div key={index} className="video-container">
                <video
                  src={video}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="showcase-video"
                  // @ts-ignore
                  webkit-playsinline="true"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
