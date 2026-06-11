'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

const NAV_LINKS = [
  { href: '/inventory', label: 'Inventory' },
  { href: '/games', label: 'Games' },
] as const

const SIZES = {
  drawerWidth: "w-64 max-w-[85vw]",
  headerPadding: "px-5 py-6",
  logoText: "text-xl",
  subtitleText: "text-[10px]",
  navAreaPadding: "px-3 py-4",
  navItemPadding: "px-3 py-3",
  navItemText: "text-sm",
  footerPadding: "px-5 py-5",
  footerEmailText: "text-[10px]",
  logoutBtnPadding: "px-3 py-2",
  logoutBtnText: "text-[10px]",
  loginBtnPadding: "px-3 py-2",
  loginBtnText: "text-xs",
}

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
        className={`fixed top-0 left-0 z-50 h-full ${SIZES.drawerWidth} bg-zinc-950 border-r border-zinc-800 flex flex-col transition-transform duration-200 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-hidden={!open}
        inert={!open ? true : undefined}
      >
        <div className={`${SIZES.headerPadding} border-b border-zinc-800`}>
          <Link
            href="/"
            onClick={onClose}
            className={`${SIZES.logoText} font-black tracking-tighter text-white hover:text-zinc-300 transition-colors`}
          >
            ALEAGO
          </Link>
          <p className={`${SIZES.subtitleText} text-zinc-600 uppercase tracking-[0.3em] mt-1 font-mono`}>
            Sector_07
          </p>
        </div>

        <nav className={`flex-1 ${SIZES.navAreaPadding} flex flex-col gap-1`}>
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`${SIZES.navItemPadding} rounded-lg ${SIZES.navItemText} font-bold tracking-wide transition-colors ${
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

        <div className={`${SIZES.footerPadding} border-t border-zinc-800 mt-auto`}>
          {user ? (
            <>
              <p className={`${SIZES.footerEmailText} font-mono text-zinc-500 truncate mb-3`} title={user.email ?? undefined}>
                {user.email}
              </p>
              <button
                type="button"
                onClick={() => {
                  onSignOut()
                  onClose()
                }}
                className={`w-full ${SIZES.logoutBtnText} border border-zinc-700 ${SIZES.logoutBtnPadding} rounded font-bold tracking-widest hover:bg-zinc-900 transition-colors`}
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
              className={`w-full bg-white text-black ${SIZES.loginBtnPadding} rounded-full font-bold ${SIZES.loginBtnText} tracking-widest hover:bg-zinc-200 transition-colors`}
            >
              LOGIN
            </button>
          )}
        </div>
      </aside>
    </>
  )
}
