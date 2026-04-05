import React, { useState, useEffect, useMemo } from 'react'
import { RefreshCw, TrendingUp, Users, DollarSign, AlertTriangle } from 'lucide-react'
import { fetchAnalyticsSessions } from '../utils/airtable'

const STEP_NAMES = ['Language', 'Event Details', 'Location', 'Services', 'Customization', 'Quote', 'Contact']

// ── Pure computation helpers (exported for tests) ────────────────────────────

export function filterByDateRange(sessions, days) {
  if (!days) return sessions
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  return sessions.filter((s) => new Date(s.startedAt) >= cutoff)
}

export function computeConversionRate(sessions) {
  if (!sessions.length) return 0
  return Math.round((sessions.filter((s) => s.converted).length / sessions.length) * 100)
}

export function computeAvgQuote(sessions) {
  const converted = sessions.filter((s) => s.converted && s.quoteTotal > 0)
  if (!converted.length) return null
  return Math.round(converted.reduce((sum, s) => sum + s.quoteTotal, 0) / converted.length)
}

export function computeStepData(sessions) {
  const total      = sessions.length
  const step1Count = sessions.filter((s) => (s.furthestStep ?? 0) >= 1).length
  const baseline   = step1Count > 0 ? step1Count : (total > 0 ? total : 1)

  return STEP_NAMES.map((name, i) => {
    const reached     = sessions.filter((s) => (s.furthestStep ?? 0) >= i).length
    const droppedHere = sessions.filter((s) => (s.furthestStep ?? 0) === i).length
    const dropOffRate = total > 0 ? droppedHere / total : 0
    const reachedPct  = reached / baseline

    const timings = sessions.flatMap((s) => {
      try {
        const ts = JSON.parse(s.stepTimestamps || '{}')
        if (ts[String(i)] && ts[String(i + 1)]) {
          return [new Date(ts[String(i + 1)]) - new Date(ts[String(i)])]
        }
      } catch { /* ignore */ }
      return []
    })
    const avgTime = timings.length >= 3
      ? timings.reduce((a, b) => a + b, 0) / timings.length
      : null

    return { index: i, name, reached, reachedPct, droppedHere, dropOffRate, avgTime, timings }
  })
}

export function computeHighestFriction(stepData) {
  const withDrop = stepData.filter((s) => s.index < 6) // skip terminal step
  const maxDrop  = Math.max(...withDrop.map((s) => s.dropOffRate))
  const maxTime  = Math.max(...withDrop.filter((s) => s.avgTime).map((s) => s.avgTime), 1)

  return withDrop.reduce((best, s) => {
    const normDrop = maxDrop > 0 ? s.dropOffRate / maxDrop : 0
    const normTime = s.avgTime ? s.avgTime / maxTime : 0
    const score    = normDrop * 0.6 + normTime * 0.4
    return score > (best._score ?? -1) ? { ...s, _score: score } : best
  }, {})
}

// ── Mock data (shown when Airtable table is empty) ────────────────────────────

const _D = (daysAgo, hOffset = 0) => new Date(Date.now() - daysAgo * 86400000 - hOffset * 3600000).toISOString()
const _TS = (base, ...stepSecs) => {
  const t = new Date(base).getTime()
  let off = 0
  return JSON.stringify(Object.fromEntries(stepSecs.map((s, i) => { off += s * 1000; return [String(i), new Date(t + off).toISOString()] })))
}

