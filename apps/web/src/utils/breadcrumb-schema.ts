/**
 * Breadcrumb Schema Utility
 * Generates BreadcrumbList structured data for better SERP display
 * https://schema.org/BreadcrumbList
 */

export interface BreadcrumbItem {
  name: string;
  url: string;
}

/**
 * Generate BreadcrumbList schema for search engines
 * @param items - Array of breadcrumb items (name and URL)
 * @returns Schema.org BreadcrumbList object
 */
export const generateBreadcrumbSchema = (items: BreadcrumbItem[]) => {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `https://sounddocs.org${item.url}`,
    })),
  };
};

/**
 * Helper function to create breadcrumb items for common patterns
 */
export const createBreadcrumbs = {
  // Resources section breadcrumbs
  resources: (subPage?: string, subPageName?: string) => {
    const base: BreadcrumbItem[] = [
      { name: "Home", url: "/" },
      { name: "Resources", url: "/resources" },
    ];

    if (subPage && subPageName) {
      base.push({ name: subPageName, url: subPage });
    }

    return base;
  },

  // Audio category breadcrumbs
  audio: () => [
    { name: "Home", url: "/" },
    { name: "Audio", url: "/audio" },
  ],

  // Video category breadcrumbs
  video: () => [
    { name: "Home", url: "/" },
    { name: "Video", url: "/video" },
  ],

  // Lighting category breadcrumbs
  lighting: () => [
    { name: "Home", url: "/" },
    { name: "Lighting", url: "/lighting" },
  ],

  // Production category breadcrumbs
  production: () => [
    { name: "Home", url: "/" },
    { name: "Production", url: "/production" },
  ],

  // Analyzer breadcrumbs
  analyzer: (subPage?: "lite" | "pro") => {
    const base: BreadcrumbItem[] = [
      { name: "Home", url: "/" },
      { name: "Analyzer", url: "/analyzer" },
    ];

    if (subPage === "lite") {
      base.push({ name: "AcoustIQ Lite", url: "/analyzer/lite" });
    } else if (subPage === "pro") {
      base.push({ name: "AcoustIQ Pro", url: "/analyzer/pro" });
    }

    return base;
  },
};
