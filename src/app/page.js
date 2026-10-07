import FrameCanvas from '@/components/FrameCanvas';
import ContentSection from '@/components/ContentSection';
import styles from './page.module.css';

export default function Home() {
  return (
    <main className={styles.main}>
      {/* ── Navbar ── */}
      <nav className={styles.nav}>
        <span className={styles.logo}>Pizza cafe</span>
        <ul className={styles.navLinks}>
          <li><a href="#work">Menu</a></li>
          <li><a href="#about">About</a></li>
          <li><a href="#contact">Contact</a></li>
        </ul>
      </nav>

      {/* ── Scroll-driven frame sequence hero ── */}
      {/*
        Frames: public/ezgif-frame-001.jpg → public/ezgif-frame-300.jpg
        scrollHeight = pixels of scroll that map to all 300 frames.
      */}
      <FrameCanvas scrollHeight={6000} />

      {/* ── Content below the hero (client component for GSAP reveals) ── */}
      <ContentSection />

      <section className={styles.quoteSection}>
        <blockquote className={styles.quote}>
          &ldquo;Simplicity is the ultimate sophistication.&rdquo;
        </blockquote>
        <cite className={styles.cite}>— Leonardo da Vinci</cite>
      </section>

      <footer className={styles.footer}>
        <span>© 2025 Studio. All rights reserved.</span>
      </footer>
    </main>
  );
}
