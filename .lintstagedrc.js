// Lint-staged configuration for SoundDocs monorepo
// Handles different TypeScript configurations for different workspaces

export default {
  // TypeScript files - use appropriate tsconfig based on location
  "**/*.{ts,tsx}": (filenames) => {
    const commands = [];

    // Group files by workspace
    const webFiles = filenames.filter((f) => f.includes("apps/web/"));
    const packageFiles = filenames.filter((f) => f.includes("packages/"));
    const otherFiles = filenames.filter(
      (f) => !f.includes("apps/web/") && !f.includes("packages/"),
    );

    // Run TypeScript checks with appropriate config
    if (webFiles.length > 0) {
      // For web app files, use the web app's tsconfig
      commands.push("cd apps/web && pnpm tsc --noEmit -p tsconfig.app.json");
    }

    if (packageFiles.length > 0) {
      // For package files, check each package
      const analyzerLiteFiles = packageFiles.filter((f) => f.includes("packages/analyzer-lite/"));
      const analyzerProtocolFiles = packageFiles.filter((f) =>
        f.includes("packages/analyzer-protocol/"),
      );

      if (analyzerLiteFiles.length > 0) {
        commands.push("cd packages/analyzer-lite && pnpm tsc --noEmit");
      }
      if (analyzerProtocolFiles.length > 0) {
        commands.push("cd packages/analyzer-protocol && pnpm tsc --noEmit");
      }
    }

    if (otherFiles.length > 0) {
      // For other files, use root tsconfig
      commands.push("pnpm tsc --noEmit --skipLibCheck");
    }

    // ESLint for TypeScript files in web app
    if (webFiles.length > 0) {
      const webFileRelative = webFiles.map((f) => f.replace("apps/web/", ""));
      commands.push(
        `cd apps/web && pnpm eslint --max-warnings=0 --cache ${webFileRelative.join(" ")}`,
      );
    }

    // Prettier for all TypeScript files
    if (filenames.length > 0) {
      commands.push(`pnpm prettier --write --ignore-unknown ${filenames.join(" ")}`);
    }

    return commands;
  },

  // JavaScript files - handle monorepo structure
  "**/*.{js,jsx}": (filenames) => {
    const commands = [];

    // Group files by workspace for ESLint
    const webFiles = filenames.filter((f) => f.includes("apps/web/"));
    const rootFiles = filenames.filter((f) => !f.includes("apps/") && !f.includes("packages/"));

    // ESLint for web app JavaScript files
    if (webFiles.length > 0) {
      const webFileRelative = webFiles.map((f) => f.replace("apps/web/", ""));
      commands.push(
        `cd apps/web && pnpm eslint --max-warnings=0 --cache ${webFileRelative.join(" ")}`,
      );
    }

    // For root level JS files (like this config), just format
    if (rootFiles.length > 0) {
      commands.push(`pnpm prettier --write --ignore-unknown ${rootFiles.join(" ")}`);
    }

    // Prettier for all JavaScript files
    if (filenames.length > 0) {
      commands.push(`pnpm prettier --write --ignore-unknown ${filenames.join(" ")}`);
    }

    return commands;
  },

  // Python files
  "**/*.py": (filenames) => {
    // Only run ruff if it's installed
    return [
      `command -v ruff >/dev/null 2>&1 && ruff check --fix ${filenames.join(" ")} || echo "Ruff not installed, skipping Python linting"`,
      `command -v ruff >/dev/null 2>&1 && ruff format ${filenames.join(" ")} || true`,
    ];
  },

  // SQL files
  "**/*.sql": (filenames) => {
    // Only run sqlfluff if it's installed
    return [
      `command -v sqlfluff >/dev/null 2>&1 && sqlfluff fix --dialect postgres ${filenames.join(" ")} || echo "SQLFluff not installed, skipping SQL linting"`,
    ];
  },

  // Other files - just format with prettier
  "**/*.{json,md,yml,yaml,css}": (filenames) => [
    `pnpm prettier --write --ignore-unknown ${filenames.join(" ")}`,
  ],
};
