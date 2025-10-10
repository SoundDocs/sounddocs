// generate-sitemap.js
// Automated sitemap generation for SoundDocs
// Run during build process to ensure all public pages are indexed

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = "https://sounddocs.org";

// Define all public pages with priority and changefreq
// Priority: 1.0 (highest) to 0.1 (lowest)
// Changefreq: always, hourly, daily, weekly, monthly, yearly, never
const pages = [
  // Core Pages
  { url: "/", priority: 1.0, changefreq: "weekly" },
  { url: "/login/", priority: 0.8, changefreq: "monthly" },
  { url: "/signup/", priority: 0.8, changefreq: "monthly" },

  // Category Pages
  { url: "/audio/", priority: 0.9, changefreq: "weekly" },
  { url: "/video/", priority: 0.9, changefreq: "weekly" },
  { url: "/lighting/", priority: 0.9, changefreq: "weekly" },
  { url: "/production/", priority: 0.9, changefreq: "weekly" },

  // Analyzer Pages
  { url: "/analyzer/", priority: 0.9, changefreq: "weekly" },
  { url: "/analyzer/lite/", priority: 0.8, changefreq: "monthly" },
  { url: "/analyzer/pro/", priority: 0.8, changefreq: "monthly" },

  // Resource Hub
  { url: "/resources/", priority: 0.9, changefreq: "weekly" },
  { url: "/resources/rates/", priority: 0.7, changefreq: "monthly" },
  { url: "/resources/audio-formulas/", priority: 0.7, changefreq: "monthly" },
  { url: "/resources/formulas/audio/", priority: 0.7, changefreq: "monthly" },
  { url: "/resources/formulas/video/", priority: 0.7, changefreq: "monthly" },
  { url: "/resources/formulas/lighting/", priority: 0.7, changefreq: "monthly" },
  { url: "/resources/reference-guides/", priority: 0.7, changefreq: "monthly" },
  { url: "/resources/guides/pinouts/", priority: 0.6, changefreq: "monthly" },
  { url: "/resources/guides/frequency-bands/", priority: 0.6, changefreq: "monthly" },
  { url: "/resources/guides/db-chart/", priority: 0.6, changefreq: "monthly" },
  { url: "/resources/guides/glossaries/", priority: 0.6, changefreq: "monthly" },

  // Legal Pages
  { url: "/privacy-policy/", priority: 0.3, changefreq: "yearly" },
  { url: "/terms-of-service/", priority: 0.3, changefreq: "yearly" },
];

/**
 * Generates XML sitemap with all public pages
 * @returns {string} Complete XML sitemap
 */
const generateSitemap = () => {
  const urlElements = pages
    .map(
      (page) => `  <url>
    <loc>${BASE_URL}${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`,
    )
    .join("\n");

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlElements}
</urlset>`;

  return sitemap;
};

/**
 * Write sitemap to public directory
 */
const writeSitemap = () => {
  try {
    const sitemap = generateSitemap();
    const publicDir = path.resolve(__dirname, "../public");
    const sitemapPath = path.join(publicDir, "sitemap.xml");

    fs.writeFileSync(sitemapPath, sitemap, "utf8");

    console.log("✅ Sitemap generated successfully!");
    console.log(`📄 ${pages.length} URLs included`);
    console.log(`📍 Location: ${sitemapPath}`);
    console.log(`🗓️  Last modified: ${BUILD_DATE}`);
  } catch (error) {
    console.error("❌ Error generating sitemap:", error);
    process.exit(1);
  }
};

// Execute sitemap generation
writeSitemap();
