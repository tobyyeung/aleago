import Link from 'next/link'
import Image from 'next/image'

export default function GamesPage() {
  const games = ['Mines', 'Plinko', 'Tower', 'Dice']

  return (
    <main className="flex-1 p-4 sm:p-6 md:p-10">
      <div className="mb-8 sm:mb-12 border-b border-zinc-800 pb-4 sm:pb-6">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tighter">GAMES</h1>
        <span className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] sm:tracking-[0.3em]">
          Sector_07 Arcade
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {games.map((game) => (
          <Link
            key={game}
            href={`/games/${game.toLowerCase()}`}
            className="group bg-zinc-950 border border-zinc-800 rounded-xl p-4 min-h-80 flex flex-col items-center justify-center hover:border-zinc-600 transition-colors cursor-pointer block relative overflow-hidden"
          >
            <div className="absolute inset-0 w-full h-full">
              <Image 
                src={`/images/${game.toLowerCase()}.png`} 
                alt={`${game} thumbnail`}
                fill
                className="object-cover opacity-60 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent pointer-events-none" />
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}