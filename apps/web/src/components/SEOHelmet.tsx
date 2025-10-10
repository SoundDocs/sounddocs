import React from "react";
import { Helmet } from "react-helmet";
import { generatePageSEO, type PageSEO } from "../utils/seo-helpers";

interface SEOHelmetProps {
  config: PageSEO;
  children?: React.ReactNode;
}

/**
 * Reusable SEO Helmet component
 * Generates all standard meta tags from a configuration object
 */
export const SEOHelmet: React.FC<SEOHelmetProps> = ({ config, children }) => {
  const seo = generatePageSEO(config);

  return (
    <Helmet>
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />
      {seo.keywords && <meta name="keywords" content={seo.keywords} />}

      {/* Canonical URL */}
      <link rel="canonical" href={seo.canonical} />

      {/* Open Graph */}
      <meta property="og:type" content={seo.ogType} />
      <meta property="og:url" content={seo.ogUrl} />
      <meta property="og:title" content={seo.ogTitle} />
      <meta property="og:description" content={seo.ogDescription} />
      <meta property="og:image" content={seo.ogImage} />
      <meta property="og:site_name" content={seo.ogSiteName} />

      {/* Twitter Card */}
      <meta name="twitter:card" content={seo.twitterCard} />
      <meta name="twitter:title" content={seo.twitterTitle} />
      <meta name="twitter:description" content={seo.twitterDescription} />
      <meta name="twitter:image" content={seo.twitterImage} />

      {/* Additional custom meta tags */}
      {children}
    </Helmet>
  );
};
