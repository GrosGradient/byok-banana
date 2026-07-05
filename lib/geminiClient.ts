"use client";

/**
 * CLIENT-SIDE GEMINI API INTEGRATION
 * ----------------------------------
 * Why is this file executed client-side ("use client")?
 * This is the core of the BYOK (Bring Your Own Key) product promise. By making API calls
 * directly from the user's browser to Google's servers, we mathematically guarantee
 * (and make it auditable) that the API key never transits through our own servers.
 */

import { GoogleGenAI } from '@google/genai';
import type { ImageModelId } from './modelPricing';
import { getPricingForModel } from './modelPricing';

// Distinguishes Imagen-family models from standard Gemini models.
// Why is this necessary? Imagen models use a dedicated API endpoint (generateImages)
// and have different constraints (e.g., text-to-image only).
function isImagenModel(modelId: ImageModelId): boolean {
  return modelId.startsWith('imagen-');
}

// Base configuration for generation with Gemini models.
// Image size is forced to '1K' because some recent models (e.g. Gemini 3.0 Pro)
// limit image output to this resolution. Not forcing it could cause errors.
function getGenerationConfig() {
  return {
    maxOutputTokens: 32768,
    temperature: 1,
    topP: 0.95,
    responseModalities: ['TEXT', 'IMAGE'],
    imageConfig: {
      aspectRatio: '1:1' as const,
      imageSize: '1K' as const,
      outputMimeType: 'image/png' as const,
    },
    // safetySettings are deliberately omitted here.
    // By default, the Gemini API applies its standard safety filters,
    // protecting users and avoiding any risk of API key suspension.
  };
}

function calculateCosts(
  inputTokens: number,
  outputImages: number,
  modelId: ImageModelId
): {
  inputCost: number;
  outputCost: number;
  totalCost: number;
} {
  const pricing = getPricingForModel(modelId);
  const inputCost = (inputTokens / 1_000_000) * pricing.inputPerMillion;
  const outputCost = outputImages * pricing.outputPerImage;
  const totalCost = inputCost + outputCost;

  return {
    inputCost,
    outputCost,
    totalCost,
  };
}

// Converts a File object to a Base64 string in the browser.
// The Gemini API expects images as "inline" data (inlineData) encoded in Base64,
// rather than a classic multipart/form-data upload.
async function fileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

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

export async function generateImage(
  apiKey: string,
  prompt: string,
  images: File[],
  modelId: ImageModelId = 'gemini-2.5-flash-image'
): Promise<GenerationResult> {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('API key is required');
  }

  if (!prompt || prompt.trim() === '') {
    throw new Error('Prompt is required');
  }

  // The client instance is recreated on every call with the provided key.
  // This ensures no key is accidentally persisted in a global singleton.
  const ai = new GoogleGenAI({
    apiKey: apiKey,
  });

  // Imagen models have a dedicated endpoint for image generation.
  if (isImagenModel(modelId)) {
    if (images.length > 0) {
      throw new Error(
        'This Imagen model currently supports text-to-image only in this app.'
      );
    }

    const response = await ai.models.generateImages({
      model: modelId,
      prompt: prompt,
      config: {
        numberOfImages: 1,
      },
    });

    const generatedImages = (response.generatedImages ?? [])
      .map((generatedImage: any) => generatedImage?.image?.imageBytes)
      .filter((imageBytes: string | undefined): imageBytes is string =>
        Boolean(imageBytes)
      )
      .map((imageBytes: string) => `data:image/png;base64,${imageBytes}`);

    const finalImages = generatedImages.length > 0 ? [generatedImages[0]] : [];
    const costs = calculateCosts(0, finalImages.length, modelId);

    return {
      images: finalImages,
      text: '',
      tokens: {
        input: 0,
        output: 0,
        total: 0,
      },
      costs: {
        input: costs.inputCost,
        output: costs.outputCost,
        total: costs.totalCost,
      },
    };
  }

  // Build the payload for standard multimodal models (e.g. Gemini Flash).
  // Google's required structure mixes text and images within the same 'contents' array.
  const contents: any[] = [];

  // Process images sequentially to inject them as Base64
  for (const imageFile of images) {
    if (imageFile && imageFile.size > 0) {
      const base64 = await fileToBase64(imageFile);
      const mimeType = imageFile.type || 'image/jpeg';

      contents.push({
        inlineData: {
          mimeType,
          data: base64,
        },
      });
    }
  }

  contents.push({ text: prompt });

  const generationConfig = getGenerationConfig();

  // The direct call to Google from the user's browser.
  const response = await ai.models.generateContent({
    model: modelId,
    contents: contents,
    config: generationConfig,
  });

  // Extract images and text from response
  const generatedImages: string[] = [];
  let responseText = '';

  if (response.candidates && response.candidates.length > 0) {
    const candidate = response.candidates[0];
    
    if (candidate.content && candidate.content.parts) {
      for (const part of candidate.content.parts) {
        if (part.text) {
          // Text response
          responseText += part.text;
        } else if (part.inlineData) {
          // Image data
          generatedImages.push(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
        }
      }
    }
  }

  // The API can theoretically return multiple images depending on the configuration.
  // For UI consistency and cost tracking, we artificially limit to the first result.
  const finalImages = generatedImages.length > 0 ? [generatedImages[0]] : [];

  // Use usageMetadata from response for accurate token counts
  const inputTokens = response.usageMetadata?.promptTokenCount || 0;
  const outputTokens = response.usageMetadata?.candidatesTokenCount || (finalImages.length * 1290);
  const totalTokens = response.usageMetadata?.totalTokenCount || (inputTokens + outputTokens);

  // Calculate costs using model-specific pricing
  const costs = calculateCosts(inputTokens, finalImages.length, modelId);

  return {
    images: finalImages,
    text: responseText,
    tokens: {
      input: inputTokens,
      output: outputTokens,
      total: totalTokens,
    },
    costs: {
      input: costs.inputCost,
      output: costs.outputCost,
      total: costs.totalCost,
    },
  };
}

