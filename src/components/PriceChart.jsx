import { useEffect, useId, useMemo, useRef, useState } from "react"
import { fetchCoinMarketChart } from "../services/coingecko"
import {
  formatChartTime,
  formatPercent,
  formatPrice
} from "../utils/format"

const PERIODS = [
  { id: "1", label: "24Ч" },
  { id: "7", label: "7Д" },
  { id: "30", label: "30Д" },
  { id: "90", label: "90Д" },
  { id: "365", label: "1Г" }
]

const SVG_WIDTH = 720
const SVG_HEIGHT = 240
const PAD_X = 8
const PAD_Y = 20

function buildSparklinePoints(sparklinePrices) {
  if (!Array.isArray(sparklinePrices) || sparklinePrices.length < 2) return []
  const now = Date.now()
  const totalMs = 7 * 24 * 60 * 60 * 1000
  const stepMs = totalMs / (sparklinePrices.length - 1)
  return sparklinePrices.map((price, idx) => [
    now - totalMs + idx * stepMs,
    price
  ])
}

export default function PriceChart({ coin }) {
  const [period, setPeriod] = useState("7")
  const [chartState, setChartState] = useState({
    status: "ready",
    points: [],
    error: null
  })
  const [hoverIndex, setHoverIndex] = useState(null)
  const [reloadTick, setReloadTick] = useState(0)
  const svgRef = useRef(null)
  const gradientId = useId()

  const sparklinePoints = useMemo(
    () => buildSparklinePoints(coin.sparkline_in_7d?.price),
    [coin.sparkline_in_7d]
  )

  useEffect(() => {
    setPeriod("7")
    setHoverIndex(null)
  }, [coin.id])

  useEffect(() => {
    setHoverIndex(null)

    if (period === "7" && sparklinePoints.length >= 2) {
      setChartState({ status: "ready", points: sparklinePoints, error: null })
      return
    }

    const controller = new AbortController()
    setChartState((prev) => ({
      status: "loading",
      points: prev.points,
      error: null
    }))

    fetchCoinMarketChart(coin.id, period, controller.signal)
      .then((points) => {
        if (!controller.signal.aborted) {
          setChartState({ status: "ready", points, error: null })
        }
      })
      .catch((err) => {
        if (err?.name === "AbortError" || controller.signal.aborted) return
        setChartState({
          status: "error",
          points: sparklinePoints,
          error: err?.message || "Не удалось загрузить данные графика."
        })
      })

    return () => controller.abort()
  }, [coin.id, period, sparklinePoints, reloadTick])

  const points = chartState.points

  const chartGeometry = useMemo(() => {
    if (!points || points.length < 2) return null

    const prices = points.map((p) => p[1])
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const range = max - min || 1

    const coords = points.map(([ts, price], idx) => {
      const x =
        PAD_X + (idx / (points.length - 1)) * (SVG_WIDTH - PAD_X * 2)
      const y =
        SVG_HEIGHT -
        PAD_Y -
        ((price - min) / range) * (SVG_HEIGHT - PAD_Y * 2)
      return { x, y, ts, price }
    })

    const linePath = coords
      .map(
        (pt, idx) =>
          `${idx === 0 ? "M" : "L"}${pt.x.toFixed(1)},${pt.y.toFixed(1)}`
      )
      .join(" ")

    const first = coords[0]
    const last = coords[coords.length - 1]
    const areaPath = `${linePath} L${last.x.toFixed(1)},${SVG_HEIGHT} L${first.x.toFixed(
      1
    )},${SVG_HEIGHT} Z`

    const deltaPct = first.price
      ? ((last.price - first.price) / first.price) * 100
      : 0

    return {
      coords,
      linePath,
      areaPath,
      min,
      max,
      deltaPct,
      isPositive: deltaPct >= 0
    }
  }, [points])

  function handlePointerMove(event) {
    if (!svgRef.current || !chartGeometry) return
    const rect = svgRef.current.getBoundingClientRect()
    if (!rect.width) return
    const relX = (event.clientX - rect.left) / rect.width
    const clamped = Math.max(0, Math.min(1, relX))
    const idx = Math.round(clamped * (chartGeometry.coords.length - 1))
    setHoverIndex(idx)
  }

  const activePoint =
    hoverIndex !== null && chartGeometry
      ? chartGeometry.coords[hoverIndex]
      : null

  const strokeColor = chartGeometry?.isPositive
    ? "var(--positive)"
    : "var(--negative)"

  const tooltipLeftPct = activePoint
    ? Math.max(12, Math.min(88, (activePoint.x / SVG_WIDTH) * 100))
    : 50

  return (
    <div className="chart-section glass-subpanel">
      <div className="chart-header">
        <div className="chart-price-readout">
          <div className="chart-active-price mono">
            {formatPrice(activePoint ? activePoint.price : coin.current_price)}
          </div>
          <div className="chart-active-meta">
            {activePoint ? (
              <span className="chart-hover-date mono">
                {formatChartTime(activePoint.ts, period)}
              </span>
            ) : (
              chartGeometry && (
                <span
                  className={`change-pill mono ${
                    chartGeometry.isPositive ? "positive" : "negative"
                  }`}
                >
                  {chartGeometry.isPositive ? "▲" : "▼"}{" "}
                  {formatPercent(chartGeometry.deltaPct)} за{" "}
                  {PERIODS.find((p) => p.id === period)?.label}
                </span>
              )
            )}
          </div>
        </div>

        <div className="chart-periods" role="tablist" aria-label="Период графика">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={period === p.id}
              className={`period-btn mono${period === p.id ? " active" : ""}`}
              onClick={() => setPeriod(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-canvas-wrap">
        {chartState.status === "loading" && (
          <div className="chart-overlay" role="status" aria-live="polite">
            <span className="spinner" aria-hidden="true" />
            <span>Загрузка графика…</span>
          </div>
        )}

        {chartState.status === "error" && (
          <div className="chart-error-banner" role="alert">
            <span>{chartState.error}</span>
            <div className="chart-error-actions">
              <button
                type="button"
                className="btn-ghost-sm"
                onClick={() => setReloadTick((t) => t + 1)}
              >
                Повторить
              </button>
              {period !== "7" && sparklinePoints.length >= 2 && (
                <button
                  type="button"
                  className="btn-ghost-sm"
                  onClick={() => setPeriod("7")}
                >
                  Показать 7Д
                </button>
              )}
            </div>
          </div>
        )}

        {chartGeometry ? (
          <div
            className="chart-svg-box"
            onPointerMove={handlePointerMove}
            onPointerLeave={() => setHoverIndex(null)}
          >
            {activePoint && (
              <div
                className="chart-tooltip"
                style={{ left: `${tooltipLeftPct}%` }}
              >
                <div className="chart-tooltip-price mono">
                  {formatPrice(activePoint.price)}
                </div>
                <div className="chart-tooltip-time mono">
                  {formatChartTime(activePoint.ts, period)}
                </div>
              </div>
            )}

            <svg
              ref={svgRef}
              className="price-chart-svg"
              viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
              preserveAspectRatio="none"
              role="img"
              aria-label={`График цены ${coin.name}`}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={strokeColor} stopOpacity="0.34" />
                  <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
                </linearGradient>
              </defs>

              <line
                x1={PAD_X}
                y1={PAD_Y}
                x2={SVG_WIDTH - PAD_X}
                y2={PAD_Y}
                className="chart-grid-line"
              />
              <line
                x1={PAD_X}
                y1={SVG_HEIGHT / 2}
                x2={SVG_WIDTH - PAD_X}
                y2={SVG_HEIGHT / 2}
                className="chart-grid-line"
              />
              <line
                x1={PAD_X}
                y1={SVG_HEIGHT - PAD_Y}
                x2={SVG_WIDTH - PAD_X}
                y2={SVG_HEIGHT - PAD_Y}
                className="chart-grid-line"
              />

              <path d={chartGeometry.areaPath} fill={`url(#${gradientId})`} />
              <path
                d={chartGeometry.linePath}
                fill="none"
                stroke={strokeColor}
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {activePoint && (
                <>
                  <line
                    x1={activePoint.x}
                    y1={PAD_Y / 2}
                    x2={activePoint.x}
                    y2={SVG_HEIGHT - PAD_Y / 2}
                    stroke="var(--chart-crosshair)"
                    strokeWidth="1.2"
                    strokeDasharray="4 4"
                  />
                  <circle
                    cx={activePoint.x}
                    cy={activePoint.y}
                    r="8"
                    fill={strokeColor}
                    fillOpacity="0.25"
                  />
                  <circle
                    cx={activePoint.x}
                    cy={activePoint.y}
                    r="4.2"
                    fill={strokeColor}
                    stroke="var(--bg-base)"
                    strokeWidth="2"
                  />
                </>
              )}
            </svg>

            <div className="chart-bounds mono">
              <span>Мин: {formatPrice(chartGeometry.min)}</span>
              <span>Макс: {formatPrice(chartGeometry.max)}</span>
            </div>
          </div>
        ) : (
          <div className="chart-empty">Нет данных для построения графика</div>
        )}
      </div>
    </div>
  )
}
