const risk = {
  LOW: { label: 'Low', tone: 'sky', glyph: '●', shape: 'ring' },
  MODERATE: { label: 'Moderate', tone: 'pale', glyph: '●', shape: 'dot' },
  HIGH: { label: 'High', tone: 'sun', glyph: '▲', shape: 'triangle' },
  SEVERE: { label: 'Severe', tone: 'sun', glyph: '▲!', shape: 'chevron' },
}

const order = {
  ON_TRACK: { label: 'On track', tone: 'sky', glyph: '✓', shape: 'tick' },
  AT_RISK: { label: 'At risk', tone: 'pale', glyph: '◷', shape: 'clock' },
  LATE: { label: 'Late', tone: 'sun', glyph: '⚑', shape: 'flag' },
}

const fallback = {
  READY: { label: 'Ready cover', tone: 'sky', glyph: '⬡', shape: 'shield-solid' },
  POTENTIAL_ONLY: { label: 'Candidate only', tone: 'pale', glyph: '⬡', shape: 'shield-outline' },
  NONE: { label: 'No cover', tone: 'gold', glyph: '⊗', shape: 'shield-cross' },
}

const backup = {
  READY: { label: 'Ready', tone: 'sky', glyph: '⏚', shape: 'closed-contact' },
  STALE: { label: 'Reconfirm needed', tone: 'sky', glyph: '◷', shape: 'dashed-clock' },
  APPROVAL_PENDING: { label: 'Approval pending', tone: 'pale', glyph: '◐', shape: 'half-circle' },
  ASSESSMENT_IN_PROGRESS: { label: 'Assessing', tone: 'navy-light', glyph: '•••', shape: 'three-dots' },
  POTENTIAL_MATCH: { label: 'Potential', tone: 'hair', glyph: '○', shape: 'ring' },
  UNAVAILABLE_EXPIRED: { label: 'Unavailable', tone: 'navy', glyph: '⏚', shape: 'struck-open-contact' },
}

const confidence = {
  HIGH: { label: 'High confidence', tone: 'sky', bars: 3 },
  MEDIUM: { label: 'Medium confidence', tone: 'pale', bars: 2 },
  LOW: { label: 'Low confidence', tone: 'sun', bars: 1 },
  MISSING: { label: 'Missing', tone: 'hair', bars: 0 },
  CONFIRMED: { label: 'Confirmed by person', tone: 'cream', bars: 3 },
}

const weather = {
  live: { label: 'Live', tone: 'sky', glyph: '●' },
  cache: { label: 'Last good', tone: 'pale', glyph: '●' },
  replay: { label: 'Replay', tone: 'pale', glyph: '↻' },
  synthetic: { label: 'Synthetic', tone: 'gold', glyph: '▧' },
}

export const statusStyle = (kind, value, reason) => {
  const source = { risk, order, fallback, backup, confidence, weather }[kind]
  const item = source?.[value]
  if (!item) return { label: value || 'Unknown', tone: 'hair', glyph: '·', shape: 'unknown' }
  return kind === 'backup' && reason
    ? { ...item, label: `Excluded: ${reason}`, tone: 'gold', glyph: '⏚', shape: 'hatch-navy' }
    : item
}
