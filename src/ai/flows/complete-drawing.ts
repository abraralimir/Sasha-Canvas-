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
      "The drawing as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
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

export async function aiCompleteDrawing(
  input: CompleteDrawingInput
): Promise<CompleteDrawingOutput> {
  return completeDrawingFlow(input);
}

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
        {media: {url: input.drawingDataUri}},
        {text: input.userPrompt},
      ],
      config: {
        responseModalities: ['IMAGE'],
      },
    });

    return {completedDrawingDataUri: media.url};
  }
);
