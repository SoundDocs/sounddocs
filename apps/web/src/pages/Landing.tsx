import React, { useEffect } from "react";
import { Helmet } from "react-helmet";
import Header from "../components/Header";
import Hero from "../components/Hero";
import Features from "../components/Features";
import TrustedBy from "../components/TrustedBy";
import GetStarted from "../components/GetStarted";
import Footer from "../components/Footer";

const Landing: React.FC = () => {
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
      <main>
        <Hero />
        <Features />
        <TrustedBy />
        <GetStarted />
      </main>
      <Footer />
    </>
  );
};

export default Landing;
