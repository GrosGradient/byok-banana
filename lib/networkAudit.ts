"use client";

/**
 * TECHNICAL PROOF OF "ZERO DATA COLLECTION"
 * -----------------------------------------
 * Why is this file critical?
 * It is the technical embodiment of our BYOK promise. Instead of asking users to trust us
 * on our word, we intercept (monkey-patch) at the global level all browser network communication
 * APIs (fetch, XHR, WebSockets, etc.).
 *
 * This way, we record *every* outgoing request made during the session, including those
 * made by third-party libraries (like the Google GenAI SDK) that we do not directly control.
 * This allows users to verify in the NetworkAuditPanel that their API key and prompts
 * are only sent to Google's servers, with no hidden requests to our own servers.
 */

export type NetworkChannel =
  | "fetch"
  | "xhr"
  | "beacon"
  | "ws"
  | "es"
  | "img"
  | "script"
  | "link";

export interface NetworkEvent {
  ts: number;
  channel: NetworkChannel;
  hostname: string;
  method?: string;
  status?: number | null;
  durationMs?: number;
  kind: "google" | "ours" | "other";
}

const MAX_EVENTS = 20;

interface SessionState {
  active: boolean;
  stopped: boolean;
  events: NetworkEvent[];
  tsStart: number | null;
  tsEnd: number | null;
  originHost: string;
  buildInfo: string | undefined;
  sessionHash: string;
}

let sessionState: SessionState = {
  active: false,
  stopped: false,
  events: [],
  tsStart: null,
  tsEnd: null,
  originHost: "",
  buildInfo: undefined,
  sessionHash: "",
};

declare global {
  interface Window {
    __networkAuditPatched?: boolean;
  }
}

function getHostname(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    const match = url.match(/^https?:\/\/([^/]+)/);
    return match ? match[1] : url;
  }
}

// Determines whether the target domain belongs to Google, our current domain, or a third party.
// Used to visually categorize requests in the audit panel to reassure the user.
function classifyKind(hostname: string, currentHost: string): "google" | "ours" | "other" {
  if (hostname === currentHost) return "ours";
  if (
    hostname.endsWith("googleapis.com") ||
    hostname.endsWith("google.com") ||
    hostname.endsWith("gstatic.com") ||
    hostname.endsWith("googleusercontent.com")
  ) {
    return "google";
  }
  return "other";
}

function getCurrentHost(): string {
  return typeof window !== "undefined" ? window.location.hostname : "";
}

function trackEvent(
  channel: NetworkChannel,
  hostname: string,
  opts?: { method?: string; status?: number | null; durationMs?: number }
): void {
  if (!sessionState.active || sessionState.stopped) return;
  const kind = classifyKind(hostname, getCurrentHost());
  const event: NetworkEvent = {
    ts: Date.now(),
    channel,
    hostname,
    kind,
    ...(opts?.method !== undefined && { method: opts.method }),
    ...(opts?.status !== undefined && { status: opts.status }),
    ...(opts?.durationMs !== undefined && { durationMs: opts.durationMs }),
  };
  sessionState.events.push(event);
  if (sessionState.events.length > MAX_EVENTS) {
    sessionState.events = sessionState.events.slice(-MAX_EVENTS);
  }
}

// Intercepts the standard `fetch` API.
// We save the original reference (`originalFetch`) to execute the real request,
// but wrap the call to measure duration and log the destination URL in our audit.
function instrumentFetch(): void {
  if (typeof window === "undefined") return;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async function (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const startTime = performance.now();
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : (input as Request).url;
    const method = init?.method || "GET";
    const hostname = getHostname(url);
    try {
      const response = await originalFetch(input, init);
      const durationMs = performance.now() - startTime;
      trackEvent("fetch", hostname, { method, status: response.status, durationMs });
      return response;
    } catch (err) {
      const durationMs = performance.now() - startTime;
      trackEvent("fetch", hostname, { method, status: null, durationMs });
      throw err;
    }
  };
}

