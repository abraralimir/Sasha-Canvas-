'use server';

/**
 * @fileOverview An AI flow for creating and refining drawings. It can generate a new image from a text prompt, or refine an existing image based on user instructions.
 *
 * - refineDrawing - A function that handles the drawing creation and refinement process.
 */

import {ai} from '@/ai/genkit';
import {
  RefineDrawingInput,
  RefineDrawingInputSchema,
  RefineDrawingOutput,
  RefineDrawingOutputSchema,
} from '@/ai/schemas/drawing';

export async function refineDrawing(
  input: RefineDrawingInput
): Promise<RefineDrawingOutput> {
  return refineDrawingFlow(input);
}

const refineDrawingFlow = ai.defineFlow(
  {
    name: 'refineDrawingFlow',
    inputSchema: RefineDrawingInputSchema,
    outputSchema: RefineDrawingOutputSchema,
  },
  async input => {
    const systemPrompt = `You are Sasha, a world-class digital artist and helpful AI assistant. Your purpose is to help users create beautiful artwork.

You will be given user instructions and potentially one or two images: an original user drawing and a more recent AI-generated version.

- If you are ONLY given text instructions, create a brand new, high-quality, photorealistic image based on the user's description. The image should be beautiful and inspiring.
- If you are given an image and instructions, you must refine the provided AI-generated image based on the user's instructions. Use the original drawing for context if it's available. Do not just make minor edits; aim for a significant, artistic improvement that incorporates the user's feedback.

Always respond with both a new image and some friendly, encouraging feedback in the text field. The feedback should be brief and conversational.

User instructions: ${input.userInstructions}`;

    const promptParts: ({text: string} | {media: {url: string}})[] = [
      {text: systemPrompt},
    ];

    if (input.originalDrawingDataUri) {
      promptParts.push({media: {url: input.originalDrawingDataUri}});
    }
    if (input.currentDrawingDataUri) {
      promptParts.push({media: {url: input.currentDrawingDataUri}});
    }

    const {media, text} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: promptParts,
      config: {
        responseModalities: ['IMAGE', 'TEXT'],
      },
    });

    if (!media || !media.url) {
      throw new Error('The AI failed to generate an image.');
    }

    return {
      refinedDrawingDataUri: media.url,
      feedback: text,
    };
  }
);
