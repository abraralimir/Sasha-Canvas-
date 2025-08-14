import {z} from 'zod';

/**
 * @fileOverview Zod schemas for the drawing AI flows.
 */

export const CompleteDrawingInputSchema = z.object({
  drawingDataUri: z
    .string()
    .describe(
      "The user's initial drawing as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type CompleteDrawingInput = z.infer<typeof CompleteDrawingInputSchema>;

export const CompleteDrawingOutputSchema = z.object({
  completedDrawingDataUri: z
    .string()
    .describe('The AI-completed drawing as a data URI.'),
});
export type CompleteDrawingOutput = z.infer<
  typeof CompleteDrawingOutputSchema
>;

export const RefineDrawingInputSchema = z.object({
  originalDrawingDataUri: z
    .string()
    .describe('The original user drawing as a data URI. Optional.')
    .optional(),
  currentDrawingDataUri: z
    .string()
    .describe(
      'The current state of the canvas to be refined, as a data URI. Optional.'
    )
    .optional(),
  userInstructions: z
    .string()
    .describe('Instructions for creating or refining the drawing.'),
});
export type RefineDrawingInput = z.infer<typeof RefineDrawingInputSchema>;

export const RefineDrawingOutputSchema = z.object({
  refinedDrawingDataUri: z
    .string()
    .describe('The refined or newly generated drawing as a data URI.'),
  feedback: z.string().optional().describe('Feedback from the AI assistant.'),
});
export type RefineDrawingOutput = z.infer<typeof RefineDrawingOutputSchema>;
