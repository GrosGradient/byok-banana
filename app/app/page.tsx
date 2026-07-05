"use client";

import { useState } from "react";
import ImageLightbox from "@/components/ImageLightbox";
// Import networkAudit first so fetch is patched before the Gemini SDK loads
import { startSession, stopSession } from "@/lib/networkAudit";
import ImageUpload from "@/components/ImageUpload";
import { generateImage } from "@/lib/geminiClient";
import { MODEL_OPTIONS, DEFAULT_MODEL_ID, type ImageModelId } from "@/lib/modelPricing";
import NetworkAuditPanel from "@/components/NetworkAuditPanel";
import Footer from "@/app/landing/Footer";

// Extracted Business Logic & State
import { useCostTracking } from "@/hooks/useCostTracking";
import { useGenerationHistory } from "@/hooks/useGenerationHistory";
import { 
  type GenerationResult,
  calculateInputCost,
  formatCurrency, 
  formatCurrencyRounded, 
  formatNumber, 
  formatDate, 
  formatInputImages, 
  formatOutputImages 
} from "@/lib/costTracking";

/**
 * WHY: This file is now exclusively focused on UI composition.
 * All complex state (history, token tracking) and pure calculations
 * (cost, formatting, dimensions) have been extracted to /hooks and /lib
 * to ensure readability and maintainability.
 */
