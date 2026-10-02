"use client";

/**
 * Matrix rain visual adapted from:
 * https://github.com/matrixrainj/matrixrainj.github.io
 * Copyright (c) 2025-2026 Yuliya Kolesnikova
 * MIT License. See /THIRD_PARTY_NOTICES.md.
 *
 * The original control/settings UI is intentionally not included here.
 */

import { useEffect, useRef } from "react";

const MATRIX_CHARS =
  "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789";

interface RainChar {
  char: string;
  brightness: number;
}

interface RainDrop {
  x: number;
  y: number;
  speed: number;
  chars: RainChar[];
  subPixelY: number;
}

function randomChar() {
  return MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
}

function generateColumnChars(): RainChar[] {
  const length = Math.floor(6 + Math.random() * 18);

  return Array.from({ length }, (_, index) => ({
    char: randomChar(),
    brightness: 1 - index / length,
  }));
}

export function MatrixRainBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    document.body.classList.add("matrix-active");

    const context = canvas.getContext("2d", { alpha: false });
    if (!context) {
      document.body.classList.remove("matrix-active");
      return;
    }

    let animationId = 0;
    let resizeFrame = 0;
    let lastFrame = performance.now();
    let drops: RainDrop[] = [];
    let isVisible = !document.hidden;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const mobile = window.matchMedia("(max-width: 620px)").matches;

    const fontSize = mobile ? 15 : 17;
    const columnWidth = mobile ? 27 : 23;
    const targetFrameMs = reducedMotion ? 1000 : 1000 / 60;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      context.fillStyle = "#010403";
      context.fillRect(0, 0, canvas.width, canvas.height);

      const columns = Math.ceil(canvas.width / columnWidth);
      drops = Array.from({ length: columns }, (_, index) => ({
        x: index * columnWidth,
        y: Math.random() * canvas.height,
        speed: 0.34 + Math.random() * 0.62,
        chars: generateColumnChars(),
        subPixelY: 0,
      }));
    }

    function update(delta: number) {
      const normalizedDelta = Math.min(delta, 50) / 16.6667;

      for (const drop of drops) {
        drop.subPixelY += fontSize * drop.speed * 0.36 * normalizedDelta;

        if (drop.subPixelY >= 1) {
          const pixels = Math.floor(drop.subPixelY);
          drop.y += pixels;
          drop.subPixelY -= pixels;
        }

        for (const charData of drop.chars) {
          if (Math.random() < 0.0026 * normalizedDelta) {
            charData.char = randomChar();
          }
        }

        if (drop.y - drop.chars.length * fontSize > canvas.height) {
          drop.y = -fontSize * (1 + Math.random() * 8);
          drop.subPixelY = 0;
          drop.speed = 0.34 + Math.random() * 0.62;
          drop.chars = generateColumnChars();
        }
      }
    }

    function render() {
      context.fillStyle = "rgba(1, 4, 3, 0.34)";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.font = `${fontSize}px "MS Gothic", "Courier New", monospace`;
      context.textBaseline = "top";

      for (const drop of drops) {
        drop.chars.forEach((charData, charIndex) => {
          const y = drop.y - charIndex * fontSize;
          if (y < -fontSize || y > canvas.height + fontSize) return;

          const brightness = charData.brightness;
          const alpha =
            charIndex === 0 ? 0.98 : Math.max(0.08, Math.pow(brightness, 0.9));

          if (charIndex === 0) {
            context.shadowBlur = 16;
            context.shadowColor = "rgba(84, 255, 137, 0.9)";
            context.fillStyle = "rgba(225, 255, 233, 0.98)";
          } else if (charIndex === 1) {
            context.shadowBlur = 9;
            context.shadowColor = "rgba(0, 255, 92, 0.66)";
            context.fillStyle = `rgba(90, 255, 139, ${alpha})`;
          } else {
            context.shadowBlur = charIndex < 4 ? 4 : 1;
            context.shadowColor = `rgba(0, 255, 92, ${alpha * 0.28})`;
            context.fillStyle = `rgba(0, ${Math.floor(
              150 + 105 * brightness,
            )}, ${Math.floor(44 + 64 * brightness)}, ${alpha})`;
          }

          context.fillText(charData.char, drop.x, y);
        });
      }

      context.shadowBlur = 0;
    }

    function animate(now: number) {
      animationId = window.requestAnimationFrame(animate);
      if (!isVisible || now - lastFrame < targetFrameMs) return;

      const delta = now - lastFrame;
      lastFrame = now;
      update(delta);
      render();
    }

    function handleResize() {
      window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(resize);
    }

    function handleVisibility() {
      isVisible = !document.hidden;
      lastFrame = performance.now();
    }

    resize();
    render();
    animationId = window.requestAnimationFrame(animate);

    window.addEventListener("resize", handleResize);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.body.classList.remove("matrix-active");
      window.cancelAnimationFrame(animationId);
      window.cancelAnimationFrame(resizeFrame);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="matrix-rain-canvas"
      aria-hidden="true"
      data-testid="matrix-rain-background"
    />
  );
}
