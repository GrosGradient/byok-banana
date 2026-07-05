import { useState, useEffect, useRef } from "react";
import { type ImageModelId } from "@/lib/modelPricing";
import { estimateTextTokens, estimateImageTokens } from "@/lib/tokenEstimation";
import { calculateInputCost, estimateOutputCost, type TokenEstimate } from "@/lib/costTracking";
import { getImageDimensions } from "@/lib/imageUtils";

/**
 * WHY: Abstracting token calculation and animations keeps the UI component clean.
 * This hook handles the debounce logic so typing remains perfectly fluid
 * even while running token estimations on the client.
 */
export const useCostTracking = (prompt: string, images: File[], modelId: ImageModelId) => {
  const [tokenEstimate, setTokenEstimate] = useState<TokenEstimate | null>(null);
  const [textTokens, setTextTokens] = useState<number>(0);
  const [imageTokens, setImageTokens] = useState<number>(0);
  const [outputCostEstimate, setOutputCostEstimate] = useState<number>(0);
  
  const [animateTextTokens, setAnimateTextTokens] = useState(false);
  const [animateImageTokens, setAnimateImageTokens] = useState(false);
  
  const countTokensTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevTextTokensRef = useRef<number>(0);
  const prevImageTokensRef = useRef<number>(0);

  // Calculate tokens locally with debounce
  useEffect(() => {
    // Clear previous timeout
    if (countTokensTimeoutRef.current) {
      clearTimeout(countTokensTimeoutRef.current);
    }

    // Debounce the token calculation
    countTokensTimeoutRef.current = setTimeout(async () => {
      // Calculate tokens separately
      const textTokensValue = prompt.trim() ? estimateTextTokens(prompt) : 0;
      setTextTokens(textTokensValue);

      let imageTokensValue = 0;

      // Calculate tokens for images
      if (images.length > 0) {
        try {
          const imageDimensions = await Promise.all(
            images.map((image) => {
              if (image && image.size > 0) {
                return getImageDimensions(image);
              }
              return Promise.resolve({ width: 0, height: 0 });
            })
          );

          imageDimensions.forEach(({ width, height }) => {
            if (width > 0 && height > 0) {
              imageTokensValue += estimateImageTokens(width, height);
            }
          });
        } catch (error) {
          // If image loading fails, use fallback estimation
          images.forEach((image) => {
            if (image && image.size > 0) {
              const estimatedSize = Math.sqrt((image.size / 1024) * 100);
              imageTokensValue += estimateImageTokens(estimatedSize, estimatedSize);
            }
          });
        }
      }

      setImageTokens(imageTokensValue);

      // Calculate total input tokens and costs
      const totalInputTokens = textTokensValue + imageTokensValue;
      const inputCost = calculateInputCost(totalInputTokens, modelId);

      // Estimate output cost
      const outputCost = prompt.trim() ? estimateOutputCost(prompt, modelId) : 0;
      setOutputCostEstimate(outputCost);

      if (prompt.trim() || images.length > 0) {
        setTokenEstimate({
          tokens: { input: totalInputTokens },
          costs: {
            input: inputCost,
            output: outputCost,
            total: inputCost + outputCost,
          },
        });
      } else {
        setTokenEstimate(null);
      }
    }, 300);

    return () => {
      if (countTokensTimeoutRef.current) {
        clearTimeout(countTokensTimeoutRef.current);
      }
    };
  }, [prompt, images, modelId]);

  // Detect token changes and trigger animations
  useEffect(() => {
    if (textTokens !== prevTextTokensRef.current && prevTextTokensRef.current > 0) {
      setAnimateTextTokens(true);
      const timeout = setTimeout(() => setAnimateTextTokens(false), 600);
      return () => clearTimeout(timeout);
    }
    prevTextTokensRef.current = textTokens;
  }, [textTokens]);

  useEffect(() => {
    if (imageTokens !== prevImageTokensRef.current && prevImageTokensRef.current > 0) {
      setAnimateImageTokens(true);
      const timeout = setTimeout(() => setAnimateImageTokens(false), 600);
      return () => clearTimeout(timeout);
    }
    prevImageTokensRef.current = imageTokens;
  }, [imageTokens]);

  return {
    tokenEstimate,
    textTokens,
    imageTokens,
    outputCostEstimate,
    animateTextTokens,
    animateImageTokens
  };
};
