import { ChessGame } from '@/components/chess-game';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';


export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 md:p-12 bg-background">
      <div className="flex flex-col items-center gap-8 w-full max-w-5xl">
        <div className="text-center">
            <h1 className="text-5xl font-bold font-headline mb-2">ChessMate</h1>
            <p className="text-xl text-muted-foreground">Play chess against AI or a friend.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
            <Card>
                <CardHeader>
                    <CardTitle>Play against AI</CardTitle>
                    <CardDescription>Challenge our generative AI opponent.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChessGame />
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Play against a Friend</CardTitle>
                    <CardDescription>Play a real-time game with someone else.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center h-full gap-4 pt-10">
                   <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    <Link href="/multiplayer" passHref>
                        <Button size="lg">Multiplayer Lobby</Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
      </div>
    </main>
  );
}
