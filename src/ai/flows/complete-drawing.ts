// This is an AI-powered drawing completion tool.
// It takes a drawing data URI and enhances it with AI, allowing users to create more polished and detailed artwork effortlessly.
// It includes the aiCompleteDrawing function, CompleteDrawingInput, and CompleteDrawingOutput types.
'use server';
import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CompleteDrawingInputSchema = z.object({
  drawingDataUri: z
    .string()
    .describe(
      'The drawing as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' // Corrected the typo here
    ),
  userPrompt: z
    .string()
    .describe('A prompt from the user describing the desired enhancements.'),
});
export type CompleteDrawingInput = z.infer<typeof CompleteDrawingInputSchema>;

const CompleteDrawingOutputSchema = z.object({
  completedDrawingDataUri: z
    .string()
    .describe('The AI-completed drawing as a data URI.'),
});
export type CompleteDrawingOutput = z.infer<typeof CompleteDrawingOutputSchema>;

export async function aiCompleteDrawing(input: CompleteDrawingInput): Promise<CompleteDrawingOutput> {
  return completeDrawingFlow(input);
}

const completeDrawingPrompt = ai.definePrompt({
  name: 'completeDrawingPrompt',
  input: {schema: CompleteDrawingInputSchema},
  output: {schema: CompleteDrawingOutputSchema},
  prompt: `You are an AI that enhances user drawings based on their additional instructions.

  Original Drawing: {{media url=drawingDataUri}}
  User Instructions: {{{userPrompt}}}

  Create an enhanced version of the drawing, incorporating the user's instructions. The output should be a data URI representing the completed image.`, // Added instructions for output format
});

const completeDrawingFlow = ai.defineFlow(
  {
    name: 'completeDrawingFlow',
    inputSchema: CompleteDrawingInputSchema,
    outputSchema: CompleteDrawingOutputSchema,
  },
  async input => {
    const {output} = await completeDrawingPrompt(input);
    return output!;
  }
);
