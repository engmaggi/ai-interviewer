"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import Script from "next/script";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    },
  ) => string;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

/**
 * Tokens are single-use, so a form needs a fresh widget after every submit.
 * `reset()` changes `widgetKey`; pass it as the widget's `key` to remount it.
 */
export function useCaptcha() {
  const [token, setToken] = useState<string | null>(null);
  const [widgetKey, setWidgetKey] = useState(0);

  function reset() {
    setToken(null);
    setWidgetKey((key) => key + 1);
  }

  return { token, setToken, widgetKey, reset };
}

/** Cloudflare Turnstile widget. The backend requires its token as `captchaToken`. */
export function Turnstile({
  onTokenChange,
}: {
  onTokenChange: (token: string | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScriptReady, setIsScriptReady] = useState(false);

  const handleTokenChange = useEffectEvent(onTokenChange);

  useEffect(() => {
    const container = containerRef.current;
    if (!isScriptReady || !container || !window.turnstile || !SITE_KEY) return;

    const widgetId = window.turnstile.render(container, {
      sitekey: SITE_KEY,
      callback: (token) => handleTokenChange(token),
      "expired-callback": () => handleTokenChange(null),
      "error-callback": () => handleTokenChange(null),
    });

    return () => window.turnstile?.remove(widgetId);
  }, [isScriptReady]);

  if (!SITE_KEY) {
    return (
      <p role="alert" className="text-[11px] text-destructive">
        Security check isn&apos;t configured. Set
        NEXT_PUBLIC_TURNSTILE_SITE_KEY.
      </p>
    );
  }

  return (
    <>
      <Script src={SCRIPT_SRC} onReady={() => setIsScriptReady(true)} />
      <div ref={containerRef} className="min-h-[65px]" />
    </>
  );
}
