'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, type PanInfo } from 'motion/react'
import { toast, Toaster } from 'sonner'
import { X, Bell } from 'lucide-react'

/* ════════════════════════════════════════════════════════════════
   AURORA — LEFT DESKTOP WIDGET RAIL
   Fully self-contained: Card Stack + Shader Reminder (top row),
   Clock + Calendar (below, width-matched to the card stack).
   Drop into components/desktop/WidgetRail.tsx, render it in
   Desktop.tsx. Only extra dependency: `npm install sonner`.
   ════════════════════════════════════════════════════════════════ */

/* All widgets in this rail share one target width so the card stack,
   clock, and calendar line up visually. Change this one number to
   resize the whole left column. */
const RAIL_WIDTH = 180

/* ──────────────────────────────────────────────────────────────
   CARD STACK IMAGES — swap these any time.
   Each entry is a data URI, a normal URL, or a /public path.
   ────────────────────────────────────────────────────────────── */
const CARD_IMAGES: string[] = [
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAAAAAAD/2wBDAAoHBwgHBgoICAgLCgoLDhgQDg0NDh0VFhEYIx8lJCIfIiEmKzcvJik0KSEiMEExNDk7Pj4+JS5ESUM8SDc9Pjv/2wBDAQoLCw4NDhwQEBw7KCIoOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozv/wAARCAFoAQQDASIAAhEBAxEB/8QAGgAAAwEBAQEAAAAAAAAAAAAAAAECAwQFBv/EABwQAQEBAQEBAQEBAAAAAAAAAAABEQISITEDQf/EABoBAAMBAQEBAAAAAAAAAAAAAAECAwAEBQb/xAAaEQEBAQEBAQEAAAAAAAAAAAAAARECEgMT/9oADAMBAAIRAxEAPwD0fBzhv4OcO3XKw8Dw38HOA0WHg5w38Dw2sx8HOG3k5y2tjKcHOGs5VOQ0cZThU5aTk5A0ZETk5yrDDTzkpBhlpbVJwAWptJqvPCtT6Tek3ourc8KvSb0m9IvRdW54Xek3pF6LQ1WcqtLU6NBSQwUVIDCKkOcr55Etpc8tOeT54a88GkQ67TOfgbzj4DYh+jl8jy0wY6NebiPJ+V4MbRxHk/KsMNHyjDxWANNOSkGGNDTTgsA0tDVJwelqbU3ouqzhd6TekXpN6Lq3PzXekXpF6Tei6tzwu9JvSL0n0XVZwu9J9J0tA85VpaWmxsOHIJF8xgtKRpzyOeWvPIyJddJ54a88K54a88Gkc3f0LnhrzwrnhpzypI4+/omcfA1wHxz/AKPPwGG1TyCMg005Mhpa2mnJlpaWl084VqdLU2hqk4Vam9JtTei6rOFXpN6TekXoNV54Vek3pN6TaXVZyd6TeitToKTlWlqdGseRWhMpwBxUVIUXGJT5jTmJ5jXmGiPVVzy155TzG3MNI5u+lccteeU8xrzFJHH30fMXIIakjj66AGg+Ja84aWlqGvUnJ6NTo0NNOT0tLU6GnnKtTaWlaGnnJ2ptK1NoarOTtTaVqbQUnItTaLUWgrIdqbStK0DyDS0tLQPIejU6NYcWqIlOUAxpGnLKVfNEljblryw5rXmmiHUb8tuWHFa8U8cncb8teWPNa81SOLuNIaZVKRy9QgYOk8vS0tLXK9uQ9LS0tA85PS1OloHnJ2laVqdA85O1NpaVoKSHam0rU2geQWptFqdZSQ7U2i1OgeQaWjU6xpD09To0BxWqlZ6crBjWVfNYyrlYtjfnprz05uemnPQxHrl1c9NeenLz0256PK5u+HVz0256cnPTbnpSVx98OnmrlYc9NOapK4++GgKUG1Dy8fS1Olrne5IrStTpWgpOT0rU3or0B5ydpWpvSb0B5yq9Fek6m9AeRVqbS1NoHkPStTpXpjSHaVqdLWNIejU6WsbFaWp0awrlEqdEoNjSVUrKVUrBjadNOemEq+axLHRz0156c3Na800Q65dXPTbnpyc9NuejSuXvl1c9NeenNz015qkrj74dEvwIl+A+uby8e9J9J9JvSL2ZF+ivSPSfQKTlfovTO9FegPOV3pPpHpN6A85X6L0i9J9MeRp6T6R6L0w4v0m1HoemNitLU+i9Ngq0ajRrCrRqdGsytOVEpwGXKqVEqoDNJV81lGkYla81pzWXLTkUum3Nbc1hy24NHP3G/Na81hw25PHH3G0vwFPwGc+PCvSfSPSb0R7EjS9J9M70m9AeRpek+md6K9Nh5GnpPpn6L02GjS9J9I9F6bBX6L0j0Wtgr9D0z9DWwV6NRo1sZWjU6NbBVppOAypTiYqAKoqJi4AKjTlHMacwC1fLXmM+Y14go9VpzG3MZ8RtzDRzd1fMbcs+Y15h44+6uT4FSfAdz6+VvSb0zvSb0XHuxpek+kXpN6bBaXpPpHovQ+R1for0j0Wt5HV+h6RpaPltXo1GjWwdVo1OjWxtVp6gwwdUcTKZcFUOJioUyoqJi4WirlciZ+L5hQXzGnMRzGvMZO1fMa8xHMa8wY5+qvmNuYz4jbk8cvdXzGvMZ8teTxyd1c/AIDoPivSfSbU6acve1XorU6WmnIelaWp0tHy3pWjU6Wj5b0vS1OjW8t6Vp6jT0PI+laNTKelw0qjiYelsNKqKiIcJYeVcVERUpKaLi4iKhKLSNOWXNac0oNeWnLLmtOaydbcteWHNa80Yh1G/LXmsOa15p45uo35ac1hzWnPR5XL1y2lCJ0Daj5fD2lpUtdMj1tGlo0tNOS+j0tLS03kPStLS0aPkPRjS0a3kfR6ep0aHkZ0vRKnRpLyadLlPUSnKS8qTppKcqJTlTvKk6aSqlZynKnYeVrKqVlKuUlh5Wsq+axlVKSwXRz0vnpzzppOihY6OemvPTlnTTnpkry6uemvPbk57ac9mlQ64dfPbTntyc9r57NKh183XOw552B1L83yKTJ6Mi1pEKR5CWmQI0hdABGwNPQQbG09PUjQwZ0qU9To0t5NOl6JUnpLyedL05WeqlJeVJ0uVUrOU5UryrOmkqpWcpyp3lSdNZ0qVlKc6TvKkredKnTGdKnSdhtbzpfPbnnSp0XGx1Ttc7cs7XOwLeXXO1z+jkna52Kd4dc/oHN7DaTw8FNNL15HHQQpHkTtBAtPIXTIA2F0DSPRwNAADB09EIBgyqGlAWw0qtNJwlikqtOVJwlik6VKqVEpypXlSdLlOVGnKneVZ00lVKzlOVO8qTprKc6ZSqlTvJ5W06VOmMpzolhm86XOnPOlTouM6PYY+gwY8y0i0ntSPItBAjyEtABHkJo0ACUAAWAAATAACcAgKaA4RwtPDhlDJTw4cKCJ08qocScJYpKqHEw4nYpKuU5UQ4nYpKuVUrOKhLFJVynKjTlJYaVpoRoDBcBaWh7cjw7QCB8JoAAgAAzAGA0cLDADRwDDBdNIBDBdGQHIDLp5Chgy2mghwAlPAYBaeGZCEp4qHEwyVSHD0hCWHlVpyph6XDSq0EC4OuAAPceEAADAGMbRwYDBdGQjwAumkGA8AaMgwGC6aQCQwXTSAYcgDRkB4AXTQGABoIAZTQAf4C08OGQLTQzhQFw8pmkwwdMEAwdcYAeu8UwAXTSGAC6aQGAXTSDDALo4ADDTYMAMujgggw4GjgAAaJgQwMRgMIAACAABgZABlMEYYbTBAMHTBaAxtcppOV6leTDBHKSnhgj0lNDBaZaaGC34ZTCHKQKJmRgIMjATAEATgAAQDDCQMMJAwwkDJmAAYdAAAdMAM2uQJPXqWPIlM9To1OxSVRp0aSw8qtPUaep2GlUNLRKWmlVo1OmUygnT0oqNEp6ArlCdPQFUNMp6AqBSnGEDAbaJA8DaJAxjaxAywRAAZgAGZwjU6evYseJOj09To1OxSdKlGp0anYpOl6NRp6nYeVWnqNGp2HlXpyo0aSw8q9OVGjSjq5T1GiUo60lOVnKcoDrSU5WcqpQHVynqJVSgOqlNMpygOqNMNjaYAYQMAbRIYosHWLAeBtZ5mjU6Ne9Y+flVo1OjU7FJVaNTo1OxSVWjU6NSsUlXolRo1OqSr09Z6ep00q9Go09LTyr09Z6ekHWmnKz05QFpKcrOVUpRaSnKzlVKA60lOVGqgCuU4mGAyqhlpxjaDAYQDDaJAwzPG0anRr37Xz8Vo1GjSWni9Go0alapFaNTo1OqRejUaNTqkXo1OjSU8Xo1I0lNF6cqJTlKZcpyoipSiuU5URUKK4qIioDLlVERUAVw4mKgCqGmKjG04ZQwE4AGNoBhm14GjQHu2vBg0aASqQaNATp4WnoCdPBo0AlPD0aASnh6cAJTQxACmVKqUABOKgBRVFQAGVFwABVDgACqKgACcOAMJmAAgAML/2Q==',
  'data:image/jpeg;base64,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',
  'data:image/jpeg;base64,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',
  'data:image/jpeg;base64,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',
]