const MOCK_SESSIONS = [
  // Converted leads
  { id:'m1',  startedAt:_D(2),   language:'fi', furthestStep:6, converted:true,  eventType:'wedding',     guestCount:120, location:'Helsinki',  distanceKm:8,  selectedServices:'dj, audio, lighting', quoteTotal:1650, quoteId:'DJP-001', backNavigations:1, stepTimestamps:_TS(_D(2),5,40,55,90,120,60,45) },
  { id:'m2',  startedAt:_D(4),   language:'fi', furthestStep:6, converted:true,  eventType:'corporate',   guestCount:80,  location:'Espoo',     distanceKm:18, selectedServices:'dj, audio',           quoteTotal:980,  quoteId:'DJP-002', backNavigations:0, stepTimestamps:_TS(_D(4),8,35,48,75,95,55,30) },
  { id:'m3',  startedAt:_D(6),   language:'en', furthestStep:6, converted:true,  eventType:'birthday',    guestCount:60,  location:'Tampere',   distanceKm:45, selectedServices:'dj, lighting',        quoteTotal:820,  quoteId:'DJP-003', backNavigations:2, stepTimestamps:_TS(_D(6),6,42,60,85,110,70,40) },
  { id:'m4',  startedAt:_D(8),   language:'fi', furthestStep:6, converted:true,  eventType:'wedding',     guestCount:150, location:'Turku',     distanceKm:55, selectedServices:'dj, audio, lighting', quoteTotal:1920, quoteId:'DJP-004', backNavigations:1, stepTimestamps:_TS(_D(8),4,38,52,80,100,65,35) },
  { id:'m5',  startedAt:_D(11),  language:'fi', furthestStep:6, converted:true,  eventType:'graduation',  guestCount:45,  location:'Vantaa',    distanceKm:12, selectedServices:'dj',                  quoteTotal:560,  quoteId:'DJP-005', backNavigations:0, stepTimestamps:_TS(_D(11),7,30,45,65,85,50,25) },
  { id:'m6',  startedAt:_D(15),  language:'en', furthestStep:6, converted:true,  eventType:'corporate',   guestCount:200, location:'Helsinki',  distanceKm:5,  selectedServices:'dj, audio',           quoteTotal:1100, quoteId:'DJP-006', backNavigations:1, stepTimestamps:_TS(_D(15),5,33,50,70,90,60,28) },
  { id:'m7',  startedAt:_D(19),  language:'fi', furthestStep:6, converted:true,  eventType:'wedding',     guestCount:100, location:'Oulu',      distanceKm:90, selectedServices:'dj, audio, lighting', quoteTotal:1780, quoteId:'DJP-007', backNavigations:0, stepTimestamps:_TS(_D(19),6,36,55,78,105,68,38) },
  // Reached quote step, didn't convert
  { id:'m8',  startedAt:_D(1),   language:'fi', furthestStep:5, converted:false, eventType:'birthday',    guestCount:70,  location:'Helsinki',  distanceKm:10, selectedServices:'dj, audio',           quoteTotal:870,  backNavigations:2, stepTimestamps:_TS(_D(1),5,38,55,82,108,62) },
  { id:'m9',  startedAt:_D(3),   language:'en', furthestStep:5, converted:false, eventType:'corporate',   guestCount:90,  location:'Espoo',     distanceKm:20, selectedServices:'dj',                  quoteTotal:510,  backNavigations:1, stepTimestamps:_TS(_D(3),7,40,58,88,115,72) },
  { id:'m10', startedAt:_D(7),   language:'fi', furthestStep:5, converted:false, eventType:'wedding',     guestCount:130, location:'Tampere',   distanceKm:50, selectedServices:'dj, lighting',        quoteTotal:990,  backNavigations:0, stepTimestamps:_TS(_D(7),6,35,50,75,100,68) },
  // Dropped at contact
  { id:'m11', startedAt:_D(5),   language:'fi', furthestStep:6, converted:false, eventType:'birthday',    guestCount:50,  location:'Helsinki',  distanceKm:7,  selectedServices:'dj',                  quoteTotal:490,  backNavigations:1, stepTimestamps:_TS(_D(5),8,42,60,90,120,75,0) },
  { id:'m12', startedAt:_D(9),   language:'en', furthestStep:6, converted:false, eventType:'graduation',  guestCount:35,  location:'Vantaa',    distanceKm:15, selectedServices:'dj, audio',           quoteTotal:680,  backNavigations:0, stepTimestamps:_TS(_D(9),5,30,48,72,95,58,0) },
  // Dropped at customization (step 4)
  { id:'m13', startedAt:_D(2,3), language:'fi', furthestStep:4, converted:false, eventType:'corporate',   guestCount:110, location:'Helsinki',  distanceKm:3,  selectedServices:'dj, audio',           backNavigations:3, stepTimestamps:_TS(_D(2,3),6,38,55,88,130) },
  { id:'m14', startedAt:_D(3,5), language:'fi', furthestStep:4, converted:false, eventType:'wedding',     guestCount:80,  location:'Espoo',     distanceKm:22, selectedServices:'dj, lighting',        backNavigations:1, stepTimestamps:_TS(_D(3,5),5,35,52,78,110) },
  { id:'m15', startedAt:_D(5,2), language:'en', furthestStep:4, converted:false, eventType:'birthday',    guestCount:40,  location:'Turku',     distanceKm:60, selectedServices:'dj',                  backNavigations:2, stepTimestamps:_TS(_D(5,2),7,40,58,82,125) },
  { id:'m16', startedAt:_D(10),  language:'fi', furthestStep:4, converted:false, eventType:'graduation',  guestCount:60,  location:'Tampere',   distanceKm:48, selectedServices:'dj, audio, lighting', backNavigations:0, stepTimestamps:_TS(_D(10),6,33,50,75,105) },
  { id:'m17', startedAt:_D(14),  language:'fi', furthestStep:4, converted:false, eventType:'corporate',   guestCount:150, location:'Helsinki',  distanceKm:8,  selectedServices:'dj, audio',           backNavigations:4, stepTimestamps:_TS(_D(14),5,37,55,80,120) },
  // Dropped at services (step 3)
  { id:'m18', startedAt:_D(1,2), language:'fi', furthestStep:3, converted:false, eventType:'birthday',    guestCount:30,  location:'Helsinki',  distanceKm:5,  backNavigations:1, stepTimestamps:_TS(_D(1,2),8,42,65,95) },
  { id:'m19', startedAt:_D(4,4), language:'en', furthestStep:3, converted:false, eventType:'wedding',     guestCount:90,  location:'Espoo',     distanceKm:25, backNavigations:0, stepTimestamps:_TS(_D(4,4),6,38,58,88) },
  { id:'m20', startedAt:_D(6,1), language:'fi', furthestStep:3, converted:false, eventType:'corporate',   guestCount:60,  location:'Vantaa',    distanceKm:14, backNavigations:2, stepTimestamps:_TS(_D(6,1),7,40,62,92) },
  { id:'m21', startedAt:_D(12),  language:'fi', furthestStep:3, converted:false, eventType:'graduation',  guestCount:45,  location:'Tampere',   distanceKm:52, backNavigations:0, stepTimestamps:_TS(_D(12),5,35,55,85) },
  { id:'m22', startedAt:_D(16),  language:'en', furthestStep:3, converted:false, eventType:'birthday',    guestCount:55,  location:'Turku',     distanceKm:58, backNavigations:1, stepTimestamps:_TS(_D(16),6,32,50,78) },
  { id:'m23', startedAt:_D(20),  language:'fi', furthestStep:3, converted:false, eventType:'wedding',     guestCount:70,  location:'Helsinki',  distanceKm:10, backNavigations:0, stepTimestamps:_TS(_D(20),7,38,60,90) },
  // Dropped at location (step 2)
  { id:'m24', startedAt:_D(2,6), language:'fi', furthestStep:2, converted:false, eventType:'corporate',   guestCount:100, backNavigations:1, stepTimestamps:_TS(_D(2,6),6,40,65) },
  { id:'m25', startedAt:_D(7,3), language:'fi', furthestStep:2, converted:false, eventType:'birthday',    guestCount:25,  backNavigations:0, stepTimestamps:_TS(_D(7,3),5,35,55) },
  { id:'m26', startedAt:_D(13),  language:'en', furthestStep:2, converted:false, eventType:'wedding',     guestCount:80,  backNavigations:2, stepTimestamps:_TS(_D(13),7,42,68) },
  { id:'m27', startedAt:_D(18),  language:'fi', furthestStep:2, converted:false, eventType:'graduation',  guestCount:40,  backNavigations:0, stepTimestamps:_TS(_D(18),6,38,60) },
  // Dropped early (step 1)
  { id:'m28', startedAt:_D(3,2), language:'fi', furthestStep:1, converted:false, eventType:'birthday',    backNavigations:0, stepTimestamps:_TS(_D(3,2),8,45) },
  { id:'m29', startedAt:_D(9,4), language:'en', furthestStep:1, converted:false, eventType:'corporate',   backNavigations:0, stepTimestamps:_TS(_D(9,4),5,38) },
  { id:'m30', startedAt:_D(22),  language:'fi', furthestStep:1, converted:false, eventType:'wedding',     backNavigations:0, stepTimestamps:_TS(_D(22),6,40) },
]

