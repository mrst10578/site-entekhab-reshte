"use client";

/**
 * Matrix rain visual adapted from:
 * https://github.com/matrixrainj/matrixrainj.github.io
 * Copyright (c) 2025-2026 Yuliya Kolesnikova
 * MIT License. See /THIRD_PARTY_NOTICES.md.
 *
 * The original control/settings UI is intentionally not included here.
 *
 * Performance notes:
 * - Glyphs are pre-rendered to a small atlas and copied with drawImage.
 * - Expensive per-glyph shadowBlur/text rasterization is avoided in the hot loop.
 * - Density/FPS scale down on smaller or lower-core devices.
 * - The canvas intentionally renders at CSS-pixel resolution instead of devicePixelRatio.
 */

import { useEffect, useRef } from "react";

const MATRIX_CHARS =
  "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789";

const GLYPHS = Array.from(new Set(Array.from(MATRIX_CHARS)));
const GLYPH_INDEX = new Map(GLYPHS.map((glyph, index) => [glyph, index]));

interface RainDrop {
  x: number;
  y: number;
  speed: number;
  chars: string[];
  subPixelY: number;
}

interface GlyphAtlas {
  canvas: HTMLCanvasElement;
  cellWidth: number;
  cellHeight: number;
  padding: number;
}

function randomChar() {
  return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
}

function generateColumnChars() {
  const length = Math.floor(7 + Math.random() * 11);
  return Array.from({ length }, randomChar);
}

function createGlyphAtlas(fontSize: number): GlyphAtlas | null {
  const padding = 8;
  const cellWidth = fontSize + padding * 2;
  const cellHeight = fontSize + padding * 2;
  const atlas = document.createElement("canvas");

  atlas.width = cellWidth * GLYPHS.length;
  atlas.height = cellHeight * 3;

  const context = atlas.getContext("2d");
  if (!context) return null;

  context.font = `${fontSize}px "MS Gothic", "Courier New", monospace`;
  context.textBaseline = "top";

  GLYPHS.forEach((glyph, index) => {
    const x = index * cellWidth + padding;
    const bodyY = padding;
    const brightY = cellHeight + padding;
    const headY = cellHeight * 2 + padding;

    context.shadowBlur = 0;
    context.fillStyle = "#00d050";
    context.fillText(glyph, x, bodyY);

    context.shadowBlur = 3;
    context.shadowColor = "rgba(0, 255, 92, 0.58)";
    context.fillStyle = "#72ffa0";
    context.fillText(glyph, x, brightY);

    context.shadowBlur = 7;
    context.shadowColor = "rgba(84, 255, 137, 0.9)";
    context.fillStyle = "#effff3";
    context.fillText(glyph, x, headY);
  });

  context.shadowBlur = 0;

  return {
    canvas: atlas,
    cellWidth,
    cellHeight,
    padding,
  };
}

