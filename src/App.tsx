import { useState } from 'react'
import './App.css'

type LensResult =
  | {
      kind: 'finite'
      f: number
      u: number // signed (cm)
      v: number // signed (cm)
      m: number // signed
      ho: number
      hi: number
    }
  | {
      kind: 'infinity'
      f: number
      u: number
      ho: number
    }

function roundTo(x: number, dp: number) {
  const p = 10 ** dp
  return Math.round(x * p) / p
}

function fmtSigned(x: number, dp = 2) {
  const r = roundTo(x, dp)
  const sign = r > 0 ? '+' : r < 0 ? '−' : ''
  return `${sign}${Math.abs(r).toFixed(dp)}`
}

function solveThinLens({
  f,
  uSigned,
  ho,
}: {
  f: number
  uSigned: number
  ho: number
}): LensResult {
  // Cartesian sign convention (common for HK secondary):
  // +x to the right of lens, lens at x = 0.
  // Real object placed on left => u is negative.
  // Convex lens => f is positive.
  // Thin lens formula: 1/f = 1/v - 1/u
  //
  // Rearranged: 1/v = 1/f + 1/u
  // (Note u is negative; this naturally yields v>0 for real images and v<0 for virtual.)
  const eps = 1e-9
  const invV = 1 / f + 1 / uSigned
  if (Math.abs(invV) < eps) return { kind: 'infinity', f, u: uSigned, ho }
  const v = 1 / invV
  const m = v / uSigned
  const hi = m * ho
  return { kind: 'finite', f, u: uSigned, v, m, ho, hi }
}

function classifyImage(res: LensResult) {
  if (res.kind === 'infinity') return { imageType: 'At infinity', orientation: '—', size: '—' }
  const imageType = res.v > 0 ? 'Real (forms on right)' : 'Virtual (appears on left)'
  const orientation = res.m < 0 ? 'Inverted' : 'Upright'
  const size =
    Math.abs(res.m) > 1 + 1e-9 ? 'Magnified' : Math.abs(res.m) < 1 - 1e-9 ? 'Diminished' : 'Same size'
  return { imageType, orientation, size }
}

function clamp(x: number, min: number, max: number) {
  return Math.min(max, Math.max(min, x))
}

