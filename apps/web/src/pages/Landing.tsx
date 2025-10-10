import React, { useEffect } from "react";
import { Helmet } from "react-helmet";
import Header from "../components/Header";
import Hero from "../components/Hero";
import Features from "../components/Features";
import TrustedBy from "../components/TrustedBy";
import GetStarted from "../components/GetStarted";
import Footer from "../components/Footer";
import { getCanonicalUrl } from "../utils/canonical-url";
import { organizationSchema } from "../schemas/organization-schema";

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
          content="Professional audio & event production platform. Create patch sheets, stage plots, run of shows, LED pixel maps, and analyze audio. 100% free forever."
        />
        <meta
          name="keywords"
          content="audio analyzer, event production documentation, stage plot software, patch sheet, run of show template, LED pixel mapping, audio documentation, browser-based analyzer"
        />

        {/* Canonical URL */}
        <link rel="canonical" href={getCanonicalUrl()} />

        {/* Open Graph - Social Media */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://sounddocs.org/" />
        <meta
          property="og:title"
          content="SoundDocs | Pro Audio & Event Production Documentation"
        />
        <meta
          property="og:description"
          content="Professional audio & event documentation platform. Create patch sheets, stage plots, run of shows, and analyze audio. 100% free forever."
        />
        <meta property="og:image" content="https://i.postimg.cc/c448TSnj/New-Project-3.png" />
        <meta property="og:site_name" content="SoundDocs" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="SoundDocs | Pro Audio & Event Production Documentation"
        />
        <meta
          name="twitter:description"
          content="Professional audio & event documentation platform. Create patch sheets, stage plots, run of shows, and analyze audio. 100% free forever."
        />
        <meta name="twitter:image" content="https://i.postimg.cc/c448TSnj/New-Project-3.png" />

        {/* Organization Structured Data */}
        <script type="application/ld+json">{JSON.stringify(organizationSchema)}</script>
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
