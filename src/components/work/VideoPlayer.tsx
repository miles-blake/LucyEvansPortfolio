"use client";

import { useState, useRef } from "react";
import { Play } from "lucide-react";

interface Props {
  src: string;
  poster?: string;
  originalUrl?: string;
  title?: string;
}

export default function VideoPlayer({ src, poster, originalUrl, title }: Props) {
  const [playing, setPlaying] = useState(false);
  const ref = useRef<HTMLVideoElement>(null);

  function toggle() {
    if (!ref.current) return;
    if (playing) {
      ref.current.pause();
    } else {
      ref.current.play();
    }
    setPlaying((v) => !v);
  }

  return (
    <div className="relative group bg-ink rounded-sm overflow-hidden aspect-[9/16] max-w-xs mx-auto md:mx-0">
      <video
        ref={ref}
        src={src}
        poster={poster}
        className="w-full h-full object-cover"
        loop
        playsInline
        onEnded={() => setPlaying(false)}
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
        aria-label={title ?? "Case study video"}
      />

      {/* Play/pause overlay */}
      {!playing && (
        <button
          onClick={toggle}
          className="absolute inset-0 flex items-center justify-center bg-ink/30 group-hover:bg-ink/20 transition-colors focus-visible:outline-2 focus-visible:outline-cream"
          aria-label="Play video"
        >
          <span className="w-14 h-14 rounded-full bg-cream/90 flex items-center justify-center shadow-lg">
            <Play size={24} className="text-ink ml-1" />
          </span>
        </button>
      )}

      {/* Link back to original post */}
      {originalUrl && (
        <a
          href={originalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-3 right-3 font-meta text-cream/80 bg-ink/60 px-2 py-0.5 text-xs hover:text-cream transition-colors backdrop-blur-sm"
          onClick={(e) => e.stopPropagation()}
        >
          View original ↗
        </a>
      )}
    </div>
  );
}
