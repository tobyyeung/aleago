import Link from 'next/link'

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
            className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 min-h-80 flex flex-col items-center justify-between hover:border-zinc-600 transition-colors cursor-pointer block"
          >
            <span className="text-sm sm:text-base font-black tracking-wide text-white uppercase">
              {game}
            </span>
            <div className="w-30 h-60 border border-zinc-800 border-dashed rounded flex items-center justify-center text-[8px] font-mono text-zinc-600">
              [TEMP IMG]
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}