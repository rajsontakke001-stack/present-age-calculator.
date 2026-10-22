import { useEffect, useMemo, useRef, useState } from "react";

const R = 99;
const C = 2 * Math.PI * R;
const DAY = 86400000;
const COLORS = ["#4cf075", "#8f84f5", "#ffe27d", "#ff8a65", "#5ac8fa"];
const TICKS = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * 2 * Math.PI;
  return { x: 120 + R * Math.cos(a), y: 120 + R * Math.sin(a) };
});

const fmt = (n) => Math.round(n).toLocaleString("en-IN");
const utc = (d) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());

function birthdayIn(b, y) {
  const m = b.getMonth(), d = b.getDate();
  const leap = y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
  if (m === 1 && d === 29 && !leap) return new Date(y, 1, 28);
  return new Date(y, m, d);
}

function calculate(value) {
  const [yy, mm, dd] = value.split("-").map(Number);
  const b = new Date(yy, mm - 1, dd);
  const now = new Date();
  if (b > now) return { error: "That date is in the future. Choose an earlier one." };

  let years = now.getFullYear() - b.getFullYear();
  let months = now.getMonth() - b.getMonth();
  let days = now.getDate() - b.getDate();
  if (days < 0) {
    months--;
    days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  const total = Math.round((utc(now) - utc(b)) / DAY);
  let next = birthdayIn(b, now.getFullYear());
  if (utc(next) < utc(now)) next = birthdayIn(b, now.getFullYear() + 1);
  const last = birthdayIn(b, next.getFullYear() - 1);
  const lap = Math.round((utc(next) - utc(last)) / DAY) || 365;
  const elapsed = Math.round((utc(now) - utc(last)) / DAY);

  return {
    years, months, days, total,
    left: Math.round((utc(next) - utc(now)) / DAY),
    progress: Math.min(1, Math.max(0, elapsed / lap)),
    weekday: next.toLocaleDateString("en-US", { weekday: "long" }),
    nextDate: next.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
    weeks: total / 7,
    hours: total * 24 + now.getHours(),
    moons: total / 29.53,
  };
}

// Validates the three typed boxes. Returns null until the year is fully typed.
function parse(p) {
  if (p.y.length < 4) return null;
  const d = +p.d, m = +p.m, y = +p.y;
  if (!d || !m || y < 1900) return { error: "Enter a real date, year 1900 or later." };
  const t = new Date(y, m - 1, d);
  if (t.getFullYear() !== y || t.getMonth() !== m - 1 || t.getDate() !== d)
    return { error: "That date doesn’t exist. Check the day and month." };
  return { value: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}` };
}

function useCountUp(target, ms = 900) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVal(target);
      return;
    }
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / ms);
      setVal(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return val;
}

function Scan({ total }) {
  const v = useCountUp(total, 1600);
  return (
    <div className="stage">
      <div className="scan"><span>{fmt(v)}</span></div>
      <h3>Counting sunrises…</h3>
      <p>Checking every leap year too.</p>
      <div className="load"><i /></div>
    </div>
  );
}

function Done({ res, onGo }) {
  const bits = useMemo(() => Array.from({ length: 30 }, (_, i) => {
    const a = Math.random() * Math.PI * 2, r = 60 + Math.random() * 130;
    return {
      "--tx": Math.cos(a) * r + "px",
      "--ty": Math.sin(a) * r * 0.8 + 40 + "px",
      "--r": Math.random() * 720 - 360 + "deg",
      "--w": 5 + Math.random() * 6 + "px",
      "--c": COLORS[i % COLORS.length],
    };
  }), []);
  const btn = useRef(null);
  useEffect(() => btn.current?.focus(), []);
  return (
    <div className="stage">
      <div className="conf" aria-hidden="true">
        {bits.map((s, i) => <i key={i} style={s} />)}
      </div>
      <div className="chk">
        <b />
        <svg viewBox="0 0 92 92" aria-hidden="true"><path d="M28 48l13 13 25-27" /></svg>
      </div>
      <h3>Found it!</h3>
      <p>
        You’ve been around for <b>{fmt(res.total)} days</b>. Your next birthday is{" "}
        {res.left === 0 ? "today" : `in ${res.left} ${res.left === 1 ? "day" : "days"}`}. Hella cool!
      </p>
      <button ref={btn} className="cont" onClick={onGo}>CONTINUE ›</button>
    </div>
  );
}

function Bg() {
  const dots = useMemo(() => Array.from({ length: 26 }, (_, i) => ({
    "--x": Math.random() * 100 + "%",
    "--s": 3 + Math.random() * 5 + "px",
    "--d": 12 + Math.random() * 16 + "s",
    "--dl": -Math.random() * 28 + "s",
    "--dx": Math.random() * 120 - 60 + "px",
    "--c": COLORS[i % COLORS.length],
  })), []);
  return (
    <div className="bg" aria-hidden="true">
      <div className="aur a1" /><div className="aur a2" /><div className="aur a3" />
      {dots.map((d, i) => <i key={i} style={d} />)}
    </div>
  );
}

export default function App() {
  const [p, setP] = useState({ d: "", m: "", y: "" });
  const [res, setRes] = useState(null);
  const [pending, setPending] = useState(null);
  const [stage, setStage] = useState("input"); // input | calc | done | null
  const [closing, setClosing] = useState(false);
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const r0 = useRef(null), r1 = useRef(null), r2 = useRef(null);
  const refs = [r0, r1, r2];
  const typeT = useRef(0), calcT = useRef(0), seq = useRef(0), dirty = useRef(false);

  const drops = useMemo(() => Array.from({ length: 18 }, () => ({
    ch: String(Math.floor(Math.random() * 10)),
    x: Math.random() * 96, s: 16 + Math.random() * 30,
    d: 7 + Math.random() * 9, dl: -Math.random() * 14,
  })), []);

  const parsed = useMemo(() => parse(p), [p]);

  function start(value) {
    const out = calculate(value);
    if (out.error) return setError(out.error);
    dirty.current = false;
    setPending(out);
    setStage("calc");
    calcT.current = window.setTimeout(() => setStage("done"), 1800);
  }

  // Start automatically once a full, valid date has been typed.
  useEffect(() => {
    setError(parsed?.error || "");
    if (stage !== "input" || !dirty.current || !parsed?.value) return;
    const t = setTimeout(() => start(parsed.value), 550);
    return () => clearTimeout(t);
  }, [parsed, stage]);

  useEffect(() => () => { clearTimeout(typeT.current); clearTimeout(calcT.current); }, []);

  function change(k, raw) {
    let v = raw.replace(/\D/g, "").slice(0, k === "y" ? 4 : 2);
    if (k === "d" && v.length === 1 && +v > 3) v = "0" + v;
    if (k === "m" && v.length === 1 && +v > 1) v = "0" + v;
    dirty.current = true;
    setP((o) => ({ ...o, [k]: v }));
    setTyping(true);
    clearTimeout(typeT.current);
    typeT.current = window.setTimeout(() => setTyping(false), 900);
    const i = k === "d" ? 0 : k === "m" ? 1 : 2;
    if (v.length === (k === "y" ? 4 : 2) && i < 2) refs[i + 1].current?.focus();
  }

  function onKey(i, e) {
    if (e.key === "Backspace" && !e.currentTarget.value && i > 0) refs[i - 1].current?.focus();
    if (e.key === "Enter" && parsed?.value) start(parsed.value);
    if (e.key === "Escape" && res) closeModal();
  }

  function closeModal() {
    setClosing(true);
    setTimeout(() => { setStage(null); setClosing(false); }, 350);
  }

  function proceed() {
    setRes(pending);
    setReady(false);
    const id = ++seq.current;
    requestAnimationFrame(() =>
      requestAnimationFrame(() => id === seq.current && setReady(true))
    );
    closeModal();
  }

  function openEdit() {
    dirty.current = false;
    setError("");
    setStage("input");
  }

  const days = useCountUp(res ? res.total : 0);
  const shown = res && ready ? res.progress : 0;
  const arc = {
    strokeDasharray: C,
    strokeDashoffset: C * (1 - shown),
    transition: "stroke-dashoffset 1.1s cubic-bezier(.2,.8,.2,1)",
  };

  return (
    <>
    <Bg />
    <div className="wrap">
      <h1>Present Age Calculator</h1>
      <div className="grid">
        <section className="card dial" aria-label="Days lived and birthday progress">
          <h2>Summary</h2>
          <div className="ring">
            <div className="chan" />
            <svg viewBox="0 0 240 240" aria-hidden="true">
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#6dff8f" />
                  <stop offset="1" stopColor="#27cf55" />
                </linearGradient>
                <filter id="bl"><feGaussianBlur stdDeviation="6" /></filter>
              </defs>
              <g fill="#b9b9bf">
                {TICKS.map((t, i) => <rect key={i} x={t.x - 1.2} y={t.y - 1.2} width="2.4" height="2.4" />)}
              </g>
              <circle cx="120" cy="120" r={R} fill="none" stroke="url(#g)" strokeWidth="32"
                filter="url(#bl)" opacity=".5" transform="rotate(-90 120 120)" style={arc} />
              <circle cx="120" cy="120" r={R} fill="none" stroke="url(#g)" strokeWidth="32"
                transform="rotate(-90 120 120)" style={arc} />
            </svg>
            <div className="well">
              <div><b>{fmt(days)}</b><span>days on Earth</span></div>
            </div>
          </div>
          <p className="renew">
            {res ? `Next birthday ${res.nextDate} • ` : "No date yet • "}
            <button type="button" onClick={openEdit}>{res ? "Edit" : "Add"}</button>
          </p>
          <p className="lap">{res && `${Math.round(res.progress * 100)}% of this year’s lap done`}</p>
        </section>

        <section className="card age" aria-label="Exact age">
          <span className="pill">Exact age</span>
          <div className="ymd">
            <div className="hot"><b>{res ? res.years : 0}</b><span>years</span></div>
            <div><b>{res ? res.months : 0}</b><span>months</span></div>
            <div><b>{res ? res.days : 0}</b><span>days</span></div>
          </div>
        </section>

        <section className="card led" aria-label="Next birthday">
          <div className="hous">
            <div className="strip">{res ? `NEXT > ${res.weekday.toUpperCase()}` : "NEXT >"}</div>
            <div className="row">
              <div className="disc"><div className="rec" /></div>
              <div className="info">
                <strong>{res ? `Birthday on ${res.nextDate}` : "Birthday"}</strong>
                <small>{res && res.weekday}</small>
                <div className="bar"><i style={{ width: `${shown * 100}%` }} /></div>
                <div className="left">
                  {res ? (res.left === 0 ? "Today!" : res.left) : 0}
                  {res && res.left !== 0 && <small>{res.left === 1 ? "day left" : "days left"}</small>}
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>

      {stage && (
        <div className={`veil${typing ? " typing" : ""}${closing ? " out" : ""}`}
          role="dialog" aria-modal="true" aria-label="Enter your date of birth">
          <div className="blob b1" />
          <div className="blob b2" />
          <div className="fall" aria-hidden="true">
            {drops.map((o, i) => (
              <i key={i} style={{ "--x": o.x + "%", "--s": o.s + "px", "--d": o.d + "s", "--dl": o.dl + "s" }}>{o.ch}</i>
            ))}
          </div>
          <div className="pop">
            <div className="pop-card">
              {stage === "input" && (
                <div className="stage" key="in">
                  {res && <button className="x" aria-label="Close" onClick={closeModal}>✕</button>}
                  <h3>When were you born?</h3>
                  <p>Type your date of birth and watch every sunrise get counted.</p>
                  <div className="seg">
                    {[["d", "DD", 2, "Day"], ["m", "MM", 2, "Month"], ["y", "YYYY", 4, "Year"]].map(([k, ph, max, label], i) => (
                      <input key={k} ref={refs[i]} value={p[k]} inputMode="numeric" autoComplete="off"
                        placeholder={ph} maxLength={max} aria-label={label} autoFocus={i === 0}
                        onChange={(e) => change(k, e.target.value)} onKeyDown={(e) => onKey(i, e)} />
                    ))}
                  </div>
                  <div className="prog" aria-hidden="true">
                    {[p.d.length === 2, p.m.length === 2, p.y.length === 4].map((on, i) => (
                      <i key={i} className={on ? "on" : ""} />
                    ))}
                  </div>
                  <div className="msg" role="alert">{error}</div>
                </div>
              )}
              {stage === "calc" && pending && <Scan total={pending.total} />}
              {stage === "done" && pending && <Done res={pending} onGo={proceed} />}
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