/* ════════════════════════════════════════════════════════════════
   DATE HELPERS (shared by Clock + Calendar)
   ════════════════════════════════════════════════════════════════ */

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTH_NAMES = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

function MatteOverlay({ color }: { color: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      aria-hidden="true"
    >
      <defs>
        <filter id={`grain-${color.replace('#', '')}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves={4} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
          <feBlend in="SourceGraphic" mode="multiply" result="blend" />
          <feComponentTransfer in="blend">
            <feFuncA type="linear" slope="0.055" />
          </feComponentTransfer>
        </filter>
      </defs>
      <rect width="100" height="100" fill={color} filter={`url(#grain-${color.replace('#', '')})`} />
    </svg>
  )
}

/* ════════════════════════════════════════════════════════════════
   CLOCK WIDGET — width locked to RAIL_WIDTH (original export is
   320x190; scale factor derives from that so proportions hold).
   ════════════════════════════════════════════════════════════════ */

const CLOCK_S = RAIL_WIDTH / 320

function ClockWidget() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const hh = time.getHours().toString().padStart(2, '0')
  const mm = time.getMinutes().toString().padStart(2, '0')
  const ss = time.getSeconds().toString().padStart(2, '0')
  const ampm = time.getHours() >= 12 ? 'PM' : 'AM'
  const dayName = time.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()
  const dateStr = time.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }).toUpperCase()
  const blink = time.getSeconds() % 2 === 0

  const BG = '#C3E2BC'
  const BG2 = '#B5D8AE'
  const INK = '#1C3A1E'
  const INK2 = '#3D6B42'
  const ACCENT = '#4A8A50'
  const COLON = '#5A9E60'
  const FONT = "-apple-system,'Helvetica Neue',Helvetica,Arial,sans-serif"
  const S = CLOCK_S

  return (
    <div
      style={{
        position: 'relative',
        width: 320 * S,
        height: 190 * S,
        borderRadius: 26 * S,
        overflow: 'hidden',
        background: `linear-gradient(160deg, ${BG} 0%, ${BG2} 100%)`,
        boxShadow:
          '0 12px 40px rgba(60,110,65,0.22), 0 2px 8px rgba(60,110,65,0.14), inset 0 1px 0 rgba(255,255,255,0.55)',
        userSelect: 'none',
        pointerEvents: 'none',
      }}
    >
      <MatteOverlay color={BG} />

      <div style={{ position: 'absolute', top: 18 * S, left: 22 * S, right: 22 * S, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 11 * S, letterSpacing: '1.4px', color: INK2, opacity: 0.8 }}>CLOCK</span>
        <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 11 * S, letterSpacing: '0.4px', color: INK2, opacity: 0.7 }}>{ampm}</span>
      </div>

      <div style={{ position: 'absolute', top: 40 * S, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'baseline' }}>
        <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 86 * S, letterSpacing: '-4px', color: INK, lineHeight: 1 }}>{hh}</span>
        <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 72 * S, color: COLON, lineHeight: 1, marginBottom: 5, marginLeft: 1, marginRight: 1, opacity: blink ? 1 : 0.2, transition: 'opacity 0.12s' }}>:</span>
        <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 86 * S, letterSpacing: '-4px', color: INK, lineHeight: 1 }}>{mm}</span>
      </div>

      <div style={{ position: 'absolute', bottom: 18 * S, left: 22 * S, right: 22 * S, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 12 * S, letterSpacing: '0.6px', color: INK2, opacity: 0.85 }}>{dayName}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13 * S, letterSpacing: '1px', color: ACCENT }}>:{ss}</span>
          <span style={{ width: 1, height: 8, background: INK2, opacity: 0.25 }} />
          <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 12 * S, letterSpacing: '0.4px', color: INK2, opacity: 0.8 }}>{dateStr}</span>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════
   CALENDAR WIDGET — from Create_Transparent_Clock_Widget.zip,
   width locked to RAIL_WIDTH (same scale as the Clock, since the
   original export was also 320 wide).
   ════════════════════════════════════════════════════════════════ */

