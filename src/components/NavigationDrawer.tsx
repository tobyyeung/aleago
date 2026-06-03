'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

const NAV_LINKS = [
  { href: '/inventory', label: 'Inventory' },
  { href: '/games', label: 'Games' },
] as const

type NavigationDrawerProps = {
  open: boolean
  onClose: () => void
  user: User | null
  onSignIn: () => void
  onSignOut: () => void
}

export function NavigationDrawer({
  open,
  onClose,
  user,
  onSignIn,
  onSignOut,
}: NavigationDrawerProps) {
  const pathname = usePathname()

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity duration-200 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden={!open}
        onClick={onClose}
      />

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 max-w-[85vw] bg-zinc-950 border-r border-zinc-800 flex flex-col transition-transform duration-200 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-hidden={!open}
        inert={!open ? true : undefined}
      >
        <div className="px-5 py-6 border-b border-zinc-800">
          <Link
            href="/"
            onClick={onClose}
            className="text-xl font-black tracking-tighter text-white hover:text-zinc-300 transition-colors"
          >
            ALEAGO
          </Link>
          <p className="text-[10px] text-zinc-600 uppercase tracking-[0.3em] mt-1 font-mono">
            Sector_07
          </p>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`px-3 py-3 rounded-lg text-sm font-bold tracking-wide transition-colors ${
                  active
                    ? 'bg-white text-black'
                    : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
                }`}
              >
                {label.toUpperCase()}
              </Link>
            )
          })}
        </nav>

        <div className="px-5 py-5 border-t border-zinc-800 mt-auto">
          {user ? (
            <>
              <p className="text-[10px] font-mono text-zinc-500 truncate mb-3" title={user.email ?? undefined}>
                {user.email}
              </p>
              <button
                type="button"
                onClick={() => {
                  onSignOut()
                  onClose()
                }}
                className="w-full text-[10px] border border-zinc-700 px-3 py-2 rounded font-bold tracking-widest hover:bg-zinc-900 transition-colors"
              >
                LOGOUT
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                onSignIn()
                onClose()
              }}
              className="w-full bg-white text-black px-3 py-2 rounded-full font-bold text-xs tracking-widest hover:bg-zinc-200 transition-colors"
            >
              LOGIN
            </button>
          )}
        </div>
      </aside>
    </>
  )
}
