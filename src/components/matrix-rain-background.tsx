"use client";

/**
 * Matrix rain visual adapted from:
 * https://github.com/matrixrainj/matrixrainj.github.io
 * Copyright (c) 2025-2026 Yuliya Kolesnikova
 * MIT License. See /THIRD_PARTY_NOTICES.md.
 *
 * The original control/settings UI is intentionally not included here.
 *
 * Performance strategy:
 * The rain is rendered as pre-rasterized text layers animated only with
 * translate3d transforms. This lets the browser compositor/GPU move the
 * streams without repainting a full canvas every frame.
 */

import { useEffect, type CSSProperties } from "react";

const MATRIX_CHARS = Array.from(
  "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789",
);

const STREAM_COUNT = 56;

interface MatrixStreamStyle extends CSSProperties {
  "--matrix-x": string;
  "--matrix-duration": string;
  "--matrix-delay": string;
  "--matrix-opacity": string;
  "--matrix-scale": string;
}

function seeded(seed: number) {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function streamText(index: number) {
  const length = 12 + Math.floor(seeded(index + 3.7) * 14);

  return Array.from({ length }, (_, charIndex) => {
    const pick = Math.floor(
      seeded(index * 31.17 + charIndex * 7.13 + 0.91) * MATRIX_CHARS.length,
    );
    return MATRIX_CHARS[pick];
  }).join("");
}

function streamStyle(index: number): MatrixStreamStyle {
  const duration = 8.8 + seeded(index + 19.4) * 9.5;
  const x = ((index + 0.5) / STREAM_COUNT) * 100;
  const opacity = 0.34 + seeded(index + 9.2) * 0.58;
  const scale = 0.86 + seeded(index + 41.8) * 0.28;
  const delay = -(seeded(index + 27.6) * duration);

  return {
    "--matrix-x": `${x.toFixed(2)}%`,
    "--matrix-duration": `${duration.toFixed(2)}s`,
    "--matrix-delay": `${delay.toFixed(2)}s`,
    "--matrix-opacity": opacity.toFixed(2),
    "--matrix-scale": scale.toFixed(2),
  };
}

const STREAMS = Array.from({ length: STREAM_COUNT }, (_, index) => ({
  id: index,
  text: streamText(index),
  style: streamStyle(index),
}));

export function MatrixRainBackground() {
  useEffect(() => {
    document.body.classList.add("matrix-active");

    return () => {
      document.body.classList.remove("matrix-active");
    };
  }, []);

  return (
    <div
      className="matrix-rain-layer"
      aria-hidden="true"
      data-testid="matrix-rain-background"
    >
      {STREAMS.map((stream) => (
        <span
          key={stream.id}
          className="matrix-stream"
          style={stream.style}
        >
          {stream.text}
        </span>
      ))}
    </div>
  );
}