function RayDiagram({
  f,
  uMag,
  ho,
  result,
}: {
  f: number
  uMag: number
  ho: number
  result: LensResult
}) {
  const w = 860
  const h = 360
  const axisY = Math.round(h * 0.68)
  const marginX = 50

  const v = result.kind === 'finite' ? result.v : NaN
  const uSigned = -uMag

  const maxX = Math.max(uMag, isFinite(v) ? Math.abs(v) : 0, 2 * f) * 1.25 + 10
  const pxPerCm = (w - 2 * marginX) / (2 * maxX)
  const xToPx = (xCm: number) => marginX + (xCm + maxX) * pxPerCm
  const yToPx = (yCm: number) => axisY - yCm * pxPerCm

  const lensX = xToPx(0)
  const fLeftX = xToPx(-f)
  const fRightX = xToPx(f)

  const objX = xToPx(-uMag)
  const objTopY = yToPx(ho)

  const imgX = result.kind === 'finite' ? xToPx(result.v) : xToPx(maxX - 5)
  const imgTopY = result.kind === 'finite' ? yToPx(result.hi) : yToPx(0)

  const rayColor = 'var(--accent)'
  const axisColor = 'color-mix(in oklab, var(--text) 35%, transparent)'

  // Ray 1: from object top parallel to axis, hits lens, then through focal point (right focus).
  const ray1_a = { x: objX, y: objTopY }
  const ray1_b = { x: lensX, y: objTopY }
  const throughFR_slope = (axisY - ray1_b.y) / (fRightX - ray1_b.x) // line passing through (f, axis)

  const ray1_toX = (x: number) => ({ x, y: ray1_b.y + throughFR_slope * (x - ray1_b.x) })
  const ray1_c = ray1_toX(result.kind === 'finite' ? imgX : xToPx(maxX))

  // Ray 2: through optical center (straight line).
  const ray2_a = { x: objX, y: objTopY }
  const ray2_b = { x: lensX, y: axisY + ((lensX - objX) === 0 ? 0 : ((axisY - objTopY) * (lensX - objX)) / (0 - objX)) }
  const ray2_slope = (ray2_b.y - ray2_a.y) / (ray2_b.x - ray2_a.x)
  const ray2_toX = (x: number) => ({ x, y: ray2_b.y + ray2_slope * (x - ray2_b.x) })
  const ray2_c = ray2_toX(result.kind === 'finite' ? imgX : xToPx(maxX))

  const showVirtual = result.kind === 'finite' && result.v < 0
  const virtualX = showVirtual ? imgX : null

  const imageSummary = classifyImage(result)

  return (
    <div className="diagramWrap" role="img" aria-label="Convex lens ray diagram">
      <svg viewBox={`0 0 ${w} ${h}`} className="diagram">
        <defs>
          <marker id="arrow" markerWidth="10" markerHeight="10" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L6,3 L0,6 Z" fill={rayColor} />
          </marker>
          <marker id="arrowAxis" markerWidth="10" markerHeight="10" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L6,3 L0,6 Z" fill={axisColor} />
          </marker>
        </defs>

        {/* optical axis */}
        <line x1={marginX} y1={axisY} x2={w - marginX} y2={axisY} stroke={axisColor} strokeWidth={2} markerEnd="url(#arrowAxis)" />

        {/* lens */}
        <line x1={lensX} y1={40} x2={lensX} y2={h - 40} stroke="var(--text)" strokeWidth={3} />
        <path
          d={`M ${lensX - 10} 55 Q ${lensX + 20} ${h / 2} ${lensX - 10} ${h - 55}`}
          fill="none"
          stroke="color-mix(in oklab, var(--text) 60%, transparent)"
          strokeWidth={3}
        />
        <path
          d={`M ${lensX + 10} 55 Q ${lensX - 20} ${h / 2} ${lensX + 10} ${h - 55}`}
          fill="none"
          stroke="color-mix(in oklab, var(--text) 60%, transparent)"
          strokeWidth={3}
        />

        {/* focal points */}
        <circle cx={fLeftX} cy={axisY} r={4} fill="var(--text)" />
        <circle cx={fRightX} cy={axisY} r={4} fill="var(--text)" />
        <text x={fLeftX - 14} y={axisY + 22} fontSize="14" fill="var(--text)">
          F
        </text>
        <text x={fRightX - 6} y={axisY + 22} fontSize="14" fill="var(--text)">
          F
        </text>

        {/* object arrow */}
        <line x1={objX} y1={axisY} x2={objX} y2={objTopY} stroke="var(--text)" strokeWidth={3} />
        <polygon points={`${objX},${objTopY} ${objX - 7},${objTopY + 12} ${objX + 7},${objTopY + 12}`} fill="var(--text)" />
        <text x={objX - 18} y={axisY + 28} fontSize="14" fill="var(--text)">
          O
        </text>

        {/* image arrow */}
        {result.kind === 'finite' ? (
          <>
            <line x1={imgX} y1={axisY} x2={imgX} y2={imgTopY} stroke="var(--text)" strokeWidth={3} />
            <polygon
              points={
                result.hi >= 0
                  ? `${imgX},${imgTopY} ${imgX - 7},${imgTopY + 12} ${imgX + 7},${imgTopY + 12}`
                  : `${imgX},${imgTopY} ${imgX - 7},${imgTopY - 12} ${imgX + 7},${imgTopY - 12}`
              }
              fill="var(--text)"
            />
            <text x={imgX - 14} y={axisY + 28} fontSize="14" fill="var(--text)">
              I
            </text>
          </>
        ) : (
          <text x={lensX + 18} y={60} fontSize="14" fill="var(--text)">
            Image at infinity (u = f)
          </text>
        )}

        {/* rays */}
        <path
          d={`M ${ray1_a.x} ${ray1_a.y} L ${ray1_b.x} ${ray1_b.y} L ${ray1_c.x} ${ray1_c.y}`}
          fill="none"
          stroke={rayColor}
          strokeWidth={3}
          markerEnd="url(#arrow)"
        />
        <path
          d={`M ${ray2_a.x} ${ray2_a.y} L ${ray2_b.x} ${ray2_b.y} L ${ray2_c.x} ${ray2_c.y}`}
          fill="none"
          stroke={rayColor}
          strokeWidth={3}
          markerEnd="url(#arrow)"
        />

        {/* virtual extensions (dashed) */}
        {showVirtual && virtualX != null ? (
          <>
            <path
              d={`M ${ray1_b.x} ${ray1_b.y} L ${virtualX} ${ray1_toX(virtualX).y}`}
              fill="none"
              stroke={rayColor}
              strokeWidth={2.5}
              strokeDasharray="6 6"
              opacity={0.85}
            />
            <path
              d={`M ${ray2_b.x} ${ray2_b.y} L ${virtualX} ${ray2_toX(virtualX).y}`}
              fill="none"
              stroke={rayColor}
              strokeWidth={2.5}
              strokeDasharray="6 6"
              opacity={0.85}
            />
          </>
        ) : null}

        {/* labels */}
        <text x={marginX} y={28} fontSize="14" fill="var(--text)">
          Sign convention: +x to right, object u is negative (left side), f &gt; 0 for convex lens
        </text>
        <text x={marginX} y={h - 18} fontSize="14" fill="color-mix(in oklab, var(--text) 65%, transparent)">
          {`f = ${roundTo(f, 2)} cm, u = ${fmtSigned(uSigned, 2)} cm, ${imageSummary.imageType} · ${imageSummary.orientation} · ${imageSummary.size}`}
        </text>
      </svg>
    </div>
  )
}

