'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import styles from './ScrollVideo.module.css';

gsap.registerPlugin(ScrollTrigger);

/* ─── Config ────────────────────────────────────────────────────────── */
const FRAME_COUNT  = 300;
const FRAME_PREFIX = '/ezgif-frame-';  // e.g. /ezgif-frame-001.jpg
const SCROLL_HEIGHT = 6000;            // px of scroll = full sequence

/** Zero-pad a number to 3 digits: 1 → "001" */
const pad3 = (n) => String(n).padStart(3, '0');

/** Build the URL for frame index 0..N-1 (frames are named 001..300) */
const frameUrl = (i) => `${FRAME_PREFIX}${pad3(i + 1)}.jpg`;

/* ─── Preloader ─────────────────────────────────────────────────────── */
/**
 * Loads all frames in parallel batches so the browser doesn't open
 * 300 simultaneous connections (which would saturate the HTTP queue).
 * Returns a Promise that resolves with the loaded HTMLImageElement array.
 */
async function preloadFrames(onProgress) {
  const images = new Array(FRAME_COUNT).fill(null);
  const BATCH  = 10; // load 10 frames at a time

  for (let start = 0; start < FRAME_COUNT; start += BATCH) {
    const end     = Math.min(start + BATCH, FRAME_COUNT);
    const batch   = [];

    for (let i = start; i < end; i++) {
      batch.push(
        new Promise((resolve) => {
          const img = new Image();
          img.onload  = () => { images[i] = img; resolve(); };
          img.onerror = () => resolve(); // skip broken frames gracefully
          img.src     = frameUrl(i);
        })
      );
    }

    await Promise.all(batch);
    onProgress(Math.round((end / FRAME_COUNT) * 100));
  }

  return images;
}

/* ─── Component ─────────────────────────────────────────────────────── */
/**
 * FrameCanvas — Apple-style scroll-driven frame sequence.
 *
 * Technique:
 *  1. All 300 JPEG frames are preloaded into a JS Image[] array.
 *  2. A full-viewport <canvas> is used as the display surface.
 *     Switching frames = drawImage() on the canvas — no DOM mutations,
 *     no layout recalc, no paint — just a single GPU blit per frame.
 *  3. GSAP ScrollTrigger pins the section and drives a proxy object.
 *     scrub: 1.5 gives the 1.5-second cinematic lag after scroll stops.
 *  4. Lenis feeds its virtual scroll position into ScrollTrigger via
 *     the shared gsap.ticker (set up in SmoothScrollProvider).
 */
