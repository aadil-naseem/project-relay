import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '../api/client'
import { queryClient } from '../api/queryClient'
import { useHealth } from '../api/hooks/useHealth'
import { DataLabelBadge, ShiftClock, StackLight, WeatherSourceBadge } from '../components/domain'
import { Button, Drawer, Kbd } from '../components/primitives'

const navItems = [
  { path: '/app', label: 'Desk', glyph: '▦' },
  { path: '/app/weak-points', label: 'Weak points', glyph: '⊗' },
  { path: '/app/exposure', label: 'Exposure', glyph: '≋' },
  { path: '/app/passports', label: 'Passports', glyph: '▤' },
  { path: '/app/what-if', label: 'What-if', glyph: 'ϟ' },
  { path: '/app/recovery', label: 'Recovery', glyph: '⏚' },
  { path: '/app/partners', label: 'Partners', glyph: '◉' },
  { path: '/app/proof', label: 'Proof', glyph: '⌕' },
]

function useIstClock() {
  const [time, setTime] = useState('--:--')
  useEffect(() => {
    const update = () => setTime(new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false,
    }).format(new Date()))
    const timer = window.setInterval(update, 1000)
    update()
    return () => window.clearInterval(timer)
  }, [])
  return time
}

function isEditable(target) {
  return target instanceof HTMLElement
    && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
}

