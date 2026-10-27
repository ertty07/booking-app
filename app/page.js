'use client'
import { useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { generateSlots } from '@/lib/slots'

const pad = n => String(n).padStart(2, '0')
const toKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const fmtTime = d => d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

export default function Home() {
    const days = useMemo(() => {
        const t = new Date()
        return Array.from({ length: 14 }, (_, i) => new Date(t.getFullYear(), t.getMonth(), t.getDate() + i))
    }, [])

    const [date, setDate] = useState('')
    const [slots, setSlots] = useState([])
    const [selected, setSelected] = useState(null)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [status, setStatus] = useState({ type: '', text: '' })
    const [busy, setBusy] = useState(false)

    async function loadSlots(key) {
        setDate(key)
        setSelected(null)
        const { data: bookings } = await supabase
            .from('bookings')
            .select('start_time, end_time')
            .gte('start_time', `${key}T00:00:00`)
            .lte('start_time', `${key}T23:59:59`)
        setSlots(generateSlots(key, 30, bookings || []))
    }

    async function book(e) {
        e.preventDefault()
        setBusy(true)
        const { error } = await supabase.from('bookings').insert({
            customer_name: name,
            customer_email: email,
            start_time: selected.start.toISOString(),
            end_time: selected.end.toISOString(),
        })
        setBusy(false)
        if (error) {
            setStatus({
                type: 'error',
                text: error.code === '23505'
                    ? 'That time was just taken. Pick another slot.'
                    : error.message,
            })
        } else {
            setStatus({ type: 'ok', text: `Booked for ${fmtTime(selected.start)}. A confirmation will follow.` })
            setName('')
            setEmail('')
        }
        setSelected(null)
        loadSlots(date)
    }

    const pickedDay = date ? days.find(d => toKey(d) === date) : null

    return (
        <>
            <style>{css}</style>
            <div className="shell">
                <aside className="side">
                    <p className="brand">Bookly</p>
                    <div className="summary" aria-live="polite">
                        <p className="hint">
                            {selected ? 'Your appointment' : pickedDay ? 'Now pick a time' : 'Start by choosing a day'}
                        </p>
                        <p className="big">{selected ? fmtTime(selected.start) : '– : –'}</p>
                        <p className="day">
                            {pickedDay
                                ? pickedDay.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
                                : 'No day selected'}
                        </p>
                    </div>
                    <p className="foot">30-minute sessions, 9:00 to 17:00</p>
                </aside>

                <main className="main">
                    <h1>Book an appointment</h1>

                    <section aria-label="Choose a day">
                        <h2>Day</h2>
                        <div className="days">
                            {days.map(d => {
                                const key = toKey(d)
                                return (
                                    <button
                                        key={key}
                                        className={'chip day-chip' + (key === date ? ' on' : '')}
                                        onClick={() => { setStatus({ type: '', text: '' }); loadSlots(key) }}
                                    >
                                        <span className="dow">{d.toLocaleDateString([], { weekday: 'short' })}</span>
                                        <span className="num">{d.getDate()}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </section>

                    {date && (
                        <section aria-label="Choose a time">
                            <h2>Time</h2>
                            {slots.length === 0 ? (
                                <p className="empty">Fully booked on this day. Try another day.</p>
                            ) : (
                                <div className="slots">
                                    {slots.map(s => (
                                        <button
                                            key={s.start.toISOString()}
                                            className={'chip' + (selected?.start.getTime() === s.start.getTime() ? ' on' : '')}
                                            onClick={() => { setSelected(s); setStatus({ type: '', text: '' }) }}
                                        >
                                            {fmtTime(s.start)}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </section>
                    )}

                    {selected && (
                        <form className="form" onSubmit={book}>
                            <h2>Your details</h2>
                            <label>
                                Full name
                                <input required value={name} onChange={e => setName(e.target.value)} autoComplete="name" />
                            </label>
                            <label>
                                Email
                                <input required type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
                            </label>
                            <button className="cta" disabled={busy}>
                                {busy ? 'Booking…' : 'Confirm booking'}
                            </button>
                        </form>
                    )}

                    {status.text && (
                        <p className={'status ' + status.type} role="status">{status.text}</p>
                    )}
                </main>
            </div>
        </>
    )
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@500;700;800&family=Figtree:wght@400;500;600&display=swap');

:root {
  --ink: #16162e;
  --mist: #eef0fb;
  --cobalt: #4057f5;
  --butter: #ffd84d;
  --white: #ffffff;
  --muted: #6b6f8d;
}
* { box-sizing: border-box; }
body { margin: 0; font-family: 'Figtree', system-ui, sans-serif; color: var(--ink); background: var(--mist); }
button, input { font: inherit; }
:focus-visible { outline: 3px solid var(--cobalt); outline-offset: 2px; }

.shell { min-height: 100vh; display: grid; grid-template-columns: minmax(280px, 400px) 1fr; }

.side {
  background: var(--ink); color: var(--white);
  padding: 40px; display: flex; flex-direction: column; justify-content: space-between;
  position: sticky; top: 0; height: 100vh;
}
.brand { font-family: 'Bricolage Grotesque', sans-serif; font-weight: 800; font-size: 22px; margin: 0; }
.hint { color: #b9bde0; margin: 0 0 8px; }
.big {
  font-family: 'Bricolage Grotesque', sans-serif; font-weight: 800;
  font-size: clamp(56px, 7vw, 92px); line-height: 1; margin: 0; color: var(--butter);
  letter-spacing: -0.03em;
}
.day { font-size: 20px; margin: 12px 0 0; }
.foot { color: #b9bde0; font-size: 14px; margin: 0; }

.main { padding: 56px clamp(24px, 5vw, 72px); max-width: 860px; }
h1 { font-family: 'Bricolage Grotesque', sans-serif; font-weight: 800; font-size: clamp(32px, 4vw, 48px); margin: 0 0 40px; letter-spacing: -0.02em; }
h2 { font-size: 16px; font-weight: 600; color: var(--muted); margin: 0 0 12px; }
section, .form { margin-bottom: 36px; }

.days { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 8px; }
.slots { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 10px; }

.chip {
  background: var(--white); border: 2px solid transparent; border-radius: 14px;
  padding: 12px 16px; cursor: pointer; font-weight: 600; color: var(--ink);
  transition: background .15s, color .15s, transform .15s, border-color .15s;
}
.chip:hover { border-color: var(--cobalt); }
.chip.on { background: var(--cobalt); color: var(--white); transform: translateY(-2px); }
.day-chip { display: flex; flex-direction: column; align-items: center; min-width: 68px; gap: 4px; flex-shrink: 0; }
.dow { font-size: 13px; opacity: .7; font-weight: 500; }
.num { font-family: 'Bricolage Grotesque', sans-serif; font-size: 24px; font-weight: 700; }

.empty { color: var(--muted); }

.form { background: var(--white); border-radius: 20px; padding: 28px; max-width: 460px; display: grid; gap: 16px; }
.form h2 { margin: 0; }
label { display: grid; gap: 6px; font-weight: 600; font-size: 14px; }
input { padding: 14px 16px; border-radius: 12px; border: 2px solid var(--mist); background: var(--mist); }
input:focus { border-color: var(--cobalt); outline: none; background: var(--white); }
.cta {
  background: var(--butter); color: var(--ink); border: 0; border-radius: 14px;
  padding: 16px; font-weight: 700; font-size: 16px; cursor: pointer; transition: transform .15s;
}
.cta:hover:not(:disabled) { transform: translateY(-2px); }
.cta:disabled { opacity: .6; cursor: wait; }

.status { padding: 14px 18px; border-radius: 12px; font-weight: 600; max-width: 460px; }
.status.ok { background: #d9f7e4; color: #14532d; }
.status.error { background: #fde0e0; color: #7f1d1d; }

@media (max-width: 800px) {
  .shell { grid-template-columns: 1fr; }
  .side { position: static; height: auto; gap: 24px; padding: 28px 24px; }
  .foot { display: none; }
  .main { padding-top: 32px; }
}
@media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
`