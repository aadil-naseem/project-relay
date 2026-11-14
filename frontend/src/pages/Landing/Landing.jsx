import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../../api/client'
import { DataLabelBadge, Money, WeatherSourceBadge } from '../../components/domain'
import { Button, Nameplate, Stamp } from '../../components/primitives'
import { useUiStore } from '../../store/ui'
import fallbackStory from '../../data/story.fallback.json'
import { useSceneTier } from './useSceneTier'
import './landing.css'

const HeroScene = lazy(() => import('../../scene/HeroScene'))

export default function Landing() {
  const navigate = useNavigate()
  const tier = useSceneTier()
  const reduceMotion = useUiStore((state) => state.reduceMotion)
  const [performanceLimitedTier, setPerformanceLimitedTier] = useState(null)
  const [pointer, setPointer] = useState({ x: 0, y: 0 })
  const [storyNotice, setStoryNotice] = useState(false)
  const pointerFrame = useRef(0)
  const dashboard = useQuery({
    queryKey: ['dashboard', 'fac_owner'],
    queryFn: () => apiRequest('/dashboard/fac_owner'),
    staleTime: 30_000,
  })
  const stressId = dashboard.data?.alert?.stress_test_id
  const stress = useQuery({
    queryKey: ['stress-test', stressId],
    queryFn: () => apiRequest(`/stress-tests/${stressId}`),
    enabled: Boolean(stressId),
    staleTime: 30_000,
  })
  const demoState = useQuery({
    queryKey: ['demo-state'],
    queryFn: () => apiRequest('/demo/state'),
    staleTime: 30_000,
  })

  const showingFallback = dashboard.isError || (Boolean(stressId) && stress.isError)
  const spof = showingFallback ? fallbackStory.spof : dashboard.data?.spof_top?.[0]
  const summary = showingFallback ? fallbackStory.stress : stress.data?.summary
  const alert = showingFallback ? fallbackStory.alert : dashboard.data?.alert
  const weatherMode = showingFallback
    ? fallbackStory.weather_mode
    : dashboard.data?.weather?.mode || demoState.data?.weather_mode || 'replay'
  const weatherSource = showingFallback
    ? fallbackStory.weather_mode
    : dashboard.data?.weather?.source || weatherMode
  const replayEvent = (showingFallback
    ? fallbackStory.replay_event
    : demoState.data?.replay_event || 'michaung_2023').replaceAll('_', ' ').toUpperCase()
  const spofOrderCount = Array.isArray(spof?.orders_broken)
    ? spof.orders_broken.length
    : spof?.orders_broken
  const renderTier = performanceLimitedTier === tier && tier === 'full' ? 'lite' : tier
  const pointerEnabled = !reduceMotion
    && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    && !window.matchMedia('(pointer: coarse)').matches

  useEffect(() => () => window.cancelAnimationFrame(pointerFrame.current), [])

  const updatePointer = (event) => {
    if (!pointerEnabled || event.pointerType !== 'mouse') return
    const bounds = event.currentTarget.getBoundingClientRect()
    const nextPointer = {
      x: ((event.clientX - bounds.left) / bounds.width - 0.5) * 2,
      y: ((event.clientY - bounds.top) / bounds.height - 0.5) * 2,
    }
    window.cancelAnimationFrame(pointerFrame.current)
    pointerFrame.current = window.requestAnimationFrame(() => {
      setPointer(nextPointer)
      pointerFrame.current = 0
    })
  }

  const storyCta = () => setStoryNotice(true)
  const openDesk = () => navigate('/app')
  const openProof = () => navigate('/app/proof')

  return (
    <main className="landing-page">
      <header className="landing-nav">
        <button className="landing-nav__brand" type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          RELAY <span>FACTORY CONTINUITY DESK</span>
        </button>
        <nav aria-label="Landing navigation">
          <button type="button" onClick={storyCta}>Story</button>
          <button type="button" onClick={openProof}>How it works</button>
          <button type="button" onClick={openProof}>Proof</button>
        </nav>
        <Button onClick={openDesk}>Open the desk <span aria-hidden="true">↗</span></Button>
      </header>

      <section
        className="landing-hero"
        id="hero"
        data-tier={renderTier}
        onPointerMove={updatePointer}
        onPointerLeave={() => setPointer({ x: 0, y: 0 })}
        style={{
          '--headline-x': `${-pointer.x * 14}px`,
          '--headline-y': `${-pointer.y * 8}px`,
        }}
        aria-labelledby="landing-title"
      >
        <div className="landing-sky" aria-hidden="true" />
        <Skyline />
        <div className="landing-headline">
          <h1 id="landing-title">FIND WHERE YOU BREAK</h1>
        </div>

        <StaticYard />
        {(renderTier === 'full' || renderTier === 'lite') && (
          <div className="landing-canvas" aria-hidden="true">
            <Suspense fallback={null}>
              <HeroScene
                tier={renderTier}
                pointer={pointerEnabled ? pointer : { x: 0, y: 0 }}
                onDecline={() => setPerformanceLimitedTier(tier)}
              />
            </Suspense>
          </div>
        )}
        <div className={`landing-rain ${renderTier === 'static' ? 'landing-rain--static' : ''}`} aria-hidden="true" />

        <p className="landing-headline__front">before the flood does.</p>

        <aside className="landing-callout landing-callout--weak" aria-label="Top single point of failure">
          <span className="f0-kicker">THE SINGLE BREAK · {spof?.kind?.toUpperCase() || 'SAMPLE RESOURCE'}</span>
          {spof ? (
            <>
              <h2>{spof.name}</h2>
              <p><b>{spofOrderCount} {spofOrderCount === 1 ? 'order depends' : 'orders depend'}</b> on this resource.</p>
              <div className="landing-callout__value"><Money value={spof.revenue_at_risk_inr} /><small>at risk if it stops</small></div>
            </>
          ) : dashboard.isLoading ? (
            <p className="landing-loading">Checking the replay sample…</p>
          ) : (
            <p>Open the Desk to inspect the live dependency graph.</p>
          )}
          <div className="landing-callout__actions">
            <Button onClick={openDesk}>Open the desk</Button>
            <Button variant="ghost" onClick={storyCta}>Watch the story</Button>
          </div>
        </aside>

        <aside className="landing-callout landing-callout--exposure" aria-label="Current replay exposure">
          <div className="landing-callout__meta">
            <span className="f0-kicker">STORM WINDOW</span>
            {showingFallback
              ? <Nameplate>SAVED REPLAY · NOT LIVE</Nameplate>
              : <WeatherSourceBadge source={weatherSource} degraded={Boolean(dashboard.data?.weather?.degraded)} />}
          </div>
          {alert?.active ? (
            <>
              <h2>{alert.onset_in_hours == null ? 'Rain alert active' : `Heavy rain in ${Math.round(alert.onset_in_hours)} h`}</h2>
              {summary ? (
                <div className="landing-callout__exposure">
                  <Money value={summary.revenue_exposed_inr} />
                  <span>{summary.orders_at_risk} orders at risk</span>
                </div>
              ) : (
                <p className="landing-loading">Loading the auto stress test…</p>
              )}
            </>
          ) : (
            <h2>{dashboard.isLoading ? 'Reading the replay…' : 'No active rain alert'}</h2>
          )}
          <p className="landing-callout__fine">RISK INDICATOR · NOT A FLOOD MODEL</p>
          <DataLabelBadge />
        </aside>

        <nav className="landing-chapter-rail" aria-label="Story chapters">
          <ol>
            {[
              ['00', 'FIND'],
              ['01', 'DIAGNOSE'],
              ['02', 'THREAT'],
              ['03', 'RELAY'],
              ['04', 'READY'],
            ].map(([number, label], index) => (
              <li className={index === 0 ? 'is-active' : ''} key={number}>
                <span>{number}</span><b>{label}</b>
              </li>
            ))}
          </ol>
        </nav>

        <div className="landing-source-line">
          <span>CHENNAI · {replayEvent}</span>
          <span>{showingFallback ? 'SAVED REPLAY VALUES' : `${weatherMode.toUpperCase()} MODE`}</span>
          <span>{showingFallback ? `LAST VERIFIED ${new Date(fallbackStory.captured_at_utc).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })}` : 'SAMPLE / SIMULATED'}</span>
        </div>

        <button className="landing-scroll-cue" type="button" onClick={storyCta}>
          <span aria-hidden="true">↓</span> SCROLL TO FOLLOW THE STORY
        </button>
        {storyNotice && (
          <div className="landing-story-notice" role="status">
            <span>The scroll chapters are coming next. The live Desk is ready now.</span>
            <button type="button" aria-label="Dismiss story notice" onClick={() => setStoryNotice(false)}>×</button>
          </div>
        )}
        <div className="landing-tier-label" aria-label={`Scene quality ${renderTier}`}>
          SCENE TIER · {renderTier.toUpperCase()}
        </div>
        <Stamp tone="gold" className="landing-sample-stamp">SAMPLE / SIMULATED</Stamp>
      </section>
    </main>
  )
}

