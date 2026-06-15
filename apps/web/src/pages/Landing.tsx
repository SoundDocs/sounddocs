import React, { useEffect, useState } from "react";
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

const SunsetBanner: React.FC = () => {
  const [visible, setVisible] = useState<boolean>(() => {
    try {
      return localStorage.getItem(SUNSET_BANNER_KEY) !== "true";
    } catch {
      return true;
    }
  });

  const dismiss = (): void => {
    try {
      localStorage.setItem(SUNSET_BANNER_KEY, "true");
    } catch {
      // localStorage unavailable — dismiss in-memory only
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="banner"
      aria-label="SoundDocs sunset notice"
      className="w-full bg-gray-900 border-b border-amber-500/30"
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Retirement notice */}
        <div className="flex items-start sm:items-center gap-2 text-amber-100 flex-1 min-w-0">
          <CalendarClock
            className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5 sm:mt-0"
            aria-hidden="true"
          />
          <p className="text-sm leading-snug">
            <span className="font-semibold text-white">SoundDocs retires September 1, 2026.</span>{" "}
            Keep your work:
          </p>
        </div>

        {/* Action links */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm flex-shrink-0">
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
          onClick={dismiss}
          aria-label="Dismiss sunset notice"
          className="self-start sm:self-center ml-auto sm:ml-2 p-1 rounded hover:bg-gray-800 transition-colors flex-shrink-0"
        >
          <X className="h-4 w-4 text-gray-400 hover:text-white" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};

const Landing: React.FC = () => {
  const { isOpen: showDeprecationModal, onClose: handleDismissDeprecation } =
    useDeprecationNotice();

  // On page load or when changing themes, best practice for accessibility
  useEffect(() => {
    document.title = "SoundDocs | Pro Audio & Event Production Documentation";
  }, []);

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
      <Header />
      <SunsetBanner />
      <main>
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
