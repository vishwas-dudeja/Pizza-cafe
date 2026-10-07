import './globals.css';
import SmoothScrollProvider from '@/components/SmoothScrollProvider';

export const metadata = {
  title: 'Scroll Video Experience',
  description:
    'An immersive scroll-driven video experience — scroll down to play.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body suppressHydrationWarning>
        {/*
          SmoothScrollProvider is a 'use client' component.
          It wraps the entire page with a Lenis instance ticked by GSAP's
          RAF, ensuring all ScrollTrigger animations are perfectly in sync.
        */}
        <SmoothScrollProvider>{children}</SmoothScrollProvider>
      </body>
    </html>
  );
}
