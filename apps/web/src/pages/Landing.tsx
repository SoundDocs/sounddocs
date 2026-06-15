import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet";
import { CalendarClock, Download, Server, X, ExternalLink } from "lucide-react";
import Header from "../components/Header";
import Hero from "../components/Hero";
import Features from "../components/Features";
import TrustedBy from "../components/TrustedBy";
import GetStarted from "../components/GetStarted";
import Footer from "../components/Footer";
import DeprecationNoticeModal from "@/components/DeprecationNoticeModal";
import { useDeprecationNotice } from "@/hooks/useDeprecationNotice";

const SUNSET_BANNER_KEY = "sounddocs-sunset-banner-dismissed";

interface SunsetBannerProps {
  onDismiss: () => void;
}

const SunsetBanner = React.forwardRef<HTMLDivElement, SunsetBannerProps>(({ onDismiss }, ref) => {
  return (
    <div
      ref={ref}
      role="region"
      aria-label="SoundDocs sunset notice"
      className="fixed top-0 inset-x-0 z-[60] bg-gray-950/95 backdrop-blur-sm border-b border-amber-500/30"
    >
      <div className="relative max-w-7xl mx-auto px-4 py-2.5 pr-10 sm:pr-4 flex flex-col sm:flex-row sm:items-center gap-x-6 gap-y-1.5">
        {/* Retirement notice */}
        <div className="flex items-center gap-2 text-amber-100 min-w-0">
          <CalendarClock className="h-4 w-4 text-amber-400 flex-shrink-0" aria-hidden="true" />
          <p className="text-sm leading-snug">
            <span className="font-semibold text-white">SoundDocs retires September 1, 2026.</span>{" "}
            <span className="text-amber-200/90">Keep your work:</span>
          </p>
        </div>

        {/* Action links */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm sm:ml-auto">
          <a
            href="https://eventools.io/?mode=signup"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Try eventools free beta
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
          <a
            href="/profile"
            className="inline-flex items-center gap-1 text-gray-300 hover:text-white transition-colors"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            Download your data
          </a>
          <a
            href="https://github.com/SoundDocs/sounddocs/blob/main/self-host/EASY-START.md"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-gray-300 hover:text-white transition-colors"
          >
            <Server className="h-3.5 w-3.5" aria-hidden="true" />
            Self-host SoundDocs
          </a>
        </div>

        {/* Dismiss */}
        <button
          onClick={onDismiss}
          aria-label="Dismiss sunset notice"
          className="absolute right-2 top-1.5 sm:static sm:ml-1 p-1 rounded hover:bg-gray-800 transition-colors flex-shrink-0"
        >
          <X className="h-4 w-4 text-gray-400 hover:text-white" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
});
SunsetBanner.displayName = "SunsetBanner";

const Landing: React.FC = () => {
  const { isOpen: showDeprecationModal, onClose: handleDismissDeprecation } =
    useDeprecationNotice();

  const [sunsetVisible, setSunsetVisible] = useState<boolean>(() => {
    try {
      return localStorage.getItem(SUNSET_BANNER_KEY) !== "true";
    } catch {
      return true;
    }
  });
  const sunsetRef = useRef<HTMLDivElement>(null);
  const [bannerHeight, setBannerHeight] = useState(0);

  // On page load or when changing themes, best practice for accessibility
  useEffect(() => {
    document.title = "SoundDocs | Pro Audio & Event Production Documentation";
  }, []);

  // Measure the fixed sunset banner so the header + content clear it at every
  // breakpoint (it wraps to multiple lines on small screens). useLayoutEffect
  // runs before paint to avoid an initial overlap flash.
  useLayoutEffect(() => {
    if (!sunsetVisible) {
      setBannerHeight(0);
      return;
    }
    const el = sunsetRef.current;
    if (!el) return;
    const measure = () => setBannerHeight(el.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [sunsetVisible]);

  const dismissSunset = (): void => {
    try {
      localStorage.setItem(SUNSET_BANNER_KEY, "true");
    } catch {
      // localStorage unavailable — dismiss in-memory only
    }
    setSunsetVisible(false);
  };

  return (
    <>
      <Helmet>
        <title>SoundDocs | Pro Audio & Event Production Documentation</title>
        <meta
          name="description"
          content="Professional audio & event documentation platform featuring advanced math traces for measurement analysis. Create patch lists, stage plots, run of shows, and analyze audio with the first browser-based FFT analyzer supporting coherence-weighted averaging and transfer function mathematics."
        />
        <meta
          name="keywords"
          content="audio analyzer, acoustiq, rta, spl meter, transfer function, math traces, measurement averaging, coherence weighting, frequency analysis, event production, pixel map, LED wall designer, video mapping, audio documentation, video documentation, lighting documentation, production schedule, run of show, stage plot, patch list, mic plot, corporate mic plot, theater mic plot, wireless mic management, audio engineer, video technician, lighting designer, production management, input list, output list, sound documentation, video signal flow, lighting plot, DMX chart, audio production software, stage layout tool, concert planning, FOH, monitor engineer tools, event timeline, cue sheet, typical rates, technical formulas, audio formulas, video formulas, lighting formulas, reference guides, pinouts, frequency bands, decibel chart, industry glossaries, measurement mathematics, transfer function analysis, room averaging, system optimization"
        />
      </Helmet>
      {sunsetVisible && <SunsetBanner ref={sunsetRef} onDismiss={dismissSunset} />}
      <Header topOffset={bannerHeight} />
      <main style={bannerHeight ? { paddingTop: bannerHeight } : undefined}>
        <Hero />
        <Features />
        <TrustedBy />
        <GetStarted />
      </main>
      <Footer />
      <DeprecationNoticeModal isOpen={showDeprecationModal} onClose={handleDismissDeprecation} />
    </>
  );
};

export default Landing;
