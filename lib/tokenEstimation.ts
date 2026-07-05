/**
 * WHY: Local token estimation provides immediate feedback to the user
 * without requiring a round-trip to the server or using the API key.
 * This is crucial for the "BYOK" model where users want to see costs
 * before committing their own credits.
 */

export const estimateTextTokens = (text: string): number => {
  // Rough approximation: 1 token per 4 characters for English
  return Math.ceil(text.length / 4);
};

export const estimateImageTokens = (
  width: number,
  height: number,
): number => {
  // According to Google's documentation for Gemini 2.0/2.5:
  // - Images with both dimensions <= 384px: 258 tokens
  // - Images with one or both dimensions > 384px: cropped/scaled to 768x768 thumbnails, 258 tokens each
  if (width <= 384 && height <= 384) {
    return 258;
  } else {
    // Calculate number of 768x768 thumbnails needed
    const thumbnails = Math.ceil((width * height) / (768 * 768));
    return thumbnails * 258;
  }
};