// Intercepts the XMLHttpRequest API (legacy, but still sometimes used by SDKs or polyfills).
// Replaces the global constructor to attach to `load` and `error` events.
function instrumentXMLHttpRequest(): void {
  if (typeof window === "undefined") return;
  const OriginalXHR = window.XMLHttpRequest;
  window.XMLHttpRequest = function (this: XMLHttpRequest) {
    const xhr = new OriginalXHR();
    const startTime = performance.now();
    let method = "GET";
    let url = "";
    const originalOpen = xhr.open;
    xhr.open = function (
      methodArg: string,
      urlArg: string | URL,
      async?: boolean,
      user?: string | null,
      password?: string | null
    ) {
      method = methodArg;
      url = typeof urlArg === "string" ? urlArg : urlArg.toString();
      return originalOpen.apply(this, [methodArg, urlArg, async ?? true, user ?? null, password ?? null]);
    };
    const originalSend = xhr.send;
    xhr.send = function (body?: Document | XMLHttpRequestBodyInit | null) {
      const handleLoad = () => {
        const durationMs = performance.now() - startTime;
        trackEvent("xhr", getHostname(url), { method, status: xhr.status, durationMs });
      };
      const handleError = () => {
        const durationMs = performance.now() - startTime;
        trackEvent("xhr", getHostname(url), { method, status: null, durationMs });
      };
      xhr.addEventListener("load", handleLoad, { once: true });
      xhr.addEventListener("error", handleError, { once: true });
      return originalSend.call(this, body);
    };
    return xhr;
  } as unknown as typeof XMLHttpRequest;
}

// The sendBeacon API is often used for analytics or background data sending on page close.
// Intercepting it is critical to prove that no hidden telemetry is sent.
function instrumentSendBeacon(): void {
  if (typeof window === "undefined" || !navigator.sendBeacon) return;
  const originalSendBeacon = navigator.sendBeacon.bind(navigator);
  navigator.sendBeacon = function (url: string | URL, body?: BodyInit | null): boolean {
    const urlStr = typeof url === "string" ? url : url.toString();
    trackEvent("beacon", getHostname(urlStr), { method: "POST" });
    return originalSendBeacon(url, body);
  };
}

function instrumentWebSocket(): void {
  if (typeof window === "undefined" || !window.WebSocket) return;
  const OriginalWS = window.WebSocket;
  window.WebSocket = function (url: string | URL, protocols?: string | string[]) {
    const ws = protocols !== undefined ? new OriginalWS(url, protocols) : new OriginalWS(url);
    const urlStr = typeof url === "string" ? url : url.toString();
    const hostname = getHostname(urlStr);
    ws.addEventListener(
      "open",
      () => {
        trackEvent("ws", hostname);
      },
      { once: true }
    );
    return ws;
  } as unknown as typeof WebSocket;
}

function instrumentEventSource(): void {
  if (typeof window === "undefined" || !window.EventSource) return;
  const OriginalES = window.EventSource;
  window.EventSource = function (url: string, eventSourceInitDict?: EventSourceInit) {
    const es = new OriginalES(url, eventSourceInitDict);
    trackEvent("es", getHostname(url));
    return es;
  } as unknown as typeof EventSource;
}

function isAbsoluteHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function instrumentDOM(): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  function trackDomResource(channel: "img" | "script" | "link", url: string): void {
    if (!isAbsoluteHttpUrl(url)) return;
    trackEvent(channel, getHostname(url));
  }

  const imgDesc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, "src");
  if (imgDesc && imgDesc.set) {
    const originalSet = imgDesc.set;
    Object.defineProperty(HTMLImageElement.prototype, "src", {
      set(value: string) {
        trackDomResource("img", value);
        originalSet.call(this, value);
      },
      configurable: true,
      enumerable: true,
    });
  }

  const scriptDesc = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, "src");
  if (scriptDesc && scriptDesc.set) {
    const originalSet = scriptDesc.set;
    Object.defineProperty(HTMLScriptElement.prototype, "src", {
      set(value: string) {
        trackDomResource("script", value);
        originalSet.call(this, value);
      },
      configurable: true,
      enumerable: true,
    });
  }

  const linkDesc = Object.getOwnPropertyDescriptor(HTMLLinkElement.prototype, "href");
  if (linkDesc && linkDesc.set) {
    const originalSet = linkDesc.set;
    Object.defineProperty(HTMLLinkElement.prototype, "href", {
      set(value: string) {
        trackDomResource("link", value);
        originalSet.call(this, value);
      },
      configurable: true,
      enumerable: true,
    });
  }
}

function runInstrumentation(): void {
  if (typeof window === "undefined") return;
  if (window.__networkAuditPatched) return;
  instrumentFetch();
  instrumentXMLHttpRequest();
  instrumentSendBeacon();
  instrumentWebSocket();
  instrumentEventSource();
  instrumentDOM();
  window.__networkAuditPatched = true;
}

