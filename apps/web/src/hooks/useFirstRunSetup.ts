import { useState, useEffect } from "react";

import { isSelfHosted } from "@/lib/runtimeConfig";

/**
 * localStorage flag set once the first-run setup wizard has been completed OR
 * explicitly skipped ("start fresh"). Either path calls dismiss().
 */
const SETUP_COMPLETE_KEY = "sounddocs-selfhost-setup-complete";

/**
 * Controls visibility of the first-run setup wizard (FirstRunWizard).
 *
 * The wizard ONLY appears on self-hosted instances:
 *   - `isSelfHosted()` returns true (resolved from window.__SOUNDDOCS_CONFIG__
 *     at runtime on Docker, or from the baked-in VITE_SELF_HOSTED build arg on
 *     locally-built images; absent/false on the hosted SaaS build), AND
 *   - the wizard has not previously been completed/skipped on this device
 *     (localStorage `sounddocs-selfhost-setup-complete` !== "true").
 *
 * `dismiss()` persists completion and hides the wizard. Both "import finished"
 * and "skip / start fresh" call it.
 */
export const useFirstRunSetup = (): { show: boolean; dismiss: () => void } => {
  const selfHosted = isSelfHosted();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!selfHosted) {
      setShow(false);
      return;
    }
    const completed = localStorage.getItem(SETUP_COMPLETE_KEY) === "true";
    setShow(!completed);
  }, [selfHosted]);

  const dismiss = (): void => {
    localStorage.setItem(SETUP_COMPLETE_KEY, "true");
    setShow(false);
  };

  return { show, dismiss };
};