const CAL_S = RAIL_WIDTH / 320

function CalendarWidget() {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const day = today.getDate()

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  const rows: (number | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7))

  const BG = '#BDD3EC'
  const BG2 = '#AEC6E3'
  const INK = '#12253A'
  const INK2 = '#3A6088'
  const ACCENT = '#2E6DB4'
  const TODAY_BG = '#2E6DB4'
  const TODAY_FG = '#FFFFFF'
  const FONT = "-apple-system,'Helvetica Neue',Helvetica,Arial,sans-serif"
  const S = CAL_S

  const bigDay = DAY_NAMES[today.getDay()]

  return (
    <div
      style={{
        position: 'relative',
        width: 320 * S,
        borderRadius: 26 * S,
        overflow: 'hidden',
        background: `linear-gradient(160deg, ${BG} 0%, ${BG2} 100%)`,
        boxShadow: '0 12px 40px rgba(40,80,140,0.22), 0 2px 8px rgba(40,80,140,0.14), inset 0 1px 0 rgba(255,255,255,0.55)',
        padding: `${18 * S}px ${20 * S}px ${20 * S}px`,
        userSelect: 'none',
        pointerEvents: 'none',
        boxSizing: 'border-box',
      }}
    >
      <MatteOverlay color={BG} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 * S }}>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
            <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13 * S, letterSpacing: '2px', color: INK2, opacity: 0.8 }}>{bigDay}</span>
            <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 52 * S, letterSpacing: '-3px', color: INK, lineHeight: 0.9, marginTop: 2 }}>{day}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', paddingTop: 2 }}>
            <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 20 * S, letterSpacing: '-0.5px', color: INK }}>{MONTH_NAMES[month]}</span>
            <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 13 * S, color: INK2, opacity: 0.75, letterSpacing: '0.5px' }}>{year}</span>
          </div>
        </div>

        <div style={{ height: 1, background: INK2, opacity: 0.14, marginBottom: 10 * S, borderRadius: 1 }} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 6 * S }}>
          {DAY_LABELS.map((l, i) => (
            <div
              key={i}
              style={{
                textAlign: 'center',
                fontFamily: FONT,
                fontWeight: 700,
                fontSize: 11 * S,
                letterSpacing: '0.5px',
                color: i === 0 || i === 6 ? ACCENT : INK2,
                opacity: i === 0 || i === 6 ? 0.85 : 0.6,
              }}
            >
              {l}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {rows.map((row, ri) => (
            <div key={ri} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
              {row.map((d, ci) => {
                const isToday = d === day
                const isWeekend = ci === 0 || ci === 6
                return (
                  <div key={ci} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 28 * S }}>
                    {d !== null && (
                      <span
                        style={{
                          fontFamily: FONT,
                          fontWeight: isToday ? 800 : 600,
                          fontSize: 13 * S,
                          width: isToday ? 28 * S : 24 * S,
                          height: isToday ? 28 * S : 24 * S,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: isToday ? 8 * S : 0,
                          background: isToday ? TODAY_BG : 'transparent',
                          color: isToday ? TODAY_FG : isWeekend ? ACCENT : INK,
                          opacity: isToday ? 1 : isWeekend ? 0.9 : 0.82,
                          boxShadow: isToday ? '0 2px 8px rgba(46,109,180,0.35)' : 'none',
                        }}
                      >
                        {d}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════
   CARD STACK WIDGET — fully interactive (drag/swipe), same physics
   as the original "Simple Card Stack" export. Width locked to
   RAIL_WIDTH (original content box was 343 wide).
   ════════════════════════════════════════════════════════════════ */

const CARD_S = RAIL_WIDTH / 343
const CARD_W = 323 * CARD_S
const CARD_H = 484 * CARD_S
const CARD_BOX_W = 343 * CARD_S
const CARD_BOX_H = 484 * CARD_S

// same defaults as the original SettingsPanel
const CARD_SETTINGS = {
  springDuration: 0.3,
  springBounce: 0.3,
  xSpringDuration: 0.5,
  xSpringBounce: 0.1,
  dragElastic: 0.7,
  swipeConfidenceThreshold: 10000,
  zIndexDelay: 0.05,
}

const swipePower = (offset: number, velocity: number) => Math.abs(offset) * velocity

const cardVariants = {
  visible: (i: number) => ({
    opacity: 1,
    zIndex: [4, 3, 2, 1][i],
    scale: [1, 0.9, 0.85, 0.8][i],
    y: [0, -12, 0, 12][i] * CARD_S,
    rotate: [0, 2, 4, 7][i],
    x: [0, 32, 48, 62][i] * CARD_S,
    transition: {
      zIndex: { delay: CARD_SETTINGS.zIndexDelay },
      scale: { type: 'spring' as const, duration: CARD_SETTINGS.springDuration, bounce: CARD_SETTINGS.springBounce },
      y: { type: 'spring' as const, duration: CARD_SETTINGS.springDuration, bounce: CARD_SETTINGS.springBounce },
      x: { type: 'spring' as const, duration: CARD_SETTINGS.xSpringDuration, bounce: CARD_SETTINGS.xSpringBounce },
    },
  }),
  exit: { opacity: 0, scale: 0.5, y: 50 * CARD_S },
} as const

function CardStackWidget() {
  const [indices, setIndices] = useState([0, 1, 2, 3])

  const paginate = () => {
    setIndices((prev) => [prev[1], prev[2], prev[3], prev[0]])
  }

  return (
    <div style={{ position: 'relative', width: CARD_BOX_W, height: CARD_BOX_H }}>
      <AnimatePresence initial={false}>
        {indices.map((index, i) => (
          <motion.div
            key={index}
            custom={i}
            variants={cardVariants}
            initial="exit"
            animate="visible"
            exit="exit"
            drag
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={CARD_SETTINGS.dragElastic}
            onDragEnd={(_e, info: PanInfo) => {
              const swipe = swipePower(info.offset.x, info.velocity.x)
              if (swipe < -CARD_SETTINGS.swipeConfidenceThreshold || swipe > CARD_SETTINGS.swipeConfidenceThreshold) {
                paginate()
              }
            }}
            style={{
              position: 'absolute',
              height: CARD_H,
              width: CARD_W,
              borderRadius: 14,
              overflow: 'hidden',
              background: '#fff',
              boxShadow: '0 12px 32px rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.16)',
              cursor: 'grab',
              touchAction: 'none',
            }}
            whileTap={{ cursor: 'grabbing' }}
          >
            <img
              src={CARD_IMAGES[index % CARD_IMAGES.length]}
              alt={`card-${index}`}
              draggable={false}
              style={{ height: '100%', width: '100%', objectFit: 'cover', pointerEvents: 'none' }}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════
   SHADER REMINDER WIDGET — raw WebGL shader circle + a compact
   inline reminder popover (in-memory only).
   ════════════════════════════════════════════════════════════════ */

const vertexShaderSrc = `
attribute vec4 aVertexPosition;
attribute vec2 aTextureCoord;
varying vec2 vTextureCoord;
void main() {
  gl_Position = aVertexPosition;
  vTextureCoord = aTextureCoord;
}
`

const flowingWavesShader = `
precision mediump float;
uniform vec2 iResolution;
uniform float iTime;
uniform vec2 iMouse;
uniform bool hasActiveReminders;
uniform bool hasUpcomingReminders;
uniform bool disableCenterDimming;
varying vec2 vTextureCoord;

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (2.0 * fragCoord - iResolution.xy) / min(iResolution.x, iResolution.y);
  vec2 center = iResolution.xy * 0.5;
  float dist = distance(fragCoord, center);
  float radius = min(iResolution.x, iResolution.y) * 0.5;
  float centerDim = disableCenterDimming ? 1.0 : smoothstep(radius * 0.3, radius * 0.5, dist);

  for(float i = 1.0; i < 10.0; i++){
    uv.x += 0.6 / i * cos(i * 2.5 * uv.y + iTime);
    uv.y += 0.6 / i * cos(i * 1.5 * uv.x + iTime);
  }

  if (hasActiveReminders) {
    fragColor = vec4(vec3(0.1, 0.3, 0.6) / abs(sin(iTime - uv.y - uv.x)), 1.0);
  } else if (hasUpcomingReminders) {
    fragColor = vec4(vec3(0.1, 0.5, 0.2) / abs(sin(iTime - uv.y - uv.x)), 1.0);
  } else {
    fragColor = vec4(vec3(0.1) / abs(sin(iTime - uv.y - uv.x)), 1.0);
  }

  if (!disableCenterDimming) {
    fragColor.rgb = mix(fragColor.rgb * 0.3, fragColor.rgb, centerDim);
  }
}

void main() {
  vec2 fragCoord = vTextureCoord * iResolution;
  vec2 center = iResolution * 0.5;
  float dist = distance(fragCoord, center);
  float radius = min(iResolution.x, iResolution.y) * 0.5;
  if (dist < radius) {
    vec4 color;
    mainImage(color, fragCoord);
    gl_FragColor = color;
  } else {
    discard;
  }
}
`

interface ShaderCanvasProps {
  size?: number
  onClick?: () => void
  hasActiveReminders?: boolean
  hasUpcomingReminders?: boolean
}

function ShaderCanvas({ size = 130, onClick, hasActiveReminders = false, hasUpcomingReminders = false }: ShaderCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const mousePositionRef = useRef<[number, number]>([0.5, 0.5])
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    mousePositionRef.current = [(e.clientX - rect.left) / rect.width, (e.clientY - rect.top) / rect.height]
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const gl = canvas.getContext('webgl')
    if (!gl) {
      console.error('WebGL not supported')
      return
    }

    function loadShader(type: number, source: string) {
      const shader = gl!.createShader(type)
      if (!shader) return null
      gl!.shaderSource(shader, source)
      gl!.compileShader(shader)
      if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
        console.error(gl!.getShaderInfoLog(shader))
        gl!.deleteShader(shader)
        return null
      }
      return shader
    }

    const vs = loadShader(gl.VERTEX_SHADER, vertexShaderSrc)
    const fs = loadShader(gl.FRAGMENT_SHADER, flowingWavesShader)
    if (!vs || !fs) return
    const program = gl.createProgram()
    if (!program) return
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program))
      return
    }

    const programInfo = {
      program,
      attribLocations: {
        vertexPosition: gl.getAttribLocation(program, 'aVertexPosition'),
        textureCoord: gl.getAttribLocation(program, 'aTextureCoord'),
      },
      uniformLocations: {
        iResolution: gl.getUniformLocation(program, 'iResolution'),
        iTime: gl.getUniformLocation(program, 'iTime'),
        iMouse: gl.getUniformLocation(program, 'iMouse'),
        hasActiveReminders: gl.getUniformLocation(program, 'hasActiveReminders'),
        hasUpcomingReminders: gl.getUniformLocation(program, 'hasUpcomingReminders'),
        disableCenterDimming: gl.getUniformLocation(program, 'disableCenterDimming'),
      },
    }

    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, 1, 1, -1, 1]), gl.STATIC_DRAW)

    const texCoordBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]), gl.STATIC_DRAW)

    const indexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW)

    canvas.width = size
    canvas.height = size
    gl.viewport(0, 0, canvas.width, canvas.height)

    const startTime = Date.now()
    const render = () => {
      const currentTime = (Date.now() - startTime) / 1000
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
      gl.useProgram(programInfo.program)
      gl.uniform2f(programInfo.uniformLocations.iResolution, canvas.width, canvas.height)
      gl.uniform1f(programInfo.uniformLocations.iTime, currentTime)
      gl.uniform2f(programInfo.uniformLocations.iMouse, mousePositionRef.current[0], mousePositionRef.current[1])
      gl.uniform1i(programInfo.uniformLocations.hasActiveReminders, hasActiveReminders ? 1 : 0)
      gl.uniform1i(programInfo.uniformLocations.hasUpcomingReminders, hasUpcomingReminders ? 1 : 0)
      gl.uniform1i(programInfo.uniformLocations.disableCenterDimming, 0)

      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
      gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 2, gl.FLOAT, false, 0, 0)
      gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition)

      gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer)
      gl.vertexAttribPointer(programInfo.attribLocations.textureCoord, 2, gl.FLOAT, false, 0, 0)
      gl.enableVertexAttribArray(programInfo.attribLocations.textureCoord)

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0)

      animationRef.current = requestAnimationFrame(render)
    }
    render()

    return () => {
      cancelAnimationFrame(animationRef.current)
      gl.deleteProgram(program)
    }
  }, [size, hasActiveReminders, hasUpcomingReminders])

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        transform: isHovered ? 'scale(1.03)' : 'scale(1)',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        cursor: 'pointer',
        boxShadow: hasActiveReminders
          ? '0 0 30px rgba(66,153,225,0.4)'
          : hasUpcomingReminders
          ? '0 0 30px rgba(72,187,120,0.4)'
          : isHovered
          ? '0 0 30px rgba(255,255,255,0.2)'
          : 'none',
      }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        mousePositionRef.current = [0.5, 0.5]
      }}
      onMouseMove={handleMouseMove}
    />
  )
}

