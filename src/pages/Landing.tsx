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
    document.title = "SoundDocs | Professional Patch Lists & Stage Plots for Audio Engineers";
  }, []);

  return (
    <>
      <Helmet>
        <title>SoundDocs | Professional Patch Lists & Stage Plots for Audio Engineers</title>
        <meta
          name="description"
          content="Create professional patch lists and stage plots for audio engineers, sound designers, and production teams. Free, easy-to-use tools for technical documentation."
        />
        <meta
          name="keywords"
          content="patch list, stage plot, audio engineer, sound production, technical rider, input list"
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
