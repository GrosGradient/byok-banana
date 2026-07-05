"use client";

/**
 * TRUST COMPONENT (PRODUCT PROOF)
 * --------------------------------
 * This component is the visual counterpart of the `networkAudit.ts` script.
 * It has no functional role in image generation: its sole purpose is to reassure
 * users and prove that the app keeps its BYOK promise.
 * It displays in real time the intercepted network requests to demonstrate that
 * the API key is never exfiltrated to our own servers.
 */

import { useState, useEffect } from "react";
import {
  getSessionData,
  isSessionActive,
  getProofAsCopyableText,
  getProofAsBlob,
  NetworkEvent,
} from "@/lib/networkAudit";

const VERIFICATION_STEPS = (originHost: string) =>
  `Network Verification (Browser DevTools)

1. Open DevTools (F12 or right click → Inspect)
2. Go to the Network tab
3. Enable 'Preserve log'
4. Filter by Fetch / XHR (optionally include WS for WebSockets)
5. Click Generate in the application

Inspect dynamic API requests:
- Expected requests only to generativelanguage.googleapis.com

Ignore local static requests:
- Requests to ${originHost}/_next/static/* are only related to frontend resources (Next.js bundles, hot reload, static files)

- No sensitive API calls (image generation, prompts, BYOK keys, payloads) should ever be sent to ${originHost}`;

