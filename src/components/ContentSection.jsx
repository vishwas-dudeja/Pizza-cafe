'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import styles from '@/app/page.module.css';

gsap.registerPlugin(ScrollTrigger);

const CARDS = ['Identity', 'Motion', 'Digital', 'Editorial'];

/**
 * ContentSection
 *
 * Client component so we can run GSAP reveal animations on:
 *   – The eyebrow / heading / body text (fade + slide-up on enter)
 *   – The 4 category cards (stagger reveal)
 *
 * All animations use ScrollTrigger.  Because SmoothScrollProvider syncs
 * Lenis to GSAP's ticker, these triggers fire at exactly the right time.
 */
export default function ContentSection() {
  const sectionRef  = useRef(null);
  const headingRef  = useRef(null);
  const eyebrowRef  = useRef(null);
  const bodyRef     = useRef(null);
  const cardsRef    = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const defaults = {
        ease:     'power3.out',
        duration: 0.9,
      };

      // ── Eyebrow
      gsap.from(eyebrowRef.current, {
        ...defaults,
        y:       20,
        opacity: 0,
        scrollTrigger: {
          trigger: eyebrowRef.current,
          start:   'top 85%',
          toggleActions: 'play none none none',
        },
      });

      // ── Heading
      gsap.from(headingRef.current, {
        ...defaults,
        y:       40,
        opacity: 0,
        duration: 1.1,
        delay:   0.08,
        scrollTrigger: {
          trigger: headingRef.current,
          start:   'top 85%',
          toggleActions: 'play none none none',
        },
      });

      // ── Body
      gsap.from(bodyRef.current, {
        ...defaults,
        y:       24,
        opacity: 0,
        delay:   0.18,
        scrollTrigger: {
          trigger: bodyRef.current,
          start:   'top 88%',
          toggleActions: 'play none none none',
        },
      });

      // ── Cards stagger
      if (cardsRef.current) {
        const cards = cardsRef.current.querySelectorAll('[data-card]');
        gsap.from(cards, {
          y:        50,
          opacity:  0,
          duration: 0.8,
          stagger:  0.1,
          ease:     'power3.out',
          scrollTrigger: {
            trigger: cardsRef.current,
            start:   'top 85%',
            toggleActions: 'play none none none',
          },
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className={styles.contentSection} id="work">
      <div className={styles.contentInner}>
        <span ref={eyebrowRef} className={styles.eyebrow}>Our Work</span>
        <h2 ref={headingRef} className={styles.heading}>
          Crafted with intention.
        </h2>
        <p ref={bodyRef} className={styles.body}>
          Every project begins with a simple question: what should this feel
          like? We obsess over motion, pacing, and precision — so that when
          someone encounters our work, it stays with them.
        </p>
      </div>

      <div ref={cardsRef} className={styles.grid}>
        {CARDS.map((label) => (
          <div key={label} data-card className={styles.card}>
            <div className={styles.cardIcon} />
            <span className={styles.cardLabel}>{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
