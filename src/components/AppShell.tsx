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
          <Link
            href="/"
            className={`${SIZES.logoText} font-black tracking-tighter text-white hover:text-zinc-300 transition-colors`}
          >
            ALEAGO
          </Link>
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
