/**
 * SEO Helper Functions
 * Utilities for generating consistent SEO metadata across pages
 */

export interface PageSEO {
  title: string;
  description: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  canonicalPath?: string;
}

/**
 * Generate standard meta tags for a page
 * @param seo - SEO configuration for the page
 * @returns Object with title, meta tags, and canonical URL
 */
export const generatePageSEO = (seo: PageSEO) => {
  const baseUrl = "https://sounddocs.org";
  const canonicalUrl = seo.canonicalPath
    ? `${baseUrl}${seo.canonicalPath}`
    : typeof window !== "undefined"
      ? `${baseUrl}${window.location.pathname}`
      : baseUrl;

  const ogImage = "https://i.postimg.cc/c448TSnj/New-Project-3.png";

  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    canonical: canonicalUrl,
    ogType: "website" as const,
    ogUrl: canonicalUrl,
    ogTitle: seo.ogTitle || seo.title,
    ogDescription: seo.ogDescription || seo.description,
    ogImage,
    ogSiteName: "SoundDocs",
    twitterCard: "summary_large_image" as const,
    twitterTitle: seo.ogTitle || seo.title,
    twitterDescription: seo.ogDescription || seo.description,
    twitterImage: ogImage,
  };
};

/**
 * Common SEO configurations for different page types
 */
