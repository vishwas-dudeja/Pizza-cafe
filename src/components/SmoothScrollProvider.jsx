'use client';

import { createContext, useContext, useEffect, useRef } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const LenisContext = createContext(null);

/**
 * SmoothScrollProvider
 *
 * Wraps the app with a Lenis smooth-scroll instance that is ticked
 * exclusively inside GSAP's requestAnimationFrame loop. This means:
 *   - Only ONE rAF runs for both Lenis and every GSAP animation
 *   - ScrollTrigger receives Lenis's virtual scroll position, not the
 *     browser's native offset, so all triggers fire at the right time
 *
 * Usage: wrap your root layout's children with this component.
 */
export default function SmoothScrollProvider({ children }) {
  const lenisRef = useRef(null);

  useEffect(() => {
    // 1. Instantiate Lenis
    const lenis = new Lenis({
      lerp: 0.08,           // inertia (0 = instant, 1 = never reaches target)
      smoothWheel: true,    // smooth mouse wheel
      wheelMultiplier: 1,   // wheel speed factor
      touchMultiplier: 1.5, // touch scroll speed factor
      infinite: false,
    });

    lenisRef.current = lenis;

    // 2. Plug Lenis into GSAP's ticker — single shared RAF
    //    GSAP's ticker fires every frame, so Lenis runs at the same cadence
    //    as all GSAP animations: perfectly synchronized.
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000); // Lenis expects ms, GSAP ticker gives seconds
    });

    // 3. Disable GSAP's built-in lag smoothing so our manual tick is accurate
    gsap.ticker.lagSmoothing(0);

    // 4. Keep ScrollTrigger's trigger positions accurate as Lenis scrolls
    lenis.on('scroll', ScrollTrigger.update);

    // 5. After fonts / images load, recalculate all trigger positions
    ScrollTrigger.refresh();

    return () => {
      lenis.destroy();
      gsap.ticker.remove(lenis.raf);
    };
  }, []);

  return (
    <LenisContext.Provider value={lenisRef}>
      {children}
    </LenisContext.Provider>
  );
}

/** Hook: get the Lenis instance inside any client component */
export function useLenis() {
  return useContext(LenisContext);
}
