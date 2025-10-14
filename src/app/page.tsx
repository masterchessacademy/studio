import { ChessGame } from '@/components/chess-game';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 md:p-12 bg-background">
      <ChessGame />
    </main>
  );
}