// ── Subcomponents ─────────────────────────────────────────────────────────────

function Card({ icon: Icon, label, value, sub }) {
  return (
    <div className="rounded-xl p-4 space-y-1" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
      <div className="flex items-center gap-2">
        <Icon size={14} style={{ color: 'var(--color-text-muted)' }} />
        <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-bold text-[var(--color-text)]">{value ?? '—'}</p>
      {sub && <p className="text-xs text-[var(--color-text-muted)]">{sub}</p>}
    </div>
  )
}

// Stubs — replaced in Tasks 7 and 8
function FunnelChart({ stepData, frictionIndex, total }) {
  if (!total) return null
  return (
    <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
      <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-accent)' }}>
        Funnel Drop-off
      </h3>
      <div className="space-y-2">
        {stepData.map(({ index, name, reached, reachedPct, droppedHere }) => (
          <div key={index}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="flex items-center gap-1.5" style={{ color: 'var(--color-text)' }}>
                {index === frictionIndex && <AlertTriangle size={11} style={{ color: 'var(--color-accent)' }} />}
                <span className="text-[var(--color-text-muted)]">Step {index}</span> {name}
              </span>
              <span style={{ color: 'var(--color-text-muted)' }}>
                {reached} <span className="opacity-60">({Math.round(reachedPct * 100)}%)</span>
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.round(reachedPct * 100)}%`,
                  backgroundColor: index === frictionIndex ? 'var(--color-accent)' : 'var(--color-accent-2)',
                }}
              />
            </div>
            {droppedHere > 0 && (
              <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,100,100,0.7)' }}>
                ↗ {droppedHere} left here
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function formatMs(ms) {
  if (ms == null) return null
  if (ms < 60000) return `${Math.round(ms / 1000)}s`
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`
}

function ResistanceChart({ stepData }) {
  const withTime = stepData.filter((s) => s.avgTime != null)
  if (!withTime.length) return null
  const maxTime = Math.max(...withTime.map((s) => s.avgTime))

  return (
    <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
      <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-accent)' }}>
        Avg Time per Step
      </h3>
      <div className="space-y-2">
        {stepData.slice(0, 6).map(({ index, name, avgTime, timings }) => (
          <div key={index}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span style={{ color: 'var(--color-text)' }}>{name}</span>
              <span style={{ color: 'var(--color-text-muted)' }}>
                {timings.length < 3 ? 'insufficient data' : formatMs(avgTime)}
              </span>
            </div>
            {timings.length >= 3 && (
              <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.round((avgTime / maxTime) * 100)}%`,
                    backgroundColor: avgTime === maxTime ? 'var(--color-accent)' : 'var(--color-accent-2)',
                    opacity: 0.8,
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
function BarList({ title, items }) {
  const max = Math.max(...items.map((i) => i.count), 1)
  return (
    <div className="rounded-xl p-4 space-y-3 flex-1" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
      <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-accent)' }}>{title}</h3>
      <div className="space-y-2">
        {items.map(({ label, count, pct }) => (
          <div key={label}>
            <div className="flex justify-between text-xs mb-1">
              <span style={{ color: 'var(--color-text)' }}>{label}</span>
              <span style={{ color: 'var(--color-text-muted)' }}>{Math.round(pct * 100)}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
              <div className="h-full rounded-full" style={{ width: `${Math.round((count / max) * 100)}%`, backgroundColor: 'var(--color-accent-2)' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Breakdowns({ sessions }) {
  const serviceSessions = sessions.filter((s) => s.selectedServices)
  const allServices = serviceSessions.flatMap((s) => s.selectedServices.split(', ').map((x) => x.trim()).filter(Boolean))
  const serviceCounts = Object.entries(
    allServices.reduce((acc, s) => ({ ...acc, [s]: (acc[s] || 0) + 1 }), {})
  ).map(([label, count]) => ({ label, count, pct: serviceSessions.length > 0 ? count / serviceSessions.length : 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)

  const eventSessions = sessions.filter((s) => s.eventType)
  const eventCounts = Object.entries(
    eventSessions.reduce((acc, s) => ({ ...acc, [s.eventType]: (acc[s.eventType] || 0) + 1 }), {})
  ).map(([label, count]) => ({ label, count, pct: eventSessions.length > 0 ? count / eventSessions.length : 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)

  if (!serviceCounts.length && !eventCounts.length) return null

  return (
    <div className="flex gap-3">
      {serviceCounts.length > 0 && <BarList title="Top Services" items={serviceCounts} />}
      {eventCounts.length   > 0 && <BarList title="Event Types"  items={eventCounts}  />}
    </div>
  )
}

function SessionTable({ sessions, page, setPage, pageSize }) {
  const total  = sessions.length
  const pages  = Math.ceil(total / pageSize)
  const slice  = sessions.slice(page * pageSize, (page + 1) * pageSize)

  if (!total) return (
    <div className="text-center py-8 text-sm" style={{ color: 'var(--color-text-muted)' }}>No sessions recorded yet.</div>
  )

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
      <div className="px-4 py-2.5 flex items-center justify-between" style={{ backgroundColor: 'var(--color-surface)' }}>
        <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-accent)' }}>Sessions</h3>
        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{total} total</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--color-border)' }}>
              {['Date', 'Event', 'Services', 'Quote', 'Step', '✓'].map((h) => (
                <th key={h} className="px-3 py-2 text-left font-medium" style={{ color: 'var(--color-text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((s, i) => (
              <tr
                key={s.id || i}
                style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}
              >
                <td className="px-3 py-2" style={{ color: 'var(--color-text-muted)' }}>
                  {s.startedAt ? new Date(s.startedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
                </td>
                <td className="px-3 py-2 capitalize" style={{ color: 'var(--color-text)' }}>{s.eventType || '—'}</td>
                <td className="px-3 py-2" style={{ color: 'var(--color-text-muted)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.selectedServices || '—'}
                </td>
                <td className="px-3 py-2" style={{ color: 'var(--color-text)' }}>
                  {s.quoteTotal > 0 ? `€${s.quoteTotal.toLocaleString()}` : '—'}
                </td>
                <td className="px-3 py-2" style={{ color: 'var(--color-text-muted)' }}>
                  {STEP_NAMES[s.furthestStep] ?? `Step ${s.furthestStep}`}
                </td>
                <td className="px-3 py-2">
                  {s.converted && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold" style={{ backgroundColor: 'rgba(110,231,183,0.15)', color: 'var(--color-success)' }}>
                      Lead
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between px-4 py-2.5" style={{ backgroundColor: 'var(--color-surface)', borderTop: '1px solid var(--color-border)' }}>
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="text-xs disabled:opacity-40"
            style={{ color: 'var(--color-accent)' }}
          >
            ← Prev
          </button>
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {page + 1} / {pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
            disabled={page === pages - 1}
            className="text-xs disabled:opacity-40"
            style={{ color: 'var(--color-accent)' }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function AnalyticsTab() {
  const [allSessions, setAllSessions] = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)
  const [dateRange, setDateRange]     = useState(30)
  const [page, setPage]               = useState(0)
  const PAGE_SIZE = 20

  const load = () => {
    setLoading(true)
    setError(null)
    fetchAnalyticsSessions()
      .then(setAllSessions)
      .catch((e) => setError(e.message || 'Failed to load analytics'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const isMock    = !loading && allSessions.length === 0
  const source    = isMock ? MOCK_SESSIONS : allSessions
  const sessions  = useMemo(() => filterByDateRange(source, dateRange), [source, dateRange])
  const stepData  = useMemo(() => computeStepData(sessions), [sessions])
  const friction  = useMemo(() => computeHighestFriction(stepData), [stepData])
  const convRate  = computeConversionRate(sessions)
  const avgQuote  = computeAvgQuote(sessions)

  const DATE_OPTIONS = [
    { label: '7d',  value: 7  },
    { label: '30d', value: 30 },
    { label: '90d', value: 90 },
    { label: 'All', value: 0  },
  ]

  if (loading) return (
    <div className="py-16 flex items-center justify-center">
      <RefreshCw size={20} className="animate-spin" style={{ color: 'var(--color-text-muted)' }} />
    </div>
  )

  if (error) return (
    <div className="py-12 text-center space-y-3">
      <p className="text-sm text-red-400">{error}</p>
      <button onClick={load} className="text-xs underline" style={{ color: 'var(--color-accent)' }}>Retry</button>
    </div>
  )

  return (
    <div className="space-y-5 pb-8">
      {/* Demo data banner */}
      {isMock && (
        <div className="px-3 py-2 rounded-lg text-xs flex items-center gap-2" style={{ backgroundColor: 'rgba(232,184,75,0.1)', border: '1px solid rgba(232,184,75,0.3)', color: 'var(--color-accent)' }}>
          <span>⚗️</span>
          <span>Demo data — no real sessions yet. This preview disappears once users start the quote flow.</span>
        </div>
      )}

      {/* Date range filter */}
      <div className="flex gap-1">
        {DATE_OPTIONS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => { setDateRange(value); setPage(0) }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={dateRange === value
              ? { backgroundColor: 'var(--color-accent)', color: '#0a130c' }
              : { backgroundColor: 'var(--color-surface)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }
            }
          >
            {label}
          </button>
        ))}
        <button onClick={load} className="ml-auto p-1.5 rounded-lg" style={{ color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }} title="Refresh">
          <RefreshCw size={13} />
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card icon={Users}         label="Sessions"    value={sessions.length} />
        <Card icon={TrendingUp}    label="Conv. Rate"  value={`${convRate}%`} sub={`${sessions.filter(s=>s.converted).length} leads`} />
        <Card icon={DollarSign}    label="Avg Quote"   value={avgQuote ? `€${avgQuote.toLocaleString()}` : '—'} sub="converted only" />
        <Card icon={AlertTriangle} label="Top Friction" value={friction.name ?? '—'} sub={friction.index != null ? `Step ${friction.index}` : ''} />
      </div>

      {/* Charts and table — stubs for now */}
      <FunnelChart stepData={stepData} frictionIndex={friction.index} total={sessions.length} />
      <ResistanceChart stepData={stepData} />
      <Breakdowns sessions={sessions} />
      <SessionTable sessions={sessions} page={page} setPage={setPage} pageSize={PAGE_SIZE} />
    </div>
  )
}
