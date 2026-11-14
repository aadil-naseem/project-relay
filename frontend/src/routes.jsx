import { createBrowserRouter } from 'react-router-dom'
import { PlaceholderRoute } from './app/PlaceholderRoute'
import ComponentKit from './pages/Kit/ComponentKit'

const screens = [
  { path: '/', number: 'S0', title: 'Landing', route: '/' },
  { path: '/app', number: 'S1', title: 'Desk', route: '/app' },
  { path: '/app/weak-points', number: 'S2', title: 'Weak Points', route: '/app/weak-points' },
  { path: '/app/exposure', number: 'S3', title: 'Exposure', route: '/app/exposure' },
  { path: '/app/passports', number: 'S4', title: 'Passports', route: '/app/passports' },
  { path: '/app/passports/:id', number: 'S4', title: 'Passport Detail', route: '/app/passports/:id' },
  { path: '/app/what-if', number: 'S5', title: 'What-if', route: '/app/what-if' },
  { path: '/app/what-if/:id', number: 'S5', title: 'Stress Test', route: '/app/what-if/:id' },
  { path: '/app/recovery', number: 'S6', title: 'Recovery', route: '/app/recovery' },
  { path: '/app/recovery/:id', number: 'S6', title: 'Recovery Request', route: '/app/recovery/:id' },
  { path: '/app/partners', number: 'S7', title: 'Partners & Readiness', route: '/app/partners' },
  { path: '/app/proof', number: 'S8', title: 'Proof & Method', route: '/app/proof' },
]

export const router = createBrowserRouter([
  ...screens.map(({ path, ...props }) => ({
    path,
    element: <PlaceholderRoute {...props} />,
  })),
  {
    path: '/app/_kit',
    element: <ComponentKit />,
  },
  {
    path: '*',
    element: <PlaceholderRoute number="S10" title="Line not found" route="*" />,
  },
])