function App() {
  const [f, setF] = useState(10) // cm
  const [uMag, setUMag] = useState(25) // cm (magnitude; object at x = -uMag)
  const [ho, setHo] = useState(4) // cm

  const uSigned = -uMag
  const res = solveThinLens({ f, uSigned, ho })
  const info = classifyImage(res)

  const vDisplay = res.kind === 'finite' ? fmtSigned(res.v, 2) : '∞'
  const mDisplay = res.kind === 'finite' ? fmtSigned(res.m, 3) : '—'
  const hiDisplay = res.kind === 'finite' ? fmtSigned(res.hi, 2) : '—'

  return (
    <div className="page">
      <header className="header">
        <div>
          <h1>Convex Lens Simulator (HK F3)</h1>
          <p className="sub">
            Explore how object distance and focal length affect <strong>image distance</strong> and <strong>magnification</strong>.
          </p>
        </div>
        <div className="badge">Thin lens · Ray diagram</div>
      </header>

      <main className="grid">
        <section className="card">
          <h2>Inputs</h2>

          <div className="control">
            <div className="row">
              <label htmlFor="f">Focal length, f (cm)</label>
              <output>{roundTo(f, 1).toFixed(1)}</output>
            </div>
            <input
              id="f"
              type="range"
              min={2}
              max={30}
              step={0.5}
              value={f}
              onChange={(e) => setF(Number(e.target.value))}
            />
          </div>

          <div className="control">
            <div className="row">
              <label htmlFor="u">Object distance magnitude, |u| (cm)</label>
              <output>{roundTo(uMag, 1).toFixed(1)}</output>
            </div>
            <input
              id="u"
              type="range"
              min={2}
              max={120}
              step={0.5}
              value={uMag}
              onChange={(e) => setUMag(Number(e.target.value))}
            />
            <div className="hint">
              Object is placed on the <strong>left</strong> of the lens, so signed \(u = -|u|\).
            </div>
          </div>

          <div className="control">
            <div className="row">
              <label htmlFor="ho">Object height, hₒ (cm)</label>
              <output>{roundTo(ho, 1).toFixed(1)}</output>
            </div>
            <input
              id="ho"
              type="range"
              min={0.5}
              max={12}
              step={0.5}
              value={ho}
              onChange={(e) => setHo(Number(e.target.value))}
            />
          </div>

          <div className="quickBtns">
            <button type="button" onClick={() => setUMag((x) => clamp(x, f + 0.5, 120))}>
              Make image real (|u| &gt; f)
            </button>
            <button type="button" onClick={() => setUMag((x) => clamp(x, 2, Math.max(2, f - 0.5)))}>
              Make image virtual (|u| &lt; f)
            </button>
            <button type="button" onClick={() => { setF(10); setUMag(25); setHo(4) }}>
              Reset
            </button>
          </div>
        </section>

        <section className="card">
          <h2>Results</h2>

          <div className="kpiGrid">
            <div className="kpi">
              <div className="k">Signed object distance, u (cm)</div>
              <div className="v">{fmtSigned(uSigned, 2)}</div>
            </div>
            <div className="kpi">
              <div className="k">Image distance, v (cm)</div>
              <div className="v">{vDisplay}</div>
            </div>
            <div className="kpi">
              <div className="k">Magnification, m = v / u</div>
              <div className="v">{mDisplay}</div>
            </div>
            <div className="kpi">
              <div className="k">Image height, hᵢ = m hₒ (cm)</div>
              <div className="v">{hiDisplay}</div>
            </div>
          </div>

          <div className="pillRow">
            <span className="pill">{info.imageType}</span>
            <span className="pill">{info.orientation}</span>
            <span className="pill">{info.size}</span>
          </div>

          <div className="formula">
            <div className="formulaTitle">Thin lens formula (Cartesian sign convention)</div>
            <div className="eq">1/f = 1/v − 1/u</div>
            <div className="note">
              For a convex lens, \(f &gt; 0\). For a real object on the left, \(u &lt; 0\). Virtual images have \(v &lt; 0\).
            </div>
          </div>
        </section>

        <section className="card wide">
          <h2>Ray diagram</h2>
          <RayDiagram f={f} uMag={uMag} ho={ho} result={res} />
          <div className="small">
            Rays drawn: (1) parallel to axis then through focal point, (2) through optical centre. For virtual images, dashed lines show back extensions.
          </div>
        </section>
      </main>

      <footer className="footer">
        Tip: Try \( |u| = 2f \) (same-size real inverted image), and \( |u| = f \) (image at infinity).
      </footer>
    </div>
  )
}

export default App
