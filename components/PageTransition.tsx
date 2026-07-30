'use client'

import { usePathname } from 'next/navigation'

// Re-keying on the pathname restarts the enter animation on every navigation,
// so moving between pages reads as a transition instead of a hard swap.
export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <div key={pathname} className="animate-rise-in">
      {children}
    </div>
  )
}
