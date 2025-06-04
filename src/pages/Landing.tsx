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
    document.title = "SoundDocs | Patch Lists, Stage Plots, Run of Shows & Production Schedules";
  }, []);

  return (
    <>
      <Helmet>
        <title>SoundDocs | Patch Lists, Stage Plots, Run of Shows & Production Schedules</title>
        <meta
          name="description"
          content="SoundDocs: The ultimate web tool for audio engineers and production managers to create, manage, and share professional patch lists, stage plots, run of shows (with show mode), and production schedules. Streamline your event production workflow."
        />
        <meta
          name="keywords"
          content="patch list, stage plot, run of show, show mode, production schedule, audio engineer, sound design, production management, input list, output list, sound documentation, live sound, event production, audio production software, stage layout tool, concert planning, FOH, monitor engineer tools, event timeline, cue sheet"
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
