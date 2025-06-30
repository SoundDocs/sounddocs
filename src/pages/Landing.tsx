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
          content="Streamline your event production with SoundDocs. Create, manage, and share patch lists, stage plots, schedules, and more. The essential tool for A/V/L pros. Free."
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
