import { useState, useMemo } from "react";
import { type ImageModelId, getModelLabel } from "@/lib/modelPricing";
import { type HistoryEntry, type GenerationResult, type TokenEstimate, generateCSVContent } from "@/lib/costTracking";
import { getImageDimensions, getImageDimensionsFromDataURL } from "@/lib/imageUtils";

/**
 * WHY: History tracking mixes standard state management with complex
 * DOM side-effects (Clipboard, Blob generation). Extracting this logic
 * prevents the main UI component from becoming bloated with imperative code.
 */
export const useGenerationHistory = () => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [copySuccess, setCopySuccess] = useState(false);

  const sessionTotal = useMemo(() => {
    return history.reduce((sum, entry) => sum + entry.costReal, 0);
  }, [history]);

  const addHistoryEntry = async (
    data: GenerationResult,
    tokenEstimate: TokenEstimate | null,
    prompt: string,
    images: File[],
    modelId: ImageModelId
  ) => {
    if (data.costs && tokenEstimate) {
      let inputImagesDimensions: { width: number; height: number }[] | null = null;
      let outputImagesDimensions: { width: number; height: number }[] | null = null;

      if (images.length > 0) {
        try {
          const dimensionsPromises = images.map((image) => getImageDimensions(image));
          inputImagesDimensions = await Promise.all(dimensionsPromises);
        } catch (error) {
          console.error("Error getting image dimensions for history:", error);
          inputImagesDimensions = null;
        }
      }

      if (Array.isArray(data.images) && data.images.length > 0) {
        try {
          const outputDimensionsPromises = data.images.map((imageDataUrl: string) =>
            getImageDimensionsFromDataURL(imageDataUrl)
          );
          const dims = await Promise.all(outputDimensionsPromises);
          outputImagesDimensions = dims.filter((d) => d.width > 0 && d.height > 0);
          if (outputImagesDimensions.length === 0) {
            outputImagesDimensions = null;
          }
        } catch (error) {
          console.error("Error getting output image dimensions for history:", error);
          outputImagesDimensions = null;
        }
      }

      const historyEntry: HistoryEntry = {
        date: new Date().toISOString(),
        prompt: prompt,
        costReal: data.costs.total,
        costEstimated: tokenEstimate.costs.total || 0,
        modelId,
        modelLabel: getModelLabel(modelId),
        tokens: {
          input: data.tokens.input,
          output: data.tokens.output,
          total: data.tokens.total,
        },
        inputImages: inputImagesDimensions,
        outputImages: outputImagesDimensions,
        outputText: data.text || null,
      };
      
      setHistory((prev) => [historyEntry, ...prev]);
    }
  };

  const exportToCSV = () => {
    if (history.length === 0) return;

    const csvContent = generateCSVContent(history);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `usage_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = async () => {
    if (history.length === 0) return;

    const csvContent = generateCSVContent(history);

    try {
      await navigator.clipboard.writeText(csvContent);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  return {
    history,
    sessionTotal,
    copySuccess,
    addHistoryEntry,
    exportToCSV,
    copyToClipboard
  };
};
