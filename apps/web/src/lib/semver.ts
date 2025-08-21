/**
 * Compares two semantic version strings to determine if the first version is older than the second.
 * Supports version strings in the format "major.minor.patch".
 *
 * @param currentVersion The version string of the current installation (e.g., "0.1.8").
 * @param latestVersion The version string of the latest available version (e.g., "0.1.9").
 * @returns True if the currentVersion is older than the latestVersion, false otherwise.
 */
export const isOlderVersion = (currentVersion: string, latestVersion: string): boolean => {
  // Strip any leading 'v' from the version strings
  const normalize = (v: string) => (v.startsWith("v") ? v.substring(1) : v);

  const current = normalize(currentVersion).split(".").map(Number);
  const latest = normalize(latestVersion).split(".").map(Number);

  // Ensure both version strings have the same number of parts by padding with zeros
  const maxLength = Math.max(current.length, latest.length);
  while (current.length < maxLength) current.push(0);
  while (latest.length < maxLength) latest.push(0);

  for (let i = 0; i < maxLength; i++) {
    if (current[i] < latest[i]) {
      return true;
    }
    if (current[i] > latest[i]) {
      return false;
    }
  }

  return false;
};

/**
 * Extracts the first valid semantic version string (e.g., "1.2.3") from a given string.
 *
 * @param v The string to parse, which may contain prefixes or other text (e.g., "capture-agent-py/0.1.0").
 * @returns The extracted semver string, or null if no valid semver is found.
 */
export const extractSemver = (v?: string | null): string | null => {
  if (!v) return null;
  // Match the first occurrence of a numeric semver pattern (X.Y, X.Y.Z, or X.Y.Z.W)
  const match = v.match(/\d+(?:\.\d+){1,3}/);
  return match ? match[0] : null;
};
