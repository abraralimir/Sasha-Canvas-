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

const prompt = ai.definePrompt({
  name: 'refineDrawingPrompt',
  input: {schema: RefineDrawingInputSchema},
  output: {schema: RefineDrawingOutputSchema},
  prompt: `You are Sasha, a helpful AI assistant that helps users refine their drawings.

The user has provided an original drawing, an AI-completed drawing, and instructions on how to refine the drawing.

Original Drawing: {{media url=originalDrawingDataUri}}
AI-Completed Drawing: {{media url=aiCompletedDrawingDataUri}}
Instructions: {{{userInstructions}}}

Create a refined version of the AI-completed drawing based on the user's instructions. Return the refined drawing as a data URI. Also provide any feedback to the user that may be helpful.
`,
});

const refineDrawingFlow = ai.defineFlow(
  {
    name: 'refineDrawingFlow',
    inputSchema: RefineDrawingInputSchema,
    outputSchema: RefineDrawingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
