import { lazy, Suspense } from 'react'
import { useParams } from 'react-router-dom'

const Passports = lazy(() => import('./Passports'))

export default function PassportsRoute() {
  const { id } = useParams()
  return <Suspense fallback={<div className="f0-content">Loading passport workspace…</div>}><Passports key={id || 'new'} /></Suspense>
}