export default function NetworkAuditPanel() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [sessionData, setSessionData] = useState(() => getSessionData());
  const [whySafeOpen, setWhySafeOpen] = useState(true);
  const [devToolsOpen, setDevToolsOpen] = useState(false);
  const [limitsOpen, setLimitsOpen] = useState(false);
  const [copyProofFeedback, setCopyProofFeedback] = useState(false);
  const [copyStepsFeedback, setCopyStepsFeedback] = useState(false);

  // Synchronization between the global Network Audit state (which lives outside React) and this component.
  // We use simple polling (setInterval) because the network audit patches global browser functions
  // and has no native React event system.
  // Updating the UI every 100ms gives a fluid real-time feel.
  // WHY we compare before setState: setting state on every tick (even if unchanged) forces
  // a re-render every 100ms, which can swallow click events mid-frame. We only update when
  // the data actually changes, keeping the UI responsive.
  useEffect(() => {
    let lastJson = "";
    const interval = setInterval(() => {
      const next = getSessionData();
      const nextJson = JSON.stringify(next.counts) + next.verdict + next.events.length + next.sessionHash;
      if (nextJson !== lastJson) {
        lastJson = nextJson;
        setSessionData(next);
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, []);

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatStatus = (status: number | null | undefined): string => {
    if (status === null || status === undefined) return "—";
    return status.toString();
  };

  const getStatusColor = (status: number | null | undefined): string => {
    if (status === null || status === undefined) return "text-gray-500";
    if (status >= 200 && status < 300) return "text-green-600";
    if (status >= 400 && status < 500) return "text-orange-600";
    if (status >= 500) return "text-red-600";
    return "text-gray-600";
  };

  const tsRelative = (ts: number): number => {
    if (sessionData.tsStart == null) return 0;
    return ts - sessionData.tsStart;
  };

  const handleCopyProof = async () => {
    try {
      const text = getProofAsCopyableText();
      await navigator.clipboard.writeText(text);
      setCopyProofFeedback(true);
      setTimeout(() => setCopyProofFeedback(false), 2000);
    } catch (err) {
      console.error("Failed to copy proof", err);
    }
  };

  const handleDownloadJson = () => {
    const blob = getProofAsBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `network-audit-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyVerificationSteps = async () => {
    const host =
      typeof window !== "undefined" ? window.location.host : "this site";
    try {
      await navigator.clipboard.writeText(VERIFICATION_STEPS(host));
      setCopyStepsFeedback(true);
      setTimeout(() => setCopyStepsFeedback(false), 2000);
    } catch (err) {
      console.error("Failed to copy verification steps", err);
    }
  };

  const originHost =
    typeof window !== "undefined" ? window.location.host : "this site";

  return (
    <div className="mb-6 bg-white border border-gray-200 w-full">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <h2 className="text-xs font-bold text-gray-700 uppercase tracking-widest">Why is it secure?</h2>
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="px-3 py-1 text-xs font-semibold text-gray-600 border border-gray-300 hover:border-navy hover:text-navy transition-colors uppercase tracking-wider"
          aria-label={isCollapsed ? "Expand" : "Collapse"}
        >
          {isCollapsed ? "Show" : "Hide"}
        </button>
      </div>

      {!isCollapsed && (
        <div className="divide-y divide-gray-100">
          {/* Why this is safe */}
          <div>
            <button
              onClick={() => setWhySafeOpen(!whySafeOpen)}
              className="w-full px-5 py-3 text-left text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center justify-between uppercase tracking-wider transition-colors"
            >
              Network Audit
              <span className="text-gray-400 text-xs">{whySafeOpen ? "▲" : "▼"}</span>
            </button>
            {whySafeOpen && (
              <div className="px-5 pb-4 text-sm text-gray-600 space-y-2 bg-white">
                <p>Your API key never passes through our servers.</p>
                <p>During image generation, your browser communicates directly with Google Gemini.</p>
                <p>This panel displays, in real-time, where network requests actually go.</p>
                <p>But, you don't have to trust us. You can verify it yourself.</p>
              </div>
            )}
          </div>

          {/* Verify yourself */}
          <div>
            <button
              onClick={() => setDevToolsOpen(!devToolsOpen)}
              className="w-full px-5 py-3 text-left text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center justify-between uppercase tracking-wider transition-colors"
            >
              Verify yourself (DevTools)
              <span className="text-gray-400 text-xs">{devToolsOpen ? "▲" : "▼"}</span>
            </button>
            {devToolsOpen && (
              <div className="px-5 pb-4 space-y-3">
                <pre className="text-xs text-gray-700 font-mono whitespace-pre-wrap bg-gray-50 p-3 border border-gray-200">
                  {VERIFICATION_STEPS(originHost)}
                </pre>
                <button
                  onClick={handleCopyVerificationSteps}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-700 border border-gray-300 hover:border-navy hover:text-navy transition-colors uppercase tracking-wider"
                >
                  {copyStepsFeedback ? "Copied!" : "Copy verification steps"}
                </button>
              </div>
            )}
          </div>

          {/* Limits */}
          <div>
            <button
              onClick={() => setLimitsOpen(!limitsOpen)}
              className="w-full px-5 py-3 text-left text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center justify-between uppercase tracking-wider transition-colors"
            >
              Limitations
              <span className="text-gray-400 text-xs">{limitsOpen ? "▲" : "▼"}</span>
            </button>
            {limitsOpen && (
              <div className="px-5 pb-4 text-sm text-gray-600 space-y-2">
                <p>Browser extensions can interfere.</p>
                <p>Requests from iframes or cross-origin workers might not be captured.</p>
                <p>This audit shows what this page sends during generation.</p>
              </div>
            )}
          </div>

          {/* Counters and Verdict */}
          <div className="grid grid-cols-4 divide-x divide-gray-100">
            <div className="p-4 text-center">
              <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Google</div>
              <div className="text-xl font-bold text-navy">{sessionData.counts.google}</div>
            </div>
            <div className="p-4 text-center">
              <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Our servers</div>
              <div className="text-xl font-bold text-crimson">{sessionData.counts.ours}</div>
            </div>
            <div className="p-4 text-center">
              <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Others</div>
              <div className="text-xl font-bold text-gray-600">{sessionData.counts.other}</div>
            </div>
            <div className={`p-4 text-center ${
              sessionData.verdict === "OK" ? "bg-green-50" : "bg-crimson-light"
            }`}>
              <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Verdict</div>
              <div className={`text-xl font-bold ${
                sessionData.verdict === "OK" ? "text-green-700" : "text-crimson"
              }`}>
                {sessionData.verdict}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-5 py-3 flex gap-2">
            <button
              onClick={handleCopyProof}
              className="px-3 py-1.5 text-xs font-semibold text-gray-700 border border-gray-300 hover:border-navy hover:text-navy transition-colors uppercase tracking-wider"
            >
              {copyProofFeedback ? "Copied!" : "Copy proof"}
            </button>
            <button
              onClick={handleDownloadJson}
              className="px-3 py-1.5 text-xs font-semibold text-gray-700 border border-gray-300 hover:border-navy hover:text-navy transition-colors uppercase tracking-wider"
            >
              Download JSON
            </button>
          </div>

          {/* Events table */}
          {sessionData.events.length > 0 ? (
            <div>
              <div className="px-5 py-2 bg-gray-50 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {Math.min(20, sessionData.events.length)} latest events
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      {["Delta ms", "Channel", "Host", "Method", "Status", "Duration", "Type"].map(h => (
                        <th key={h} className="px-3 py-2 text-left font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sessionData.events.map((event: NetworkEvent, index: number) => (
                      <tr key={index} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-500 font-mono">+{tsRelative(event.ts)}</td>
                        <td className="px-3 py-2 text-gray-700">{event.channel}</td>
                        <td className="px-3 py-2 text-gray-900 font-mono">
                          {event.hostname.length > 30 ? event.hostname.substring(0, 30) + "..." : event.hostname}
                        </td>
                        <td className="px-3 py-2 text-gray-600">{event.method ?? "—"}</td>
                        <td className={`px-3 py-2 font-semibold ${getStatusColor(event.status)}`}>
                          {formatStatus(event.status)}
                        </td>
                        <td className="px-3 py-2 text-gray-600">
                          {event.durationMs != null ? formatDuration(event.durationMs) : "—"}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${
                            event.kind === "google"
                              ? "bg-navy-light text-navy"
                              : event.kind === "ours"
                              ? "bg-crimson-light text-crimson"
                              : "bg-gray-100 text-gray-600"
                          }`}>
                            {event.kind}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="px-5 py-6 text-center text-sm text-gray-400">
              No requests tracked. Run a generation to see network activity.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

