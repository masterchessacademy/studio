// This file implements the Genkit flow for suggesting a chess move.
'use server';
/**
 * @fileOverview A chess move suggestion AI agent.
 *
 * - suggestMove - A function that suggests a chess move.
 * - SuggestMoveInput - The input type for the suggestMove function.
 * - SuggestMoveOutput - The return type for the suggestMove function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestMoveInputSchema = z.object({
  fen: z.string().describe('The current board state in FEN notation.'),
});
export type SuggestMoveInput = z.infer<typeof SuggestMoveInputSchema>;

const SuggestMoveOutputSchema = z.object({
  move: z.string().describe('The suggested move in UCI notation (e.g., "e2e4", "g1f3", "a7a8q").'),
  explanation: z.string().describe('Explanation of why the move is suggested.'),
});
export type SuggestMoveOutput = z.infer<typeof SuggestMoveOutputSchema>;

export async function suggestMove(input: SuggestMoveInput): Promise<SuggestMoveOutput> {
  return suggestMoveFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestMovePrompt',
  input: {schema: SuggestMoveInputSchema},
  output: {schema: SuggestMoveOutputSchema},
  prompt: `You are a helpful chess tutor. Given the current board state in FEN notation, suggest a single best move for the current player.

Current board state (FEN): {{{fen}}}

Based on the FEN string, determine whose turn it is.
Suggest the best possible legal move for that player.
Output the move strictly in UCI notation (e.g., e2e4, g1f3, a7a8q for promotion).
Provide a brief explanation for your move suggestion.
`,
});

const suggestMoveFlow = ai.defineFlow(
  {
    name: 'suggestMoveFlow',
    inputSchema: SuggestMoveInputSchema,
    outputSchema: SuggestMoveOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