export default function Home() {
  // 1. Core Form State
  const [apiKey, setApiKey] = useState("");
  const [modelId, setModelId] = useState<ImageModelId>(DEFAULT_MODEL_ID);
  const [prompt, setPrompt] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 2. Extracted Hooks
  const {
    tokenEstimate,
    textTokens,
    imageTokens,
    animateTextTokens,
    animateImageTokens,
  } = useCostTracking(prompt, images, modelId);

  const {
    history,
    sessionTotal,
    copySuccess,
    addHistoryEntry,
    exportToCSV,
    copyToClipboard,
  } = useGenerationHistory();

  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const openLightbox = (images: string[], index: number) => {
    setLightboxImages(images);
    setLightboxIndex(index);
  };

  const closeLightbox = () => setLightboxIndex(null);

  // 3. Handlers
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt");
      return;
    }

    if (!apiKey.trim()) {
      setError("Please enter your API key");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    startSession();

    try {
      const data = await generateImage(apiKey, prompt, images, modelId);
      setResult(data);
      
      // Async history update logic decoupled from UI render
      await addHistoryEntry(data, tokenEstimate, prompt, images, modelId);
    } catch (err: any) {
      let errorMsg = err.message || (typeof err === "string" ? err : "An error occurred");
      const lower = errorMsg.toLowerCase();
      if (
        lower.includes("api key") ||
        (lower.includes("invalid") && (lower.includes("key") || lower.includes("credential"))) ||
        lower.includes("401") ||
        lower.includes("403") ||
        lower.includes("unauthorized") ||
        lower.includes("permission denied")
      ) {
        errorMsg = "Invalid API key. Please check your key at Google AI Studio and try again.";
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
      stopSession();
    }
  };

  // 4. Render
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top accent bar */}
      <div className="h-1 w-full bg-navy" />

      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="">
            <a href="/" className="text-sm font-semibold text-navy-mid hover:text-navy uppercase tracking-widest transition-colors flex flex-col">
              BYOK-Banana
              <span className="text-[10px] text-gray-400 font-medium mt-0.5 tracking-wide">
                Bring Your Own Key: "Banana"
              </span>
            </a>
          </div>
          <div className="flex items-center gap-6 text-xs text-gray-400 font-medium uppercase tracking-wider">
            <span>No account</span>
            <span>No storage</span>
          </div>
        </div>
      </header>

      <main className="w-full max-w-3xl mx-auto px-6 py-8 flex-grow">
        {/* Network Audit Panel */}
        <NetworkAuditPanel />

        {/* Generation form */}
        <div className={`bg-white border border-gray-200 p-6 sm:p-8 relative transition-opacity duration-300 ${loading ? "opacity-40 pointer-events-none" : ""}`}>
          {loading && (
            <div className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-auto bg-white/60">
              <div className="flex items-center gap-3 border border-gray-200 bg-white px-5 py-3 shadow-sm">
                <svg className="animate-spin h-4 w-4 text-navy" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Generating...</span>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* API Key */}
            <div>
              <label htmlFor="apiKey" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                Google Gemini API Key
              </label>
              <a
                href="https://aistudio.google.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-3 transition-colors ${loading ? "text-gray-300 cursor-not-allowed" : "text-navy-mid hover:text-navy"}`}
                onClick={(e) => { if (loading) e.preventDefault(); }}
              >
                Get an API key
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              <input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIza..."
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 text-sm font-mono bg-white text-gray-900 focus:outline-none focus:border-navy transition-colors disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
              />
            </div>

            {/* Model selector */}
            <div>
              <label htmlFor="model" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                Model
              </label>
              <select
                id="model"
                value={modelId}
                onChange={(e) => setModelId(e.target.value as ImageModelId)}
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 text-sm bg-white text-gray-900 focus:outline-none focus:border-navy transition-colors disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed appearance-none"
              >
                {MODEL_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Text prompt */}
            <div>
              <div className="flex justify-between items-center mb-2 gap-2">
                <label htmlFor="prompt" className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                  Text prompt
                </label>
                <span className={`text-xs font-mono text-gray-500 px-2 py-0.5 border transition-all duration-300 ${animateTextTokens ? "border-navy bg-navy-light text-navy" : "border-gray-200 bg-gray-50"}`}>
                  {formatNumber(textTokens)} tokens &bull; {formatCurrency(calculateInputCost(textTokens, modelId))}
                </span>
              </div>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the image you want to generate..."
                rows={5}
                style={{ resize: "none" }}
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 text-sm font-sans bg-white text-gray-900 focus:outline-none focus:border-navy transition-colors disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
              />
            </div>

            {/* Input images */}
            <div>
              <div className="flex justify-between items-center mb-2 gap-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                  Input images (optional)
                </label>
                <span className={`text-xs font-mono text-gray-500 px-2 py-0.5 border transition-all duration-300 ${animateImageTokens ? "border-navy bg-navy-light text-navy" : "border-gray-200 bg-gray-50"}`}>
                  {formatNumber(imageTokens)} tokens &bull; {formatCurrency(calculateInputCost(imageTokens, modelId))}
                </span>
              </div>
              <ImageUpload onImagesChange={setImages} maxImages={10} disabled={loading} />
            </div>

            {/* Cost estimate */}
            {tokenEstimate && prompt.trim() && (
              <div className="border border-navy bg-navy-light px-5 py-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">
                    Estimated total cost
                  </span>
                  <span className="text-xl font-bold text-navy tracking-tight">
                    {formatCurrencyRounded(tokenEstimate.costs.total || tokenEstimate.costs.input)}
                  </span>
                </div>
              </div>
            )}

            {/* Generate button */}
            <button
              className="w-full px-8 py-4 bg-navy text-white text-sm font-bold uppercase tracking-widest hover:bg-navy-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Generating...
                </span>
              ) : (
                "Generate image"
              )}
            </button>
          </div>

          {error && (
            <div className="mt-6 p-4 bg-crimson-light border border-crimson/30 text-crimson">
              <div className="flex items-start gap-3">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm font-medium"><strong>Error:</strong> {error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Result block */}
        {result && (
          <div className="mt-6 bg-white border border-gray-200 p-6 sm:p-8">
            <div className="space-y-8">
              {/* Metrics */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Actual usage</p>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-green-700 bg-green-50 border border-green-200 px-2 py-0.5">Calculated by Google</span>
                </div>
                <div className="grid grid-cols-2 gap-px bg-gray-200 sm:grid-cols-3">
                  {[
                    { label: "Input tokens", value: formatNumber(result.tokens.input) },
                    { label: "Output tokens", value: formatNumber(result.tokens.output) },
                    { label: "Total tokens", value: formatNumber(result.tokens.total) },
                    { label: "Input cost", value: formatCurrency(result.costs.input) },
                    { label: "Output cost", value: formatCurrency(result.costs.output) },
                    { label: "Total cost", value: formatCurrency(result.costs.total), highlight: true },
                  ].map((item) => (
                    <div key={item.label} className={`p-4 text-center ${item.highlight ? "bg-navy-light" : "bg-white"}`}>
                      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">{item.label}</p>
                      <p className={`text-base font-bold tracking-tight ${item.highlight ? "text-navy" : "text-gray-900"}`}>
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Response */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Response</p>

                {result.text && result.text.trim() && (
                  <div className="mb-6 p-4 bg-gray-50 border border-gray-200">
                    <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{result.text}</p>
                  </div>
                )}

                {result.images.length > 0 && (
                  <div>
                    {result.text && result.text.trim() && (
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
                        Generated images ({result.images.length})
                      </p>
                    )}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {result.images.map((image, index) => (
                        <div key={index} className="flex flex-col gap-2 group">
                          {/* Click image to open lightbox */}
                          <div
                            className="relative cursor-zoom-in overflow-hidden border border-gray-200"
                            onClick={() => openLightbox(result.images, index)}
                          >
                            <img
                              src={image}
                              alt={`Generated image ${index + 1}`}
                              className="w-full h-auto"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                              <svg
                                className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                              </svg>
                            </div>
                          </div>
                          <a
                            href={image}
                            download={`generated-image-${index + 1}.png`}
                            className="px-4 py-2 bg-navy text-white text-center text-xs font-bold uppercase tracking-wider hover:bg-navy-hover transition-colors no-underline"
                          >
                            Download
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(!result.text || !result.text.trim()) && result.images.length === 0 && (
                  <div className="bg-amber-50 border border-amber-200 p-4">
                    <p className="text-sm text-amber-900 font-medium mb-2">No response generated. Check if:</p>
                    <ul className="text-xs text-amber-800 space-y-1 list-disc list-inside">
                      <li>Your prompt complies with Google's usage policies</li>
                      <li>If you provided images, ensure no recognizable faces are present</li>
                      <li>The content does not violate intellectual property or privacy rights</li>
                      <li>No harmful, illegal, or misleading content is included</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Cost history */}
        {history.length > 0 && (
          <div className="mt-6 bg-white border border-gray-200 p-6 sm:p-8">
            <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:justify-between sm:items-center">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Cost history</p>
              <div className="flex gap-2">
                <button
                  onClick={exportToCSV}
                  className="px-3 py-1.5 border border-gray-300 text-xs font-semibold uppercase tracking-wide text-gray-700 hover:border-navy hover:text-navy transition-colors"
                  title="Download CSV"
                >
                  Export CSV
                </button>
                <button
                  onClick={copyToClipboard}
                  className="px-3 py-1.5 border border-gray-300 text-xs font-semibold uppercase tracking-wide text-gray-700 hover:border-navy hover:text-navy transition-colors"
                  title="Copy to clipboard"
                >
                  {copySuccess ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            {/* Session total */}
            <div className="mb-6 border border-navy bg-navy-light px-5 py-4 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">Session total</span>
              <span className="text-xl font-bold text-navy tracking-tight">{formatCurrency(sessionTotal)}</span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-300 bg-gray-50">
                    {["Date", "Cost", "Model", "Prompt", "Input images", "Output images", "Output text"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map((entry, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{formatDate(entry.date)}</td>
                      <td className="px-3 py-2 font-semibold text-navy whitespace-nowrap">{formatCurrency(entry.costReal)}</td>
                      <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{entry.modelLabel ?? entry.modelId ?? "-"}</td>
                      <td className="px-3 py-2 text-gray-600 max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">
                        {entry.prompt.substring(0, 40)}{entry.prompt.length > 40 ? "..." : ""}
                      </td>
                      <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{formatInputImages(entry.inputImages) || "-"}</td>
                      <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{formatOutputImages(entry.outputImages) || "-"}</td>
                      <td className="px-3 py-2 text-gray-600 max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">
                        {entry.outputText
                          ? entry.outputText.length > 40
                            ? entry.outputText.substring(0, 40) + "..."
                            : entry.outputText
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400 mt-3">History is stored in memory only. It is lost on page reload. Export to save it.</p>
          </div>
        )}
      </main>
      <Footer />

      {/* Global lightbox — rendered outside the main flow to avoid stacking context issues */}
      {lightboxIndex !== null && (
        <ImageLightbox
          images={lightboxImages}
          currentIndex={lightboxIndex}
          onClose={closeLightbox}
          onNavigate={setLightboxIndex}
        />
      )}
    </div>
  );
}
