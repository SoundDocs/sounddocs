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
    document.title = "SoundDocs | Event Production Docs, Tools & Resources";
  }, []);

  return (
    <>
      <Helmet>
        <title>SoundDocs | Event Production Docs, Tools & Resources</title>
        <meta
          name="description"
          content="SoundDocs: The ultimate web tool for event professionals to create, manage, and share production documents like Patch Lists, Stage Plots, Mic Plots (Corporate & Theater), Run of Shows, and Production Schedules. Enhance your workflow with our comprehensive resources."
        />
        <meta
          name="keywords"
          content="event documentation, production management, audio engineer tools, stage plot software, patch list generator, mic plot creator, corporate event planning, theater production tools, run of show app, production schedule template, A/V/L documents, live sound resources"
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
