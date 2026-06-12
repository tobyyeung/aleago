'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'
import { NavigationDrawer } from '@/components/NavigationDrawer'
import { CurrencyDisplay } from '@/components/CurrencyDisplay'
import { CurrencyProvider } from '@/contexts/CurrencyContext'

const SIZES = {
  headerPadding: "px-4 py-4 sm:px-6 sm:py-6 md:px-10 md:py-8",
  drawerBtnPadding: "p-2",
  drawerIcon: "w-5 h-5",
  logoText: "text-xl sm:text-2xl",
  loginBtnPadding: "px-6 py-2",
  loginBtnText: "text-xs",
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    loadUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!drawerOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [drawerOpen])

  const signIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: typeof window !== 'undefined' ? window.location.origin : '' },
    })
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <CurrencyProvider user={user}>
    <div className="min-h-screen min-h-[100dvh] bg-black text-white flex flex-col font-sans">
      <NavigationDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        user={user}
        onSignIn={signIn}
        onSignOut={signOut}
      />

      <header className={`w-full ${SIZES.headerPadding} flex flex-row justify-between items-center shrink-0 border-b border-zinc-900`}>
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className={`${SIZES.drawerBtnPadding} -ml-2 rounded-lg border border-zinc-800 hover:bg-zinc-900 transition-colors`}
            aria-label="Open navigation menu"
            aria-expanded={drawerOpen}
          >
            <svg className={SIZES.drawerIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-4 sm:gap-6 ml-2 sm:ml-6">
            <Link
              href="/"
              className={`${SIZES.logoText} font-black tracking-tighter text-white hover:text-zinc-300 transition-colors`}
            >
              ALEAGO
            </Link>
            <div className="flex items-center gap-3 sm:gap-4 text-base sm:text-lg">
              <Link href="/inventory" className="group flex items-center h-10 sm:h-12 bg-zinc-900 border border-zinc-800 rounded-full hover:bg-zinc-800 active:scale-95 transition-all shadow-md" title="Inventory">
                <div className="w-10 sm:w-12 h-full flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110">
                  🎒
                </div>
                <div className="grid grid-cols-[0fr] group-hover:grid-cols-[1fr] transition-all duration-300 ease-out">
                  <div className="overflow-hidden whitespace-nowrap">
                    <span className="pr-4 sm:pr-5 text-[10px] sm:text-xs font-black uppercase tracking-widest text-zinc-300">
                      Inventory
                    </span>
                  </div>
                </div>
              </Link>
              <Link href="/games" className="group flex items-center h-10 sm:h-12 bg-zinc-900 border border-zinc-800 rounded-full hover:bg-zinc-800 active:scale-95 transition-all shadow-md" title="Games">
                <div className="w-10 sm:w-12 h-full flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110">
                  🎮
                </div>
                <div className="grid grid-cols-[0fr] group-hover:grid-cols-[1fr] transition-all duration-300 ease-out">
                  <div className="overflow-hidden whitespace-nowrap">
                    <span className="pr-4 sm:pr-5 text-[10px] sm:text-xs font-black uppercase tracking-widest text-zinc-300">
                      Games
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {user && <CurrencyDisplay user={user} />}
          {!user && (
            <button
              type="button"
              onClick={signIn}
              className={`bg-white text-black ${SIZES.loginBtnPadding} rounded-full font-bold ${SIZES.loginBtnText} tracking-widest hover:bg-zinc-200 transition-colors`}
            >
              LOGIN
            </button>
          )}
        </div>
      </header>

      {children}
    </div>
    </CurrencyProvider>
  )
}
