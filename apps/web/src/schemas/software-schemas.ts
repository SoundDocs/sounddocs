/**
 * SoftwareApplication Schema Utilities
 * Generates structured data for software products
 * https://schema.org/SoftwareApplication
 */

/**
 * AcoustIQ Lite - Browser-based audio analyzer
 */
export const acoustiqLiteSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "AcoustIQ Lite",
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Web Browser",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  description:
    "Free browser-based audio analyzer with real-time spectrogram (RTA), SPL meter with calibration, and instant analysis. No installation or setup required.",
  featureList: [
    "Real-time Spectrogram (RTA)",
    "SPL Meter with Calibration",
    "No Setup Required",
    "Works in any modern web browser",
    "Free forever",
  ],
  screenshot: "https://i.postimg.cc/c448TSnj/New-Project-3.png",
  author: {
    "@type": "Organization",
    name: "SoundDocs",
  },
  datePublished: "2024-01-15",
  softwareVersion: "2.0",
  url: "https://sounddocs.org/analyzer/lite",
  browserRequirements: "Requires JavaScript and Web Audio API support",
  permissions: "Requires microphone access",
};

/**
 * AcoustIQ Pro - Dual-channel audio analyzer with capture agent
 */
export const acoustiqProSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "AcoustIQ Pro",
  applicationCategory: "MultimediaApplication",
  operatingSystem: ["macOS", "Windows 10", "Windows 11"],
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  description:
    "Professional dual-channel audio analyzer with transfer function analysis, coherence measurement, phase analysis, and coherence-weighted averaging. Requires local capture agent installation.",
  featureList: [
    "Dual-Channel Transfer Function",
    "Coherence Measurement",
    "Phase Analysis",
    "Coherence-Weighted Averaging",
    "Professional Audio Interface Support",
    "High-precision measurements",
    "Free forever",
  ],
  screenshot: "https://i.postimg.cc/c448TSnj/New-Project-3.png",
  author: {
    "@type": "Organization",
    name: "SoundDocs",
  },
  datePublished: "2024-01-15",
  softwareVersion: "2.0",
  url: "https://sounddocs.org/analyzer/pro",
  downloadUrl: "https://github.com/SoundDocs/sounddocs/releases",
  fileSize: "45MB",
  softwareRequirements: "Professional audio interface recommended for best results",
  permissions: "Requires microphone/audio interface access",
};

/**
 * SoundDocs Platform - Main application schema
 */
export const soundDocsPlatformSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "SoundDocs",
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Web Browser",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  description:
    "Professional event production documentation platform for audio, video, lighting, and production teams. Create patch sheets, stage plots, pixel maps, run of shows, and more.",
  featureList: [
    "Audio patch sheets and mic plots",
    "Stage plots and system diagrams",
    "LED pixel mapping",
    "Production schedules and run of shows",
    "Technical rider creation",
    "Real-time collaboration",
    "Free forever",
  ],
  screenshot: "https://i.postimg.cc/c448TSnj/New-Project-3.png",
  author: {
    "@type": "Organization",
    name: "SoundDocs",
  },
  datePublished: "2023-06-01",
  softwareVersion: "2.0.0",
  url: "https://sounddocs.org",
  browserRequirements:
    "Requires JavaScript. Modern browser recommended (Chrome, Firefox, Safari, Edge).",
};
