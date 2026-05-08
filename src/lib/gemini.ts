import { GoogleGenAI } from "@google/genai";

export const VIDEO_MODELS = {
  HIGH_QUALITY: 'veo-3.1-generate-preview',
  LITE: 'veo-3.1-lite-generate-preview',
};

export async function generatePromoVideo(prompt: string, config: { resolution: string, aspectRatio: string }) {
  const apiKey = process.env.API_KEY || (process.env.GEMINI_API_KEY as string);
  const ai = new GoogleGenAI({ apiKey });

  let operation = await ai.models.generateVideos({
    model: VIDEO_MODELS.LITE,
    prompt,
    config: {
      numberOfVideos: 1,
      resolution: config.resolution as any,
      aspectRatio: config.aspectRatio as any,
    }
  });

  // Polling for completion
  return operation;
}

export async function getOperationStatus(operation: any) {
  const apiKey = process.env.API_KEY || (process.env.GEMINI_API_KEY as string);
  const ai = new GoogleGenAI({ apiKey });
  return await ai.operations.getVideosOperation({ operation });
}

export async function fetchVideoBlob(uri: string) {
  const apiKey = process.env.API_KEY || (process.env.GEMINI_API_KEY as string);
  const response = await fetch(uri, {
    method: 'GET',
    headers: {
      'x-goog-api-key': apiKey,
    },
  });
  return await response.blob();
}
