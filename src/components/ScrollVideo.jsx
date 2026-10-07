'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import styles from './ScrollVideo.module.css';

gsap.registerPlugin(ScrollTrigger);

/**
 * ScrollVideo — Premium scroll-driven video scrubbing.
 *
 * Engine:
 *  • GSAP ScrollTrigger pins the section and tracks scroll progress (0→1)
 *  • On each progress update, a GSAP tween smoothly drives video.currentTime
 *    with duration:1.5 + ease:'power2.out' → cinematic lag / momentum
 *  • Progress bar is updated via a direct DOM ref (zero React re-renders)
 *  • Works in tandem with Lenis via the shared GSAP ticker
 *
 * Props:
 *   src          – video source path (default "/hero.mp4")
 *   scrollHeight – pixels of scroll that map to the full video (default 5000)
 */
export default function ScrollVideo({
  src = '/hero.mp4',
  scrollHeight = 5000,
}) {
  const sectionRef      = useRef(null);
  const videoRef        = useRef(null);
  const progressBarRef  = useRef(null);   // direct DOM ref — no state updates
  const scrollCueRef    = useRef(null);
  const overlayRef      = useRef(null);

  const [isReady, setIsReady] = useState(false);

  /* ─── 1. Detect when video metadata is available ─────────────────── */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const markReady = () => setIsReady(true);

    if (video.readyState >= 1) {
      markReady();
    } else {
      video.addEventListener('loadedmetadata', markReady);
      return () => video.removeEventListener('loadedmetadata', markReady);
    }
  }, []);

  /* ─── 2. GSAP ScrollTrigger + cinematic video scrub ─────────────── */
  useEffect(() => {
    if (!isReady) return;

    const video   = videoRef.current;
    const section = sectionRef.current;
    if (!video || !section) return;

    // Proxy object: GSAP tweens this, we read it each frame
    const proxy = { currentTime: 0 };

    // Main ScrollTrigger — pins the section and drives everything
    const st = ScrollTrigger.create({
      trigger: section,
      start:   'top top',
      end:     `+=${scrollHeight}`,
      pin:     true,
      pinSpacing: true,
      anticipatePin: 1,
      onUpdate: (self) => {
        const targetTime = self.progress * video.duration;

        // Cinematic tween: ~1.5s ease-out lag — feels like the video has
        // momentum and continues slightly after the user stops scrolling
        gsap.to(proxy, {
          currentTime: targetTime,
          duration:    1.5,
          ease:        'power2.out',
          overwrite:   true,        // kills any previous in-flight tween
          onUpdate: () => {
            // Clamp to valid range
            const t = Math.max(0, Math.min(video.duration, proxy.currentTime));
            video.currentTime = t;

            // Update progress bar directly — no React state, no re-render
            if (progressBarRef.current) {
              progressBarRef.current.style.width = `${(t / video.duration) * 100}%`;
            }
          },
        });

        // Fade out scroll cue once scrolling starts
        if (scrollCueRef.current) {
          scrollCueRef.current.style.opacity = self.progress > 0.02 ? '0' : '1';
        }
      },
    });

    /* ─ Overlay text reveal at ~15% progress ─ */
    if (overlayRef.current) {
      const lines = overlayRef.current.querySelectorAll('[data-line]');
      gsap.fromTo(
        lines,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          stagger: 0.12,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start:   `top+=${scrollHeight * 0.12} top`,
            end:     `top+=${scrollHeight * 0.30} top`,
            scrub:   1,           // gentle scrub for the text reveal
          },
        }
      );

      // Fade overlay OUT near the end of the section
      gsap.to(overlayRef.current, {
        opacity: 0,
        duration: 0.5,
        ease: 'power2.in',
        scrollTrigger: {
          trigger: section,
          start:   `top+=${scrollHeight * 0.75} top`,
          end:     `top+=${scrollHeight * 0.92} top`,
          scrub:   1,
        },
      });
    }

    // Refresh after setup so trigger boundaries are pixel-perfect
    ScrollTrigger.refresh();

    return () => {
      st.kill();
      ScrollTrigger.getAll().forEach((t) => t.kill());
      gsap.killTweensOf(proxy);
    };
  }, [isReady, scrollHeight]);

  return (
    <section ref={sectionRef} className={styles.section}>
      <div className={styles.sticky}>

        {/* Loading overlay */}
        {!isReady && (
          <div className={styles.loader}>
            <div className={styles.loaderSpinner} />
            <p className={styles.loaderText}>Loading…</p>
          </div>
        )}

        {/* Video */}
        <video
          ref={videoRef}
          className={styles.video}
          src={src}
          muted
          playsInline
          preload="auto"
          style={{ opacity: isReady ? 1 : 0 }}
        />

        {/* Text overlay — animated in by GSAP */}
        <div ref={overlayRef} className={styles.overlay}>
          <span data-line className={styles.overlayEyebrow}>Scroll to explore</span>
          <h1 data-line className={styles.overlayHeading}>Crafted in motion.</h1>
          <p data-line className={styles.overlaySub}>
            Every frame. Every moment. Designed to move you.
          </p>
        </div>

        {/* Progress bar — updated via direct DOM ref */}
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
