import { useState, useEffect } from "react";

import { isSelfHosted } from "@/lib/runtimeConfig";

const DEPRECATION_NOTICE_KEY = "sounddocs-deprecation-notice-dismissed";

export const useDeprecationNotice = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isSelfHosted()) {
      setIsOpen(false);
      return;
    }
    const dismissed = localStorage.getItem(DEPRECATION_NOTICE_KEY) === "true";
    if (!dismissed) {
      setIsOpen(true);
    }
  }, []);

  const onClose = () => {
    localStorage.setItem(DEPRECATION_NOTICE_KEY, "true");
    setIsOpen(false);
  };

  return { isOpen, onClose };
};
