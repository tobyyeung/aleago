'use client'

import { useState, useEffect } from 'react'
import { useCurrency } from '@/contexts/CurrencyContext'
import { getMinesMultiplier, generateMinesGrid, type Tile } from '@/lib/games/mines'
import { supabase } from '@/lib/supabaseClient'
import { adjustCash } from '@/app/currency-actions'

type GameStatus = 'idle' | 'playing' | 'cashed_out' | 'busted'

export function MinesGame() {
  const { cash, setCash, refreshCash, loading: currencyLoading } = useCurrency()
  const [status, setStatus] = useState<GameStatus>('idle')
  const [grid, setGrid] = useState<Tile[]>(() => generateMinesGrid(3))
  const [betAmount, setBetAmount] = useState<number>(10)
  const [minesCount, setMinesCount] = useState<number>(3)
  const [safePicks, setSafePicks] = useState<number>(0)
  const [actionLoading, setActionLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Reset grid when returning to idle
  useEffect(() => {
    if (status === 'idle') {
      setGrid(generateMinesGrid(minesCount))
      setSafePicks(0)
    }
  }, [status, minesCount])

  const currentMultiplier = getMinesMultiplier(minesCount, safePicks)
  const nextMultiplier = getMinesMultiplier(minesCount, safePicks + 1)
  const potentialWin = Math.floor(betAmount * currentMultiplier)

  async function getAccessToken() {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }

  async function handleBet() {
    if (status === 'playing' || actionLoading) return false
    if (betAmount <= 0) {
      setErrorMsg('Bet amount must be greater than 0')
      return false
    }
    if (betAmount > cash) {
      setErrorMsg('Insufficient funds')
      return false
    }

    setActionLoading(true)
    const token = await getAccessToken()
    if (!token) {
      setErrorMsg('You must be logged in to play')
      setActionLoading(false)
      return false
    }

    const res = await adjustCash(token, -betAmount)
    if (!res.success) {
      setErrorMsg(`Error: ${res.error}`)
      setActionLoading(false)
      return false
    }

    if (res.success && res.cash !== undefined) {
      setCash(res.cash)
    }
    setStatus('playing')
    setActionLoading(false)
    return true
  }

  async function handleTileClick(index: number) {
    if (actionLoading) return
    if (status === 'playing' && grid[index].revealed) return

    if (status === 'cashed_out' || status === 'busted') {
      setStatus('idle')
      return
    }

    if (status === 'idle') {
      const started = await handleBet()
      if (!started) return
    }

    const newGrid = [...grid]
    newGrid[index].revealed = true
    setGrid(newGrid)

    if (newGrid[index].isMine) {
      // Busted! Reveal all mines
      const revealedGrid = newGrid.map(t => ({ ...t, revealed: true }))
      setGrid(revealedGrid)
      setStatus('busted')
    } else {
      setSafePicks(prev => prev + 1)
      
      // Check if user has cleared all safe spots (win automatically)
      if (safePicks + 1 === 25 - minesCount) {
        await processCashout(safePicks + 1)
      }
    }
  }

  async function handleCashout() {
    if (status !== 'playing' || safePicks === 0 || actionLoading) return
    await processCashout(safePicks)
  }

  async function processCashout(picks: number) {
    setActionLoading(true)
    const token = await getAccessToken()
    if (!token) {
      setActionLoading(false)
      return
    }

    const finalMultiplier = getMinesMultiplier(minesCount, picks)
    const winnings = Math.floor(betAmount * finalMultiplier)

    const res = await adjustCash(token, winnings)
    if (res.success && res.cash !== undefined) {
      setCash(res.cash)
    } else if (!res.success) {
      setErrorMsg(`Error cashing out: ${res.error}`)
    }

    // Reveal all mines upon cashout
    setGrid(prev => prev.map(t => ({ ...t, revealed: true })))
    setStatus('cashed_out')
    setActionLoading(false)
  }

  return (
    <>
      {/* Error Modal */}
      {errorMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-red-500/30 p-8 rounded-3xl shadow-2xl max-w-xs w-full flex flex-col items-center text-center gap-4 transform transition-all">
            <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-2 border border-red-500/20">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-white font-black text-xl uppercase tracking-wider">Error</h3>
              <p className="text-zinc-400 text-sm font-medium">{errorMsg}</p>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="w-full mt-4 py-3 rounded-xl bg-red-500 text-white font-black uppercase tracking-widest hover:bg-red-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6 lg:gap-10 h-full w-full max-w-6xl mx-auto">
        {/* Controls Panel */}
      <div className="w-full md:w-80 shrink-0 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-zinc-400 tracking-widest uppercase">Bet Amount</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-mono">$</span>
            <input 
              type="number" 
              min="0"
              step="1"
              value={betAmount || ''}
              onChange={(e) => {
                let val = Math.floor(Number(e.target.value));
                if (val > cash) val = Math.floor(cash);
                if (val < 0) val = 0;
                setBetAmount(val);
              }}
              disabled={status !== 'idle' || actionLoading}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-3 pl-8 pr-4 text-white font-mono font-bold focus:outline-none focus:border-zinc-500 disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
          <div className="grid grid-cols-3 gap-2 mt-1">
            {[10, 100, 1000].map((amt) => (
              <button
                key={`add-${amt}`}
                onClick={() => setBetAmount(prev => Math.min(prev + amt, Math.floor(cash)))}
                disabled={status !== 'idle' || actionLoading}
                className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-xs font-bold py-2 rounded transition-colors text-zinc-300"
              >
                +{amt}
              </button>
            ))}
          </div>
          <div className="relative py-1">
            <input
              type="range"
              min="0"
              max={Math.max(0, Math.floor(cash))}
              step="1"
              value={betAmount || 0}
              onChange={(e) => setBetAmount(Number(e.target.value))}
              disabled={status !== 'idle' || actionLoading}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed accent-lime-400"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[10, 100, 1000].map((amt) => (
              <button
                key={`sub-${amt}`}
                onClick={() => setBetAmount(prev => Math.max(0, prev - amt))}
                disabled={status !== 'idle' || actionLoading}
                className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-xs font-bold py-2 rounded transition-colors text-zinc-300"
              >
                -{amt}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-zinc-400 tracking-widest uppercase">Mines</label>
            <span className="text-sm font-mono font-bold text-lime-400">{minesCount}</span>
          </div>
          <div className="relative pt-2 pb-2">
            <input
              type="range"
              min="3"
              max="24"
              step="1"
              value={minesCount}
              onChange={(e) => setMinesCount(Number(e.target.value))}
              disabled={status !== 'idle' || actionLoading}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed accent-lime-400"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-2 px-1">
              <span>3</span>
              <span>24</span>
            </div>
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-3">
          {status === 'cashed_out' && (
            <div className="bg-lime-400 text-black px-4 py-2 rounded-lg font-black uppercase tracking-widest text-center">
              You Won ${potentialWin}!
            </div>
          )}
          {status === 'busted' && (
            <div className="bg-red-500 text-white px-4 py-2 rounded-lg font-black uppercase tracking-widest text-center">
              Busted!
            </div>
          )}

          {status === 'playing' ? (
            <button
              onClick={handleCashout}
              disabled={safePicks === 0 || actionLoading}
              className="w-full bg-lime-400 hover:bg-lime-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-black uppercase tracking-widest py-4 rounded-xl transition-colors flex flex-col items-center justify-center gap-1"
            >
              <span>Cashout</span>
              {safePicks > 0 && <span className="text-xs font-mono opacity-80">${potentialWin}</span>}
            </button>
          ) : (
            <button
              onClick={status === 'idle' ? handleBet : () => setStatus('idle')}
              disabled={actionLoading || currencyLoading}
              className="w-full bg-white hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-black uppercase tracking-widest py-4 rounded-xl transition-colors"
            >
              {status === 'idle' ? 'Bet' : 'Play Again'}
            </button>
          )}
        </div>
      </div>

      {/* Game Grid Panel */}
      <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col items-center justify-center p-4 sm:p-10 relative overflow-hidden">
        {/* Multiplier Info */}
        <div className="w-full max-w-[400px] mb-6 flex justify-between items-center px-2">
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Multiplier</span>
            <span className="text-lg font-mono font-bold text-white">{currentMultiplier.toFixed(2)}x</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Next</span>
            <span className="text-lg font-mono font-bold text-zinc-400">{nextMultiplier.toFixed(2)}x</span>
          </div>
        </div>

        {/* The Grid */}
        <div className="grid grid-cols-5 grid-rows-5 gap-2 sm:gap-3 w-full max-w-[400px] aspect-square">
          {grid.map((tile, index) => (
            <button
              key={tile.id}
              onClick={() => handleTileClick(index)}
              disabled={status === 'playing' && tile.revealed}
              className={`w-full h-full rounded-lg sm:rounded-xl transition-all duration-200 transform flex items-center justify-center ${
                tile.revealed
                  ? tile.isMine
                    ? 'bg-red-500 scale-95 opacity-100 shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                    : 'bg-zinc-800 scale-95 opacity-100'
                  : 'bg-zinc-700 shadow-[0_4px_0_rgba(39,39,42,1)]'
              } ${
                status !== 'playing'
                  ? 'hover:brightness-125 cursor-pointer active:scale-95'
                  : !tile.revealed 
                    ? 'hover:bg-zinc-600 hover:-translate-y-1 hover:shadow-[0_6px_0_rgba(63,63,70,1)] active:translate-y-1 active:shadow-none'
                    : ''
              }`}
            >
              {tile.revealed && (
                tile.isMine ? (
                  <span className="text-2xl sm:text-3xl">💣</span>
                ) : (
                  <span className="text-2xl sm:text-3xl drop-shadow-[0_0_10px_rgba(163,230,53,0.5)]">💎</span>
                )
              )}
            </button>
          ))}
        </div>
      </div>
      </div>
    </>
  )
}
