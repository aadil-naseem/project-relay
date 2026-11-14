import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from './app/AppShell'
import { PlaceholderRoute } from './app/PlaceholderRoute'
import ComponentKit from './pages/Kit/ComponentKit'

const appScreens = [
  { path: '', number: 'S1', title: 'Desk', route: '/app' },
  { path: 'weak-points', number: 'S2', title: 'Weak Points', route: '/app/weak-points' },
  { path: 'exposure', number: 'S3', title: 'Exposure', route: '/app/exposure' },
  { path: 'passports', number: 'S4', title: 'Passports', route: '/app/passports' },
  { path: 'passports/:id', number: 'S4', title: 'Passport Detail', route: '/app/passports/:id' },
  { path: 'what-if', number: 'S5', title: 'What-if', route: '/app/what-if' },
  { path: 'what-if/:id', number: 'S5', title: 'Stress Test', route: '/app/what-if/:id' },
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
        element: <PlaceholderRoute number={screen.number} title={screen.title} route={screen.route} />,
      })),
      { path: '_kit', element: <ComponentKit /> },
      { path: '*', element: <PlaceholderRoute number="S10" title="Line not found" route="*" /> },
    ],
  },
  {
    path: '*',
    element: <PlaceholderRoute number="S10" title="Line not found" route="*" />,
  },
])
