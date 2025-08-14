'use server';

/**
 * @fileOverview A flow for refining AI-completed drawings using a conversational AI assistant.
 *
 * - refineDrawing - A function that handles the drawing refinement process.
 * - RefineDrawingInput - The input type for the refineDrawing function.
 * - RefineDrawingOutput - The return type for the refineDrawing function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RefineDrawingInputSchema = z.object({
  originalDrawingDataUri: z
    .string()
    .describe(
      "The original drawing as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  aiCompletedDrawingDataUri: z
    .string()
    .describe(
      "The AI-completed drawing as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  userInstructions: z.string().describe('Instructions for refining the drawing.'),
});
export type RefineDrawingInput = z.infer<typeof RefineDrawingInputSchema>;

const RefineDrawingOutputSchema = z.object({
  refinedDrawingDataUri: z
    .string()
    .describe(
      "The refined drawing as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  feedback: z.string().optional().describe('Feedback from the AI assistant.'),
});
export type RefineDrawingOutput = z.infer<typeof RefineDrawingOutputSchema>;

export async function refineDrawing(input: RefineDrawingInput): Promise<RefineDrawingOutput> {
  return refineDrawingFlow(input);
}

const refineDrawingFlow = ai.defineFlow(
  {
    name: 'refineDrawingFlow',
    inputSchema: RefineDrawingInputSchema,
    outputSchema: RefineDrawingOutputSchema,
  },
  async input => {
    const {media, text} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: [
        {text: `You are Sasha, a helpful AI assistant that helps users refine their drawings.

The user has provided an original drawing, an AI-completed drawing, and instructions on how to refine the drawing.

Instructions: ${input.userInstructions}

Create a refined version of the AI-completed drawing based on the user's instructions. Return the refined drawing as a data URI. Also provide any feedback to the user that may be helpful.
`},
        {media: {url: input.originalDrawingDataUri}},
        {media: {url: input.aiCompletedDrawingDataUri}},
      ],
      config: {
        responseModalities: ['IMAGE', 'TEXT'],
      },
    });

    return {
      refinedDrawingDataUri: media.url,
      feedback: text()
    };
  }
);