export function AppShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const health = useHealth()
  const demo = useQuery({ queryKey: ['demo-state'], queryFn: () => apiRequest('/demo/state'), staleTime: 30_000 })
  const [railPinned, setRailPinned] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [paletteQuery, setPaletteQuery] = useState('')
  const [stageOpen, setStageOpen] = useState(false)
  const [shutter, setShutter] = useState(false)
  const time = useIstClock()
  const timers = useRef([])

  useEffect(() => () => timers.current.forEach(window.clearTimeout), [])

  const go = useCallback((path) => {
    if (path === location.pathname) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      navigate(path)
      return
    }
    setShutter(true)
    timers.current.push(window.setTimeout(() => {
      navigate(path)
      timers.current.push(window.setTimeout(() => setShutter(false), 320))
    }, 240))
  }, [location.pathname, navigate])

  useEffect(() => {
    const onKeyDown = (event) => {
      if (isEditable(event.target)) return
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setPaletteOpen((open) => !open)
        return
      }
      if (event.key === '/' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault()
        setPaletteOpen(true)
        return
      }
      if (event.key === 'Escape') {
        setPaletteOpen(false)
        setStageOpen(false)
        return
      }
      const number = Number(event.key)
      if (number >= 1 && number <= 8) go(navItems[number - 1].path)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [go])

  const commands = useMemo(() => [
    ...navItems.map((item) => ({ label: `Go to ${item.label}`, detail: item.path, path: item.path })),
    { label: 'Open Stage Controls', detail: 'Drawer', action: () => setStageOpen(true) },
    { label: 'Reset demo', detail: 'Rebuild seeded sample world', action: async () => {
      await apiRequest('/demo/reset', { method: 'POST' })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['health'] }),
        queryClient.invalidateQueries({ queryKey: ['demo-state'] }),
      ])
    } },
  ], [])
  const filteredCommands = commands.filter((command) =>
    `${command.label} ${command.detail}`.toLowerCase().includes(paletteQuery.toLowerCase()))

  const runCommand = (command) => {
    setPaletteOpen(false)
    setPaletteQuery('')
    if (command.path) go(command.path)
    else command.action?.()
  }

  const current = navItems.find((item) => item.path === location.pathname)
    || navItems.find((item) => location.pathname.startsWith(`${item.path}/`))
  const healthState = health.data?.status === 'ok' ? 'ok' : health.isError ? 'error' : 'checking'
  return (
    <div className={`relay-app ${railPinned ? 'rail-pinned' : ''}`}>
      <header className="relay-status-strip">
        <button className="relay-wordmark" type="button" onClick={() => go('/')}>RELAY</button>
        <span className="relay-factory-name">Sample Precision Components · Ambattur</span>
        <div className="relay-status-strip__right">
          <ShiftClock time={time} />
          <DataLabelBadge />
          <WeatherSourceBadge
            source={health.data?.weather_mode === 'live' ? 'live' : demo.data?.weather_mode || health.data?.weather_mode || 'replay'}
            degraded={Boolean(demo.isError || health.isError)}
          />
          <span className="relay-health" data-state={healthState} role="status">
            <i aria-hidden="true" />{healthState === 'ok' ? 'API' : healthState === 'error' ? 'OFFLINE' : 'CHECK'}
          </span>
          <StackLight exposure="SEVERE" readiness={54} freshness={demo.data?.weather_mode || 'replay'} />
          <Button variant="ghost" size="small" onClick={() => setStageOpen(true)}>Stage <Kbd>`</Kbd></Button>
          <Button variant="ghost" size="small" aria-label="Open command palette" onClick={() => setPaletteOpen(true)}><Kbd>⌘K</Kbd></Button>
        </div>
      </header>

      <aside
        className="relay-rail"
        data-pinned={railPinned}
        onMouseEnter={() => !railPinned && document.body.classList.add('relay-rail-hover')}
        onMouseLeave={() => document.body.classList.remove('relay-rail-hover')}
      >
        <button className="relay-rail__pin" type="button" onClick={() => setRailPinned((value) => !value)} aria-label={railPinned ? 'Collapse navigation' : 'Pin navigation'}>
          <span aria-hidden="true">R</span><span className="relay-rail__label">RELAY</span>
        </button>
        <nav aria-label="Main navigation">
          {navItems.map((item, index) => (
            <button
              key={item.path}
              type="button"
              className={`relay-rail__item ${current?.path === item.path ? 'is-active' : ''}`}
              aria-current={current?.path === item.path ? 'page' : undefined}
              onClick={() => go(item.path)}
              title={item.label}
            >
              <span className="relay-rail__glyph" aria-hidden="true">{item.glyph}</span>
              <span className="relay-rail__label">{item.label}</span>
              <Kbd>{index + 1}</Kbd>
            </button>
          ))}
        </nav>
      </aside>

      <div className="relay-mobile-nav" aria-label="Mobile navigation">
        {navItems.slice(0, 5).map((item) => (
          <button key={item.path} type="button" aria-label={item.label} aria-current={current?.path === item.path ? 'page' : undefined} onClick={() => go(item.path)}>
            <span aria-hidden="true">{item.glyph}</span><small>{item.label}</small>
          </button>
        ))}
        <button type="button" aria-label="More controls" onClick={() => setStageOpen(true)}><span aria-hidden="true">···</span><small>More</small></button>
      </div>

      <div className="relay-app__main">
        {current && location.pathname !== current.path && (
          <div className="relay-breadcrumb" aria-label="Breadcrumb">
            <button type="button" onClick={() => go(current.path)}>{current.label}</button>
            <span aria-hidden="true">/</span><span>{location.pathname.split('/').filter(Boolean).at(-1)}</span>
          </div>
        )}
        <Outlet />
      </div>

      <div className={`relay-shutter ${shutter ? 'is-closed' : ''}`} aria-hidden="true">
        <i /><i />
      </div>

      <CommandPalette
        open={paletteOpen}
        value={paletteQuery}
        commands={filteredCommands}
        onChange={setPaletteQuery}
        onClose={() => setPaletteOpen(false)}
        onRun={runCommand}
      />
      <Drawer open={stageOpen} title="Stage Controls" onClose={() => setStageOpen(false)}>
        <p>Presenter controls, weather switching, reset and snapshot options arrive in F7.</p>
        <p className="relay-mono">Current mode · {demo.data?.weather_mode || health.data?.weather_mode || 'checking'}</p>
      </Drawer>
    </div>
  )
}

function CommandPalette({ open, value, commands, onChange, onClose, onRun }) {
  const input = useRef(null)
  useEffect(() => {
    if (open) input.current?.focus()
  }, [open])
  if (!open) return null
  return (
    <div className="relay-command-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="relay-command" role="dialog" aria-modal="true" aria-label="Command palette">
        <label htmlFor="relay-command-input">COMMAND <Kbd>ESC</Kbd></label>
        <input id="relay-command-input" ref={input} value={value} onChange={(event) => onChange(event.target.value)} placeholder="Find a screen or action…" />
        <ul>
          {commands.map((command) => (
            <li key={command.label}><button type="button" onClick={() => onRun(command)}><span>{command.label}</span><small>{command.detail}</small></button></li>
          ))}
          {!commands.length && <li className="relay-command__empty">No matching command.</li>}
        </ul>
      </section>
    </div>
  )
}
