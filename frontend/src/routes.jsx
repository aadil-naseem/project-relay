import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from './app/AppShell'
import { PlaceholderRoute } from './app/PlaceholderRoute'
import Desk from './pages/Desk/Desk'
import ExposureRoute from './pages/Exposure/ExposureRoute'
import WeakPointsRoute from './pages/WeakPoints/WeakPointsRoute'
import WhatIfRoute from './pages/WhatIf/WhatIfRoute'

// Route configuration is intentionally a non-component export in this module.
// oxlint-disable-next-line react/only-export-components
const ComponentKit = lazy(() => import('./pages/Kit/ComponentKit'))

const appScreens = [
  { path: '', number: 'S1', title: 'Desk', route: '/app' },
  { path: 'passports', number: 'S4', title: 'Passports', route: '/app/passports' },
  { path: 'passports/:id', number: 'S4', title: 'Passport Detail', route: '/app/passports/:id' },
  { path: 'recovery', number: 'S6', title: 'Recovery', route: '/app/recovery' },
  { path: 'recovery/:id', number: 'S6', title: 'Recovery Request', route: '/app/recovery/:id' },
  { path: 'partners', number: 'S7', title: 'Partners & Readiness', route: '/app/partners' },
  { path: 'proof', number: 'S8', title: 'Proof & Method', route: '/app/proof' },
]

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PlaceholderRoute number="S0" title="Landing" route="/" />,
  },
  {
    path: '/app',
    element: <AppShell />,
    children: [
      ...appScreens.map((screen) => ({
        ...(screen.path ? { path: screen.path } : { index: true }),
        element: screen.path === ''
          ? <Desk />
          : <PlaceholderRoute number={screen.number} title={screen.title} route={screen.route} />,
      })),
      { path: 'weak-points', element: <WeakPointsRoute /> },
      { path: 'exposure', element: <ExposureRoute /> },
      { path: 'what-if', element: <WhatIfRoute /> },
      { path: 'what-if/:id', element: <WhatIfRoute /> },
      { path: '_kit', element: <Suspense fallback={<div className="f0-content">Loading component kit…</div>}><ComponentKit /></Suspense> },
      { path: '*', element: <PlaceholderRoute number="S10" title="Line not found" route="*" /> },
    ],
  },
  {
    path: '*',
    element: <PlaceholderRoute number="S10" title="Line not found" route="*" />,
  },
])