function Skyline() {
  return (
    <svg className="landing-skyline" viewBox="0 0 1600 520" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <path className="landing-skyline__far" d="M0 312h70v-74h42v30h44v-93h37v36h42v101h48v-65h32v-97h36v31h36v131h61v-86h51v44h38v-127h36v28h36v141h63v-69h43v-34h44v103h65v-118h34v-59h42v39h48v138h58v-80h44v24h43v-133h38v38h44v151h73v-103h43v35h58v-89h43v36h57v123h69v-141h41v65h51v76h44v-52h66v52H0Z" />
      <path className="landing-skyline__near" d="M0 365h108v-50h69v50h98v-79h51v30h83v49h94v-63h62v63h89v-97h54v37h69v60h116v-74h49v32h67v42h83v-52h67v52h83v-84h53v30h61v54h112v-65h58v65h97v-42h54v42h86v155H0Z" />
      <g className="landing-skyline__lines">
        <path d="M274 315v-75m0 20-33-18m33 37 37-26M836 268v-85m0 30-36-21m36 41 38-24M1260 311v-65m0 21-34-19m34 37 31-24" />
        <path d="M285 240h-20m581-57h-22m427 63h-18" />
      </g>
    </svg>
  )
}

function StaticYard() {
  const buildings = [
    { x: 95, y: 285, scale: 0.48 }, { x: 292, y: 275, scale: 0.53 }, { x: 510, y: 270, scale: 0.56 },
    { x: 795, y: 274, scale: 0.54 }, { x: 1032, y: 282, scale: 0.50 }, { x: 1278, y: 289, scale: 0.46 },
    { x: 36, y: 364, scale: 0.63 }, { x: 238, y: 354, scale: 0.69 }, { x: 445, y: 350, scale: 0.74 },
    { x: 747, y: 349, scale: 0.72, lit: true }, { x: 1017, y: 354, scale: 0.68 }, { x: 1275, y: 365, scale: 0.62 },
    { x: 130, y: 434, scale: 0.82 }, { x: 404, y: 424, scale: 0.88 }, { x: 1005, y: 427, scale: 0.86 },
  ]

  return (
    <svg className="landing-yard" viewBox="0 0 1600 600" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <radialGradient id="landing-bay-glow">
          <stop offset="0" stopColor="var(--c-sun)" stopOpacity=".42" />
          <stop offset="1" stopColor="var(--c-sun)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path className="landing-yard__ground" d="M0 425 800 220l800 205v175H0Z" />
      <path className="landing-yard__perspective" d="M800 220 0 600m800-380 270 380m-270-380 800 380M0 466h1600M0 522h1600M0 567h1600" />
      {buildings.map((building) => (
        <g
          key={`${building.x}-${building.y}`}
          className={`landing-bay ${building.lit ? 'is-lit' : ''}`}
          transform={`translate(${building.x} ${building.y}) scale(${building.scale})`}
        >
          {building.lit && <ellipse className="landing-bay__glow" cx="74" cy="81" rx="156" ry="115" fill="url(#landing-bay-glow)" />}
          <path className="landing-bay__side" d="M0 26 78 0v103l-78 30Z" />
          <path className="landing-bay__face" d="M78 0 156 26v103l-78-26Z" />
          <path className="landing-bay__roof" d="M0 26 28 3l25 16 25-19 26 19 25-18 27 25-78-26Z" />
          <path className="landing-bay__seams" d="M14 25v97m22-104v98m47-85v83m25-75v78m25-72v81" />
          <rect className="landing-bay__door" x="97" y="49" width="37" height="55" />
          <path className="landing-bay__doorline" d="M103 54v45m7-45v45m7-45v45m7-45v45m7-45v45" />
          <path className="landing-bay__window" d="M17 54h41v21H17z" />
          <path className="landing-bay__light" d="M20 58h35v13H20z" />
        </g>
      ))}
      <g className="landing-yard__crane">
        <path d="M473 243V80h452v163M470 80h464m-247 0v91m-16 0h32m-25 0v69" />
        <path className="landing-yard__hook" d="M678 240v22q0 17 13 17t13-17v-10" />
        <path className="landing-yard__trolley" d="M656 75h49v16h-49z" />
      </g>
      <circle className="landing-yard__anchor" cx="820" cy="421" r="6" />
    </svg>
  )
}
