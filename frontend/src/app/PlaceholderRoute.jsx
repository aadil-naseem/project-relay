import { useHealth } from '../api/hooks/useHealth'
import { TitleBlock } from '../components/TitleBlock'

export function PlaceholderRoute({ number, title, route }) {
  const health = useHealth()
  const status = health.data?.status === 'ok' ? 'ok' : health.isError ? 'error' : 'checking'

  return (
    <div className="f0-shell">
      <header className="f0-status-strip">
        <a className="f0-brand" href="/">RELAY</a>
        <div className="f0-factory">Sample Precision Components · Ambattur</div>
        <div className="f0-status-meta">
          <span className="f0-stamp">SAMPLE / SIMULATED</span>
          <span className="f0-health" data-state={status} role="status">
            <i className="f0-health-dot" aria-hidden="true" />
            {status === 'ok' ? 'API ONLINE' : status === 'error' ? 'API OFFLINE' : 'CHECKING API'}
          </span>
        </div>
      </header>
      <main className="f0-content">
        <div className="f0-kicker">FOUNDATION · {number}</div>
        <h1>{title}</h1>
        <p>This route is wired for the RELAY screen build. The screen design will be added one at a time.</p>
        <section className="f0-panel" aria-label="Route information">
          <div className="f0-mono">ROUTE · {route}</div>
          <p className="f0-error">
            {health.isError
              ? `Backend unavailable · ${health.error.code || 'CONNECTION_ERROR'}`
              : health.data
                ? `Backend status: ${health.data.status} · weather: ${health.data.weather_mode}`
                : 'Checking backend health…'}
          </p>
        </section>
      </main>
      <TitleBlock />
    </div>
  )
}
