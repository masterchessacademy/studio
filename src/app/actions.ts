'use server';

import { suggestMove, type SuggestMoveOutput } from '@/ai/flows/suggest-move';

export async function getAiMove(fen: string): Promise<SuggestMoveOutput | null> {
  try {
    const suggestion = await suggestMove({ fen });
    return suggestion;
  } catch (error) {
    console.error('Error getting AI move:', error);
    // Depending on desired error handling, you could re-throw or return a specific error object
    return null;
  }
}
