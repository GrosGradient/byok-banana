/**
 * Model IDs and pricing for Gemini image generation.
 * Rates from Google Gemini API pricing (per million tokens / per image).
 */

export const IMAGE_MODEL_IDS = [
  "gemini-2.5-flash-image",
  "gemini-3-pro-image-preview",
  "gemini-3.1-flash-image-preview",
  "imagen-4.0-ultra-generate-001",
] as const;

export type ImageModelId = (typeof IMAGE_MODEL_IDS)[number];

export const DEFAULT_MODEL_ID: ImageModelId = "gemini-2.5-flash-image";

export interface ModelOption {
  id: ImageModelId;
  label: string;
}

export const MODEL_OPTIONS: ModelOption[] = [
  { id: "gemini-2.5-flash-image", label: "Gemini 2.5 Flash" },
  { id: "gemini-3-pro-image-preview", label: "Gemini 3 Pro Image" },
  {
    id: "gemini-3.1-flash-image-preview",
    label: "Gemini 3.1 Flash Image",
  },
  {
    id: "imagen-4.0-ultra-generate-001",
    label: "Imagen 4 Ultra",
  },
];

export interface ModelPricing {
  inputPerMillion: number;
  /** Output cost per image (1K). Gemini 3 Pro is forced to 1K only. */
  outputPerImage: number;
}

const PRICING: Record<ImageModelId, ModelPricing> = {
  "gemini-2.5-flash-image": {
    inputPerMillion: 0.3,
    outputPerImage: 0.039,
  },
  "gemini-3-pro-image-preview": {
    inputPerMillion: 2.0,
    outputPerImage: 0.134,
  },
  "gemini-3.1-flash-image-preview": {
    inputPerMillion: 0.5,
    outputPerImage: 0.067,
  },
  "imagen-4.0-ultra-generate-001": {
    // Imagen pricing is per generated image; prompt tokens are not billed here.
    inputPerMillion: 0,
    outputPerImage: 0.06,
  },
};

export function getPricingForModel(modelId: ImageModelId): ModelPricing {
  const pricing = PRICING[modelId];
  if (!pricing) {
    return PRICING[DEFAULT_MODEL_ID];
  }
  return pricing;
}

export function getModelLabel(modelId: ImageModelId): string {
  return MODEL_OPTIONS.find((o) => o.id === modelId)?.label ?? modelId;
}
