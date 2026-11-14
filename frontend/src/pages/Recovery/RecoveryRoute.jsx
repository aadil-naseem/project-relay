import { lazy, Suspense } from 'react'

const Recovery = lazy(() => import('./Recovery'))

export default function RecoveryRoute() {
  return <Suspense fallback={<div className="f0-content">Loading recovery request…</div>}><Recovery /></Suspense>
}
