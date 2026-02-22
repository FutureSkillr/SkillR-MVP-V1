/**
 * Meta Pixel Service — FR-064
 * Loads Meta Pixel script only after cookie consent.
 * Zero Tracking by Default: does nothing if META_PIXEL_ID is not set.
 */

let pixelId: string | null = null;
let initialized = false;

// Extend window for fbq
declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

/**
 * Initialize Meta Pixel with the given ID.
 * Only call this after cookie consent has been granted.
 */
export function initMetaPixel(id: string): void {
  if (!id || initialized) return;
  pixelId = id;

  // Inject the Meta Pixel base code
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://connect.facebook.net/en_US/fbevents.js`;
  document.head.appendChild(script);

  // Initialize fbq
  if (!window.fbq) {
    const fbq = function (...args: unknown[]) {
      if ((fbq as unknown as { callMethod?: (...a: unknown[]) => void }).callMethod) {
        (fbq as unknown as { callMethod: (...a: unknown[]) => void }).callMethod(...args);
      } else {
        (fbq as unknown as { queue: unknown[] }).queue.push(args);
      }
    };
    (fbq as unknown as { push: typeof fbq }).push = fbq;
    (fbq as unknown as { loaded: boolean }).loaded = true;
    (fbq as unknown as { version: string }).version = '2.0';
    (fbq as unknown as { queue: unknown[] }).queue = [];
    window.fbq = fbq;
  }

  window.fbq('init', id);
  initialized = true;
}

/**
 * Track a standard Meta Pixel event.
 */
function trackEvent(eventName: string, data?: Record<string, unknown>): void {
  if (!initialized || !window.fbq) return;
  if (data) {
    window.fbq('track', eventName, data);
  } else {
    window.fbq('track', eventName);
  }
}

/** PageView — fires on WelcomePage mount */
export function trackPixelPageView(): void {
  trackEvent('PageView');
}

/** ViewContent — fires when a coach is selected */
export function trackPixelViewContent(coachId: string): void {
  trackEvent('ViewContent', {
    content_category: 'coach_selection',
    content_name: coachId,
  });
}

/** InitiateCheckout — fires when IntroChat starts */
export function trackPixelInitiateCheckout(coachId: string, waitTime: number): void {
  trackEvent('InitiateCheckout', {
    content_category: 'intro_chat',
    content_name: coachId,
    value: waitTime,
  });
}

/** CompleteRegistration — fires after successful registration */
export function trackPixelCompleteRegistration(interests?: string): void {
  trackEvent('CompleteRegistration', {
    content_name: interests || '',
  });
}

/**
 * Check if the pixel is initialized.
 */
export function isPixelInitialized(): boolean {
  return initialized;
}