interface Reminder {
  id: string
  message: string
  time: Date
  completed: boolean
}

const SHADER_SIZE = CARD_H / 1.5 // half the card stack's height

function ShaderReminderWidget() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [showInput, setShowInput] = useState(false)
  const [message, setMessage] = useState('')
  const [minutes, setMinutes] = useState(15)

  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date()
      setReminders((prev) =>
        prev.map((r) => {
          if (!r.completed && r.time <= now) {
            toast(r.message, { icon: <Bell size={14} /> })
            return { ...r, completed: true }
          }
          return r
        })
      )
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const hasActive = reminders.some((r) => !r.completed)
  const hasUpcoming = reminders.some((r) => !r.completed && r.time.getTime() - Date.now() < 5 * 60 * 1000)

  const addReminder = () => {
    if (!message.trim()) return
    const time = new Date(Date.now() + minutes * 60 * 1000)
    setReminders((prev) => [...prev, { id: crypto.randomUUID(), message: message.trim(), time, completed: false }])
    setMessage('')
    setShowInput(false)
  }

  return (
    <div style={{ position: 'relative', width: SHADER_SIZE, height: SHADER_SIZE, flexShrink: 0 }}>
      <Toaster position="top-right" />
      <ShaderCanvas size={SHADER_SIZE} onClick={() => setShowInput((v) => !v)} hasActiveReminders={hasActive} hasUpcomingReminders={hasUpcoming} />

      <AnimatePresence>
        {showInput && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            style={{
              position: 'absolute',
              top: SHADER_SIZE + 10,
              right: 0,
              width: 220,
              borderRadius: 14,
              padding: 12,
              background: 'rgba(28,28,32,0.88)',
              WebkitBackdropFilter: 'blur(40px) saturate(200%)',
              backdropFilter: 'blur(40px) saturate(200%)',
              border: '1px solid rgba(255,255,255,0.18)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
              zIndex: 40,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: 600 }}>New reminder</span>
              <button onClick={() => setShowInput(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)' }}>
                <X size={14} />
              </button>
            </div>
            <input
              autoFocus
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addReminder()}
              placeholder="Remind me to..."
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.06)',
                color: '#fff',
                fontSize: 12,
                marginBottom: 8,
                outline: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <select
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
                style={{ flex: 1, padding: '6px 8px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 11 }}
              >
                <option value={5}>in 5 min</option>
                <option value={15}>in 15 min</option>
                <option value={30}>in 30 min</option>
                <option value={60}>in 1 hour</option>
              </select>
              <button
                onClick={addReminder}
                style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: 'rgba(236,72,153,0.65)', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
              >
                Set
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════
   WIDGET RAIL — fixed column on the left edge of the desktop.
   Layout:
     Row 1: Card Stack (interactive, drag to swipe) + Shader Reminder
     Row 2: Clock          — same width as the card stack
     Row 3: Calendar       — same width as the card stack
   Only the card stack and shader circle are interactive; the rail
   itself and the clock/calendar are inert (no drag, no clicks).
   ════════════════════════════════════════════════════════════════ */

export default function WidgetRail() {
  return (
    <div
      style={{
        position: 'fixed',
        top: 28 + 24,
        left: 24,
        zIndex: 5,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        <CardStackWidget />
        <ShaderReminderWidget />
      </div>
      <div style={{ pointerEvents: 'none' }}>
        <ClockWidget />
      </div>
      <div style={{ pointerEvents: 'none' }}>
        <CalendarWidget />
      </div>
    </div>
  )
}