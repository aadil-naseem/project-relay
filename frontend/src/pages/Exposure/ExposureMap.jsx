import { useMemo, useState } from 'react'
import { Circle, CircleMarker, MapContainer, Polyline, TileLayer, Tooltip } from 'react-leaflet'
import geometry from '../../data/exposureGeometry.json'
import { Frame } from '../../components/primitives'

const palette = {
  LOW: 'var(--c-sky)',
  MODERATE: 'var(--c-pale)',
  HIGH: 'var(--c-sun)',
  SEVERE: 'var(--c-sun)',
}

export function ExposureMap({ points, routeRisks = [], selectedSiteId, onSelect, mode }) {
  const [tilesFailed, setTilesFailed] = useState(false)
  const routeRiskById = useMemo(() => new Map(routeRisks.map((route) => [route.route_id, route])), [routeRisks])
  const bounds = useMemo(() => {
    const coords = points.map((point) => [point.lat, point.lon])
    if (!coords.length) return [[13.1, 80.15], [13.1, 80.15]]
    return coords
  }, [points])

  return (
    <Frame className="exposure-map-frame">
      <MapContainer
        className={`exposure-map ${tilesFailed ? 'tiles-failed' : ''}`}
        bounds={bounds}
        boundsOptions={{ padding: [32, 32] }}
        scrollWheelZoom
        zoomControl
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
          eventHandlers={{ tileerror: () => setTilesFailed(true), tileload: () => setTilesFailed(false) }}
        />
        {geometry.zones.map((zone) => (
          <Circle
            key={zone.id}
            center={[zone.center_lat, zone.center_lon]}
            radius={zone.radius_m}
            pathOptions={{
              color: 'var(--c-gold)',
              fillColor: 'var(--c-sun)',
              fillOpacity: 0.12,
              weight: 2,
              dashArray: '6 5',
            }}
          >
            <Tooltip>{zone.name} · illustrative planning zone, not an official flood map</Tooltip>
          </Circle>
        ))}
        {geometry.routes.map((route) => {
          const risk = routeRiskById.get(route.route_id)?.route_risk
          return (
            <Polyline
              key={route.route_id}
              positions={route.samples.map((sample) => [sample.lat, sample.lon])}
              pathOptions={{
                color: risk == null ? 'var(--c-sky)' : risk >= 50 ? 'var(--c-sun)' : 'var(--c-sky)',
                opacity: 0.85,
                weight: 3,
                dashArray: risk == null ? '5 5' : undefined,
              }}
            >
              <Tooltip>{route.exit_name} · route risk {risk ?? 'unavailable'}</Tooltip>
            </Polyline>
          )
        })}
        {points.map((point) => (
          <CircleMarker
            key={point.site_id}
            center={[point.lat, point.lon]}
            radius={point.role === 'OWNER' ? 9 : 6}
            pathOptions={{
              color: palette[point.risk_level] || 'var(--c-sky)',
              fillColor: palette[point.risk_level] || 'var(--c-sky)',
              fillOpacity: 0.9,
              weight: selectedSiteId === point.site_id ? 4 : 2,
            }}
            eventHandlers={{ click: () => onSelect(point.site_id) }}
          >
            <Tooltip direction="top">{point.name} · {point.site_risk}/100 · {point.risk_level}</Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
      {tilesFailed && <div className="exposure-map__offline" role="status">MAP TILES UNAVAILABLE · VECTOR OVERLAYS ACTIVE</div>}
      <div className="exposure-map__badge">
        {mode?.toUpperCase() || 'WEATHER'} · RISK INDICATOR, NOT A FLOOD MODEL
      </div>
    </Frame>
  )
}
