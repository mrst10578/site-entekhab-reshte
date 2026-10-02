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
 * Matrix glyphs are rasterized only when the viewport is created/resized.
 * During animation, the browser only moves two transparent bitmap planes with
 * GPU-composited transforms. No per-frame JavaScript drawing loop is used.
 */

import { useEffect, useRef } from "react";

const MATRIX_CHARS = Array.from(
  "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789",
);

function randomChar() {
  return MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
}

function drawPlane(
  canvas: HTMLCanvasElement,
  density: number,
  fontSize: number,
  opacity: number,
  width: number,
  height: number,
) {
  const planeHeight = height * 2;

  canvas.width = width;
  canvas.height = planeHeight;

  const context = canvas.getContext("2d", {
    alpha: true,
    desynchronized: true,
  });

  if (!context) return;

  context.clearRect(0, 0, width, planeHeight);
  context.font = `${fontSize}px "MS Gothic", "Courier New", monospace`;
  context.textBaseline = "top";

  const columnGap = Math.max(fontSize + 7, Math.floor(width / density));
  const columns = Math.ceil(width / columnGap);

  for (let column = 0; column < columns; column += 1) {
    const x = column * columnGap + Math.random() * 5;
    const startY = Math.random() * height;
    const length = 8 + Math.floor(Math.random() * 14);

    for (let row = 0; row < length; row += 1) {
      const y = startY - row * fontSize;
      const strength = Math.max(0.08, 1 - row / length);
      const glyph = randomChar();

      if (row === 0) {
        context.shadowBlur = 7;
        context.shadowColor = "rgba(86,255,145,0.9)";
        context.fillStyle = `rgba(232,255,239,${Math.min(1, opacity + 0.22)})`;
      } else if (row === 1) {
        context.shadowBlur = 3;
        context.shadowColor = "rgba(0,255,92,0.58)";
        context.fillStyle = `rgba(111,255,157,${strength * opacity})`;
      } else {
        context.shadowBlur = 0;
        context.fillStyle = `rgba(0,218,82,${strength * opacity})`;
      }

      context.fillText(glyph, x, y);
      context.fillText(glyph, x, y + height);
    }
  }

  context.shadowBlur = 0;
}

export function MatrixRainBackground() {
  const layerRef = useRef<HTMLDivElement>(null);
  const fastPlaneRef = useRef<HTMLCanvasElement>(null);
  const slowPlaneRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    document.body.classList.add("matrix-active");

    let resizeFrame = 0;
    let renderedWidth = 0;

    function getStableViewportHeight() {
      const viewportHeight = Math.max(
        window.innerHeight,
        window.visualViewport?.height ?? 0,
        document.documentElement.clientHeight,
      );
      const screenHeight = window.screen?.availHeight ?? viewportHeight;

      return Math.max(1, Math.floor(Math.max(viewportHeight, screenHeight)));
    }

    function renderPlanes() {
      const width = Math.max(
        1,
        Math.floor(document.documentElement.clientWidth || window.innerWidth),
      );
      const height = getStableViewportHeight();
      const mobile = width <= 620;

      renderedWidth = width;
      layerRef.current?.style.setProperty(
        "--matrix-loop-height",
        `${height}px`,
      );

      if (fastPlaneRef.current) {
        drawPlane(
          fastPlaneRef.current,
          mobile ? 17 : 34,
          mobile ? 15 : 17,
          0.78,
          width,
          height,
        );
      }

      if (slowPlaneRef.current) {
        drawPlane(
          slowPlaneRef.current,
          mobile ? 10 : 20,
          mobile ? 13 : 15,
          0.38,
          width,
          height,
        );
      }
    }

    function handleResize() {
      const nextWidth = Math.max(
        1,
        Math.floor(document.documentElement.clientWidth || window.innerWidth),
      );

      // Mobile browser chrome expands/collapses while scrolling and emits
      // height-only resize events. Re-rasterizing the Matrix on those events
      // resets its visual phase, so only rebuild for a real width/orientation
      // change.
      if (Math.abs(nextWidth - renderedWidth) < 24) return;

      window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(renderPlanes);
    }

    renderPlanes();
    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      document.body.classList.remove("matrix-active");
      window.cancelAnimationFrame(resizeFrame);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div
      ref={layerRef}
      className="matrix-rain-layer"
      aria-hidden="true"
      data-testid="matrix-rain-background"
    >
      <canvas
        ref={slowPlaneRef}
        className="matrix-rain-plane matrix-rain-plane-slow"
      />
      <canvas
        ref={fastPlaneRef}
        className="matrix-rain-plane matrix-rain-plane-fast"
      />
    </div>
  );
}