export const pageSEO = {
  dashboard: {
    title: "Dashboard | SoundDocs",
    description:
      "Your SoundDocs dashboard. Access all your patch sheets, stage plots, run of shows, pixel maps, and production schedules in one place.",
    keywords: "dashboard, my documents, audio documentation, production documents",
    canonicalPath: "/dashboard",
  },

  allPatchSheets: {
    title: "My Patch Sheets | SoundDocs",
    description:
      "View and manage all your audio patch sheets. Create input/output lists, channel assignments, and equipment documentation for live events and studio sessions.",
    keywords: "patch sheets, audio documentation, input list, channel list, sound documentation",
    canonicalPath: "/all-patch-sheets",
  },

  allStagePlots: {
    title: "My Stage Plots | SoundDocs",
    description:
      "View and manage all your stage plots. Visual stage layouts showing instrument placement, monitor positions, and backline setup for live events.",
    keywords: "stage plot, stage layout, backline, instrument placement, stage design",
    canonicalPath: "/all-stage-plots",
  },

  allRunOfShows: {
    title: "My Run of Shows | SoundDocs",
    description:
      "View and manage all your run of shows. Event timelines, cue sheets, and show flows with real-time Show Mode for live event management.",
    keywords: "run of show, cue sheet, event timeline, show flow, production timeline",
    canonicalPath: "/all-run-of-shows",
  },

  allPixelMaps: {
    title: "My LED Pixel Maps | SoundDocs",
    description:
      "View and manage all your LED pixel maps. Design LED wall layouts, video wall configurations, and pixel mapping for live events.",
    keywords: "LED pixel map, video wall, LED wall designer, pixel mapping, video mapping",
    canonicalPath: "/all-pixel-maps",
  },

  allProductionSchedules: {
    title: "My Production Schedules | SoundDocs",
    description:
      "View and manage all your production schedules. Timeline management, task tracking, and deadline organization for events and tours.",
    keywords:
      "production schedule, event timeline, task management, production planning, tour schedule",
    canonicalPath: "/all-production-schedules",
  },

  allRiders: {
    title: "My Technical Riders | SoundDocs",
    description:
      "View and manage all your technical riders. Create artist riders, tour riders, hospitality requirements, and technical specifications.",
    keywords: "technical rider, artist rider, tour rider, hospitality rider, backline requirements",
    canonicalPath: "/all-riders",
  },

  allMicPlots: {
    title: "My Mic Plots | SoundDocs",
    description:
      "View and manage all your microphone plots. Corporate and theater mic plots for conferences, panel discussions, and theatrical productions.",
    keywords: "mic plot, microphone placement, corporate audio, theater audio, wireless mic",
    canonicalPath: "/all-mic-plots",
  },

  allCommsPlans: {
    title: "My Comms Plans | SoundDocs",
    description:
      "View and manage all your communications plans. Wireless communication setups, intercom systems, and frequency coordination.",
    keywords: "comms plan, wireless comms, intercom system, frequency coordination, radio comms",
    canonicalPath: "/all-comms-plans",
  },

  rates: {
    title: "Typical Freelance Rates | Audio, Video, Lighting | SoundDocs",
    description:
      "Explore common freelance rates for audio engineers, video technicians, lighting designers, and production professionals. Industry rate guides for quoting projects.",
    keywords:
      "audio engineer rates, lighting designer rates, video tech rates, freelance rates, production rates, FOH engineer rates, monitor engineer rates",
    canonicalPath: "/resources/rates",
  },

  audioFormulas: {
    title: "Audio Formulas & Calculators | Technical Reference | SoundDocs",
    description:
      "Essential audio formulas and calculators: Ohm's Law, dB calculations, wavelength, delay time, speaker placement, and more. Quick reference for audio engineers.",
    keywords:
      "audio formulas, ohms law calculator, dB calculator, wavelength calculator, delay calculator, audio calculations",
    canonicalPath: "/resources/audio-formulas",
  },

  referenceGuides: {
    title: "Reference Guides | Pinouts, Frequency Charts, dB Charts | SoundDocs",
    description:
      "Quick reference materials for audio, video, and lighting: connector pinouts, frequency band info, decibel charts, and industry glossaries.",
    keywords:
      "connector pinouts, frequency bands, dB chart, XLR pinout, audio reference, video reference",
    canonicalPath: "/resources/reference-guides",
  },

  commonPinouts: {
    title: "Common Connector Pinouts | XLR, TRS, RCA, HDMI | SoundDocs",
    description:
      "Comprehensive connector pinout reference for audio and video: XLR, TRS, TS, RCA, HDMI, DisplayPort, Ethernet, DMX, and more.",
    keywords:
      "XLR pinout, TRS wiring, connector pinouts, audio connectors, video connectors, balanced audio",
    canonicalPath: "/resources/reference-guides/common-pinouts",
  },

  frequencyBands: {
    title: "Audio Frequency Bands Chart | Sub-Bass to Air | SoundDocs",
    description:
      "Complete audio frequency bands reference chart from sub-bass (20Hz) to air (20kHz). Understand frequency ranges for EQ and mixing.",
    keywords:
      "frequency bands, audio frequency chart, EQ reference, frequency range, bass frequencies, treble frequencies",
    canonicalPath: "/resources/reference-guides/frequency-bands",
  },

  decibelChart: {
    title: "Decibel Level Chart | SPL Reference Guide | SoundDocs",
    description:
      "Comprehensive decibel (dB) level chart showing common sound pressure levels from whisper to jet engine. Safe listening levels and hearing protection guide.",
    keywords:
      "decibel chart, dB levels, SPL chart, sound pressure level, safe listening levels, hearing protection",
    canonicalPath: "/resources/reference-guides/decibel-chart",
  },

  glossaries: {
    title: "Audio, Video, Lighting Glossary | Technical Terms | SoundDocs",
    description:
      "Comprehensive glossary of audio, video, and lighting terminology. Industry terms, technical definitions, and production vocabulary reference.",
    keywords:
      "audio glossary, video glossary, lighting glossary, production terms, technical definitions",
    canonicalPath: "/resources/reference-guides/glossaries",
  },

  lensCalculator: {
    title: "Video Projector Lens Calculator | Throw Distance | SoundDocs",
    description:
      "Calculate projector throw distance, lens selection, and screen size. Supports Barco and Christie projectors for event production.",
    keywords:
      "lens calculator, throw distance calculator, projector calculator, Barco calculator, Christie projector",
    canonicalPath: "/resources/lens-calculator",
  },

  profile: {
    title: "My Profile | SoundDocs",
    description: "Manage your SoundDocs profile, preferences, and account settings.",
    keywords: "profile, account settings, user preferences",
    canonicalPath: "/profile",
  },
};
