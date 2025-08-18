import React, { useEffect } from "react";
import { Helmet } from "react-helmet";
import Header from "../components/Header";
import Hero from "../components/Hero";
import Features from "../components/Features";
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
          content="The ultimate tool for event professionals to create, organize, and share patch lists, stage plots, run of shows, production schedules, and more for live events and studio sessions. Now featuring the first professional, browser-based FFT audio analyzer."
        />
        <meta
          name="keywords"
          content="audio analyzer, acoustiq, rta, spl meter, transfer function, event production, pixel map, LED wall designer, video mapping, audio documentation, video documentation, lighting documentation, production schedule, run of show, stage plot, patch list, mic plot, corporate mic plot, theater mic plot, wireless mic management, audio engineer, video technician, lighting designer, production management, input list, output list, sound documentation, video signal flow, lighting plot, DMX chart, audio production software, stage layout tool, concert planning, FOH, monitor engineer tools, event timeline, cue sheet, typical rates, technical formulas, audio formulas, video formulas, lighting formulas, reference guides, pinouts, frequency bands, decibel chart, industry glossaries"
        />
      </Helmet>
      <Header />
      <main>
        <Hero />
        <Features />
        <GetStarted />
      </main>
      <Footer />
    </>
  );
};

export default Landing;