export function MatrixRainBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvasNode = canvasRef.current;
    if (!canvasNode) return;

    document.body.classList.add("matrix-active");

    const contextNode = canvasNode.getContext("2d", {
      alpha: false,
      desynchronized: true,
    });

    if (!contextNode) {
      document.body.classList.remove("matrix-active");
      return;
    }

    const canvas: HTMLCanvasElement = canvasNode;
    const context: CanvasRenderingContext2D = contextNode;

    let animationId = 0;
    let resizeFrame = 0;
    let lastFrame = performance.now();
    let drops: RainDrop[] = [];
    let isVisible = !document.hidden;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const mobile = window.matchMedia("(max-width: 620px)").matches;
    const lowCoreDevice = (navigator.hardwareConcurrency ?? 8) <= 4;
    const lightweightMode = mobile || lowCoreDevice;

    const fontSize = mobile ? 15 : 17;
    const columnWidth = lightweightMode ? 31 : 25;
    const maxColumns = lightweightMode ? 48 : 88;
    const targetFrameMs = reducedMotion
      ? 250
      : lightweightMode
        ? 1000 / 36
        : 1000 / 50;
    const glyphAtlas = createGlyphAtlas(fontSize);

    context.imageSmoothingEnabled = false;

    function resize() {
      // Rendering at CSS-pixel resolution is deliberate. A DPR-scaled canvas
      // multiplies the amount of work while adding little value to a background.
      canvas.width = Math.max(1, Math.floor(window.innerWidth));
      canvas.height = Math.max(1, Math.floor(window.innerHeight));
      context.imageSmoothingEnabled = false;
      context.fillStyle = "#010403";
      context.fillRect(0, 0, canvas.width, canvas.height);

      const desiredColumns = Math.ceil(canvas.width / columnWidth);
      const columns = Math.max(1, Math.min(maxColumns, desiredColumns));
      const spacing = canvas.width / columns;

      drops = Array.from({ length: columns }, (_, index) => ({
        x: index * spacing,
        y: Math.random() * canvas.height,
        speed: 0.35 + Math.random() * 0.58,
        chars: generateColumnChars(),
        subPixelY: 0,
      }));
    }

    function update(delta: number) {
      const normalizedDelta = Math.min(delta, 55) / 16.6667;

      for (const drop of drops) {
        drop.subPixelY += fontSize * drop.speed * 0.36 * normalizedDelta;

        if (drop.subPixelY >= 1) {
          const pixels = Math.floor(drop.subPixelY);
          drop.y += pixels;
          drop.subPixelY -= pixels;
        }

        // Change at most one glyph in a column per update instead of testing
        // every visible glyph on every frame.
        if (Math.random() < 0.045 * normalizedDelta) {
          const charIndex = Math.floor(Math.random() * drop.chars.length);
          drop.chars[charIndex] = randomChar();
        }

        if (drop.y - drop.chars.length * fontSize > canvas.height) {
          drop.y = -fontSize * (1 + Math.random() * 7);
          drop.subPixelY = 0;
          drop.speed = 0.35 + Math.random() * 0.58;
          drop.chars = generateColumnChars();
        }
      }
    }

    function renderWithAtlas(atlas: GlyphAtlas) {
      const { canvas: source, cellWidth, cellHeight, padding } = atlas;

      for (const drop of drops) {
        const length = drop.chars.length;

        for (let charIndex = 0; charIndex < length; charIndex += 1) {
          const y = drop.y - charIndex * fontSize;
          if (y < -cellHeight || y > canvas.height + cellHeight) continue;

          const glyphIndex = GLYPH_INDEX.get(drop.chars[charIndex]) ?? 0;
          const row = charIndex === 0 ? 2 : charIndex === 1 ? 1 : 0;
          const brightness = 1 - charIndex / length;

          context.globalAlpha =
            charIndex === 0
              ? 0.98
              : Math.max(0.1, Math.pow(brightness, 1.12));

          context.drawImage(
            source,
            glyphIndex * cellWidth,
            row * cellHeight,
            cellWidth,
            cellHeight,
            Math.round(drop.x) - padding,
            Math.round(y) - padding,
            cellWidth,
            cellHeight,
          );
        }
      }

      context.globalAlpha = 1;
    }

    function renderFallback() {
      context.font = `${fontSize}px "MS Gothic", "Courier New", monospace`;
      context.textBaseline = "top";
      context.shadowBlur = 0;

      for (const drop of drops) {
        const length = drop.chars.length;

        for (let charIndex = 0; charIndex < length; charIndex += 1) {
          const y = drop.y - charIndex * fontSize;
          if (y < -fontSize || y > canvas.height + fontSize) continue;

          const brightness = 1 - charIndex / length;
          context.globalAlpha =
            charIndex === 0
              ? 0.98
              : Math.max(0.1, Math.pow(brightness, 1.12));
          context.fillStyle = charIndex === 0 ? "#effff3" : "#00d050";
          context.fillText(drop.chars[charIndex], drop.x, y);
        }
      }

      context.globalAlpha = 1;
    }

    function render() {
      context.fillStyle = "rgba(1, 4, 3, 0.31)";
      context.fillRect(0, 0, canvas.width, canvas.height);

      if (glyphAtlas) {
        renderWithAtlas(glyphAtlas);
      } else {
        renderFallback();
      }
    }

    function animate(now: number) {
      animationId = window.requestAnimationFrame(animate);

      if (!isVisible || now - lastFrame < targetFrameMs - 1) return;

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

    window.addEventListener("resize", handleResize, { passive: true });
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
