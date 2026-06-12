import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MinesGame } from '@/components/games/MinesGame'
import { PlinkoGame } from '@/components/games/PlinkoGame'

const VALID_GAMES = ['mines', 'plinko', 'tower', 'dice']

export default async function GamePage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const resolvedParams = await params
  const slug = resolvedParams.slug

  if (!VALID_GAMES.includes(slug)) {
    notFound()
  }

  const gameName = slug.charAt(0).toUpperCase() + slug.slice(1)

  return (
    <main className="flex-1 p-4 sm:p-6 md:p-10 flex flex-col">
      <div className="mb-6">
        <Link href="/games" className="text-xs font-bold text-zinc-500 hover:text-white transition-colors">
          ← BACK TO GAMES
        </Link>
      </div>

      <div className="mb-8 border-b border-zinc-800 pb-4">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tighter uppercase">{gameName}</h1>
      </div>

      {slug === 'mines' ? (
        <div className="flex-1 min-h-[600px]">
          <MinesGame />
        </div>
      ) : slug === 'plinko' ? (
        <div className="flex-1 min-h-[600px]">
          <PlinkoGame />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center border border-zinc-800 border-dashed rounded-xl bg-zinc-950/50">
          <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest animate-pulse">
            {gameName} Module Offline
          </p>
        </div>
      )}
    </main>
  )
}
