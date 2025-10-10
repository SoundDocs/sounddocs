/**
 * Organization Schema - Structured Data for SoundDocs
 * Provides company/organization information to search engines
 * Includes GitHub and Discord as primary social proof channels
 */

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "SoundDocs",
  url: "https://sounddocs.org",
  logo: "https://sounddocs.org/images/logo.png",
  description:
    "Professional audio, video, and lighting documentation platform for event production professionals. Create patch sheets, stage plots, run of shows, LED pixel maps, and analyze audio with our browser-based tools. 100% free forever.",
  foundingDate: "2024",
  sameAs: [
    // Primary social proof channels
    "https://github.com/SoundDocs/sounddocs",
  ],
};
