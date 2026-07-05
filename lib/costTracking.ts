/**
 * WHY: Centralizing formatting and calculations outside of React components
 * makes them purely functional, easily testable, and declutters the UI code.
 */
import { type ImageModelId, getPricingForModel } from "./modelPricing";

export interface GenerationResult {
  images: string[];
  text: string;
  tokens: {
    input: number;
    output: number;
    total: number;
  };
  costs: {
    input: number;
    output: number;
    total: number;
  };
}

export interface TokenEstimate {
  tokens: {
    input: number;
  };
  costs: {
    input: number;
    output?: number;
    total?: number;
  };
}

export interface HistoryEntry {
  date: string;
  prompt: string;
  costReal: number;
  costEstimated: number;
  modelId: ImageModelId;
  modelLabel: string;
  tokens: {
    input: number;
    output: number;
    total: number;
  };
  inputImages: { width: number; height: number }[] | null;
  outputImages: { width: number; height: number }[] | null;
  outputText: string | null;
}

export const calculateInputCost = (
  inputTokens: number,
  currentModelId: ImageModelId
): number => {
  const pricing = getPricingForModel(currentModelId);
  return (inputTokens / 1_000_000) * pricing.inputPerMillion;
};

// Estimate output cost based on number of images (model-specific per-image rate)
export const estimateOutputCost = (
  promptText: string,
  currentModelId: ImageModelId
): number => {
  const pricing = getPricingForModel(currentModelId);
  const lowerPrompt = promptText.toLowerCase();

  const numberMatch = lowerPrompt.match(
    /(\d+)\s*(?:image|images|photo|photos|picture|pictures)/
  );
  if (numberMatch) {
    const numImages = parseInt(numberMatch[1], 10);
    return Math.max(1, Math.min(numImages, 10)) * pricing.outputPerImage;
  }

  if (
    lowerPrompt.match(
      /(multiple|several|many|few|some)\s*(?:image|images|photo|photos|picture|pictures)/
    )
  ) {
    return 3 * pricing.outputPerImage;
  }

  return 1 * pricing.outputPerImage;
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 4,
  })
    .format(amount)
    .replace("$US", "$");
};

export const formatCurrencyRounded = (amount: number) => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(amount)
    .replace("$US", "$");
};

export const formatNumber = (num: number) => {
  return new Intl.NumberFormat("fr-FR").format(num);
};

export const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fr-FR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(date);
  } catch {
    return dateString;
  }
};

// Format input images dimensions for CSV
export const formatInputImages = (
  inputImages: { width: number; height: number }[] | null
): string => {
  if (!inputImages || inputImages.length === 0) {
    return "";
  }
  return inputImages.map((img) => `${img.width}x${img.height}`).join(", ");
};

// Format output images dimensions for CSV
export const formatOutputImages = (
  outputImages: { width: number; height: number }[] | null
): string => {
  if (!outputImages || outputImages.length === 0) {
    return "";
  }
  return outputImages.map((img) => `${img.width}x${img.height}`).join(", ");
};

export const generateCSVContent = (history: HistoryEntry[]): string => {
  const header =
    "date,cost,model,input_prompt,input_images,output_images,output_text\n";

  const rows = history.map((entry) => {
    const escapedPrompt = entry.prompt.replace(/"/g, '""');
    const escapedModel = (entry.modelLabel ?? entry.modelId ?? "").replace(
      /"/g,
      '""'
    );
    const inputImagesStr = formatInputImages(entry.inputImages);
    const escapedInputImages = inputImagesStr.replace(/"/g, '""');
    const outputImagesStr = formatOutputImages(entry.outputImages);
    const escapedOutputImages = outputImagesStr.replace(/"/g, '""');
    const outputTextStr = entry.outputText || "";
    const escapedOutputText = outputTextStr.replace(/"/g, '""');
    return `${entry.date},${entry.costReal},"${escapedModel}","${escapedPrompt}","${escapedInputImages}","${escapedOutputImages}","${escapedOutputText}"`;
  });

  return header + rows.join("\n");
};