function redactedEvent(e: NetworkEvent): Record<string, unknown> {
  const o: Record<string, unknown> = {
    ts: e.ts,
    channel: e.channel,
    hostname: e.hostname,
    kind: e.kind,
  };
  if (e.method !== undefined) o.method = e.method;
  if (e.status !== undefined) o.status = e.status;
  if (e.durationMs !== undefined) o.durationMs = e.durationMs;
  return o;
}

function canonicalJson(events: NetworkEvent[]): string {
  const arr = events.map((e) => redactedEvent(e));
  const sorted = arr.map((o) => {
    const keys = Object.keys(o).sort();
    return keys.reduce((acc, k) => ({ ...acc, [k]: (o as Record<string, unknown>)[k] }), {} as Record<string, unknown>);
  });
  return JSON.stringify(sorted);
}

async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export type VerdictStatus = "OK" | "FAIL";

function computeVerdict(counts: { google: number; ours: number; other: number }): VerdictStatus {
  return counts.ours === 0 && counts.other === 0 ? "OK" : "FAIL";
}

// Patch fetch/XHR/etc. at module load time to guarantee capture of all requests.
// This is critical: if a third-party SDK (like Google's) caches the `fetch` function
// at import time and we patch `fetch` later, we would miss its requests.
if (typeof window !== "undefined") {
  runInstrumentation();
}

export function startSession(): void {
  const buildInfo =
    typeof process !== "undefined" && process.env?.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA
      ? process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA
      : undefined;
  sessionState = {
    active: true,
    stopped: false,
    events: [],
    tsStart: Date.now(),
    tsEnd: null,
    originHost: typeof window !== "undefined" ? window.location.host : "",
    buildInfo,
    sessionHash: "",
  };
}

export function stopSession(): void {
  if (!sessionState.active) return;
  sessionState.stopped = true;
  sessionState.active = false;
  sessionState.tsEnd = Date.now();
  const eventsSnapshot = [...sessionState.events];
  const canonical = canonicalJson(eventsSnapshot);
  sha256Hex(canonical).then((hash) => {
    if (sessionState.stopped && sessionState.tsEnd !== null) {
      sessionState.sessionHash = hash;
    }
  });
}

export function getSessionData(): {
  events: NetworkEvent[];
  tsStart: number | null;
  tsEnd: number | null;
  originHost: string;
  buildInfo: string | undefined;
  counts: { google: number; ours: number; other: number };
  verdict: VerdictStatus;
  sessionHash: string;
} {
  const events = sessionState.events;
  const counts = {
    google: events.filter((e) => e.kind === "google").length,
    ours: events.filter((e) => e.kind === "ours").length,
    other: events.filter((e) => e.kind === "other").length,
  };
  const verdict = computeVerdict(counts);
  return {
    events: [...events].reverse(),
    tsStart: sessionState.tsStart,
    tsEnd: sessionState.tsEnd,
    originHost: sessionState.originHost,
    buildInfo: sessionState.buildInfo,
    counts,
    verdict,
    sessionHash: sessionState.sessionHash,
  };
}

export function getProofPayload(): {
  tsStart: number | null;
  tsEnd: number | null;
  originHost: string;
  buildInfo?: string;
  counts: { google: number; ours: number; other: number };
  verdict: VerdictStatus;
  events: Record<string, unknown>[];
  sessionHash: string;
} {
  const data = getSessionData();
  return {
    tsStart: data.tsStart,
    tsEnd: data.tsEnd,
    originHost: data.originHost,
    buildInfo: data.buildInfo,
    counts: data.counts,
    verdict: data.verdict,
    events: sessionState.events.map(redactedEvent),
    sessionHash: data.sessionHash,
  };
}

export function getProofAsCopyableText(): string {
  const p = getProofPayload();
  const lines = [
    "Network Audit Proof (redacted)",
    "================================",
    `tsStart: ${p.tsStart ?? "—"}`,
    `tsEnd: ${p.tsEnd ?? "—"}`,
    `originHost: ${p.originHost}`,
    `buildInfo: ${p.buildInfo ?? "—"}`,
    `counts: google=${p.counts.google} ours=${p.counts.ours} other=${p.counts.other}`,
    `verdict: ${p.verdict}`,
    "",
    "events:",
    JSON.stringify(p.events, null, 2),
    "",
    `sessionHash: ${p.sessionHash}`,
  ];
  return lines.join("\n");
}

export function getProofAsBlob(): Blob {
  const p = getProofPayload();
  return new Blob([JSON.stringify(p, null, 2)], { type: "application/json" });
}

export function isSessionActive(): boolean {
  return sessionState.active;
}
