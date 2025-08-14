'use server';
/**
 * @fileOverview This file defines the AI flow for completing a user's drawing.
 * It takes a partial drawing and uses an image generation model to complete it.
 */
import {ai} from '@/ai/genkit';
import {
  CompleteDrawingInput,
  CompleteDrawingInputSchema,
  CompleteDrawingOutputSchema,
} from '@/ai/schemas/drawing';

export async function aiCompleteDrawing(
  input: CompleteDrawingInput
): Promise<{completedDrawingDataUri: string}> {
  return completeDrawingFlow(input);
}

const systemPrompt = `You are a world-class digital artist named Sasha. Your purpose is to take a user-created doodle or sketch and transform it into a beautiful, high-quality image.

Instructions:
1.  Analyze the user's drawing provided as an image.
2.  Identify the subject matter and intent of the drawing.
3.  Completely redraw the image in a visually stunning, artistic style. This is not about simple correction, but about elevation and transformation. Add rich colors, textures, lighting, and a dynamic composition.
4.  Do not just "trace" or "colorize" the user's drawing. You should re-imagine it based on the core idea.
5.  The final image should be a dramatic improvement, looking like a finished piece of digital art.
6.  The output must be only the generated image, with no additional text or commentary.
7.  The user's drawing is a rough guide; be creative and interpret their idea artistically. The goal is to "wow" them with a professional-quality image based on their simple drawing.
8. If the drawing is very simple, like a single shape, try to turn it into a beautiful object or scene. For example, a circle could become a planet, a sun, or a detailed ball. A simple flower sketch should become a vibrant, lifelike flower in a natural setting.`;

const completeDrawingFlow = ai.defineFlow(
  {
    name: 'completeDrawingFlow',
    inputSchema: CompleteDrawingInputSchema,
    outputSchema: CompleteDrawingOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: [
        {text: systemPrompt},
        {media: {url: input.drawingDataUri}},
      ],
      config: {
        responseModalities: ['IMAGE', 'TEXT'],
      },
    });

    if (!media) {
      throw new Error('The AI failed to generate an image.');
    }

    return {completedDrawingDataUri: media.url};
  }
);
