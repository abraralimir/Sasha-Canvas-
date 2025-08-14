// This is an AI-powered drawing completion tool.
// It takes a drawing data URI and enhances it with AI, allowing users to create more polished and detailed artwork effortlessly.
// It includes the aiCompleteDrawing function, CompleteDrawingInput, and CompleteDrawingOutput types.
'use server';
import {ai} from '@/ai/genkit';
import {z} from 'zod';

const CompleteDrawingInputSchema = z.object({
  drawingDataUri: z
    .string()
    .describe(
      "The user's initial drawing as a data URI."
    ),
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

const systemPrompt = `You are a world-class digital artist named Sasha. Your purpose is to take a user-created doodle or sketch and transform it into a beautiful, high-quality image.

Instructions:
1.  Analyze the user's drawing provided as an image.
2.  Identify the subject matter of the drawing.
3.  Completely redraw the image in a photorealistic and artistic style, adding detail, texture, lighting, and a dynamic composition.
4.  Do not just "trace" or "colorize" the user's drawing. You should re-imagine it based on the core idea.
5.  The final image should be a dramatic improvement, looking like a finished piece of digital art.
6.  The output must be only the generated image, with no additional text or commentary.
7.  The user's drawing is a rough guide; be creative and interpret their idea artistically. The goal is to "wow" them with a professional-quality image based on their simple drawing.
`;


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
        throw new Error("The AI failed to generate an image.");
    }
    
    return {completedDrawingDataUri: media.url};
  }
);