export default function FrameCanvas({ scrollHeight = SCROLL_HEIGHT }) {
  const sectionRef     = useRef(null);
  const canvasRef      = useRef(null);
  const progressBarRef = useRef(null);
  const scrollCueRef   = useRef(null);
  const overlayRef     = useRef(null);

  const framesRef      = useRef([]);   // loaded Image[] — not React state
  const currentIdxRef  = useRef(0);    // currently drawn frame index

  const [loadPct, setLoadPct]   = useState(0);   // 0-100
  const [isReady, setIsReady]   = useState(false);

  /* ─── 1. Preload all frames ────────────────────────────────────────── */
  useEffect(() => {
    preloadFrames((pct) => setLoadPct(pct)).then((images) => {
      framesRef.current = images;
      setIsReady(true);

      // Draw the very first frame immediately so canvas isn't blank
      const canvas = canvasRef.current;
      if (canvas && images[0]) drawFrame(canvas, images[0]);
    });
  }, []);

  /* ─── 2. Resize handler — keep canvas pixel size in sync ─────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const syncSize = () => {
      canvas.width  = canvas.offsetWidth  * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;

      // Redraw current frame after resize
      const frame = framesRef.current[currentIdxRef.current];
      if (frame) drawFrame(canvas, frame);
    };

    syncSize();
    window.addEventListener('resize', syncSize);
    return () => window.removeEventListener('resize', syncSize);
  }, []);

  /* ─── 3. GSAP ScrollTrigger once frames are ready ─────────────────── */
  useEffect(() => {
    if (!isReady) return;

    const section = sectionRef.current;
    const canvas  = canvasRef.current;
    if (!section || !canvas) return;

    // Proxy: GSAP tweens this float, we snap it to an integer frame index
    const proxy = { frame: 0 };

    // gsap.context() scopes all GSAP work to this component.
    // ctx.revert() on cleanup undoes ALL mutations (pinning, inline styles)
    // This is the React-safe pattern that prevents the removeChild error.
    const ctx = gsap.context(() => {

      ScrollTrigger.create({
        trigger:    section,
        start:      'top top',
        end:        `+=${scrollHeight}`,
        pin:        true,
        pinSpacing: true,
        anticipatePin: 1,
        scrub: 1.5,

        onUpdate: (self) => {
          const targetFrame = Math.round(self.progress * (FRAME_COUNT - 1));

          gsap.to(proxy, {
            frame:    targetFrame,
            duration: 0,
            overwrite: true,
            onUpdate: () => {
              const idx = Math.round(proxy.frame);
              if (idx === currentIdxRef.current) return;
              currentIdxRef.current = idx;

              const frame = framesRef.current[idx];
              if (frame) drawFrame(canvas, frame);

              if (progressBarRef.current) {
                progressBarRef.current.style.width =
                  `${(idx / (FRAME_COUNT - 1)) * 100}%`;
              }
            },
          });

          if (scrollCueRef.current) {
            scrollCueRef.current.style.opacity =
              self.progress > 0.02 ? '0' : '1';
          }
        },
      });

      /* ─ Overlay text reveal ─ */
      if (overlayRef.current) {
        const lines = overlayRef.current.querySelectorAll('[data-line]');

        gsap.fromTo(
          lines,
          { y: 32, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1,
            stagger: 0.14,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: section,
              start:   `top+=${scrollHeight * 0.12} top`,
              end:     `top+=${scrollHeight * 0.28} top`,
              scrub:   1,
            },
          }
        );

        gsap.to(overlayRef.current, {
          opacity: 0,
          scrollTrigger: {
            trigger: section,
            start:   `top+=${scrollHeight * 0.75} top`,
            end:     `top+=${scrollHeight * 0.92} top`,
            scrub:   1,
          },
        });
      }

    }, section); // scope to the section element

    ScrollTrigger.refresh();

    return () => {
      ctx.revert();              // reverts ALL GSAP changes (pins, styles, etc.)
      gsap.killTweensOf(proxy);
    };
  }, [isReady, scrollHeight]);

  return (
    <section ref={sectionRef} className={styles.section}>
      <div className={styles.sticky}>

        {/* Loading state */}
        {!isReady && (
          <div className={styles.loader}>
            <div className={styles.loaderRing}>
              <svg viewBox="0 0 44 44" className={styles.loaderSvg}>
                <circle
                  cx="22" cy="22" r="18"
                  fill="none"
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth="2"
                />
                <circle
                  cx="22" cy="22" r="18"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 18}`}
                  strokeDashoffset={`${2 * Math.PI * 18 * (1 - loadPct / 100)}`}
                  className={styles.loaderArc}
                />
              </svg>
              <span className={styles.loaderPct}>{loadPct}%</span>
            </div>
            <p className={styles.loaderText}>Loading frames…</p>
          </div>
        )}

        {/* Canvas — the entire rendering surface */}
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          style={{ opacity: isReady ? 1 : 0 }}
        />

        {/* Text overlay */}
        <div ref={overlayRef} className={styles.overlay}>
          <span data-line className={styles.overlayEyebrow}>Scroll to explore</span>
          <h1 data-line className={styles.overlayHeading}>Crafted in motion.</h1>
          <p data-line className={styles.overlaySub}>
            Every frame. Every moment. Designed to move you.
          </p>
        </div>

        {/* Progress bar */}
        <div className={styles.progressBar}>
          <div ref={progressBarRef} className={styles.progressFill} />
        </div>

        {/* Scroll cue */}
        <div ref={scrollCueRef} className={styles.scrollCue}>
          <div className={styles.scrollIcon}>
            <div className={styles.scrollDot} />
          </div>
          <span>Scroll</span>
        </div>

      </div>
    </section>
  );
}

/* ─── Canvas draw helper ────────────────────────────────────────────── */
/**
 * Draws a frame image onto the canvas, letter-boxing / cropping to cover
 * the full canvas area (equivalent to object-fit: cover).
 */
function drawFrame(canvas, img) {
  const ctx = canvas.getContext('2d');
  if (!ctx || !img) return;

  const cw = canvas.width;
  const ch = canvas.height;
  const iw = img.naturalWidth  || img.width;
  const ih = img.naturalHeight || img.height;

  if (!iw || !ih) return;

  const canvasAspect = cw / ch;
  const imageAspect  = iw / ih;

  let sx, sy, sw, sh;

  if (imageAspect > canvasAspect) {
    // Image is wider → crop sides
    sh = ih;
    sw = ih * canvasAspect;
    sx = (iw - sw) / 2;
    sy = 0;
  } else {
    // Image is taller → crop top/bottom
    sw = iw;
    sh = iw / canvasAspect;
    sx = 0;
    sy = (ih - sh) / 2;
  }

  ctx.clearRect(0, 0, cw, ch);
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
}
