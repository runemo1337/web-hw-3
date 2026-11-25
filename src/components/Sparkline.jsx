import { useId } from "react"

export default function Sparkline({ prices, isPositive, width = 220, height = 48 }) {
  const gradientId = useId()

  if (!Array.isArray(prices) || prices.length < 2) {
    return <div className="sparkline-placeholder" aria-hidden="true" />
  }

  // Downsample for smoother, lighter SVG paths
  const step = Math.max(1, Math.floor(prices.length / 42))
  const sampled = []
  for (let i = 0; i < prices.length; i += step) {
    sampled.push(prices[i])
  }
  if (sampled[sampled.length - 1] !== prices[prices.length - 1]) {
    sampled.push(prices[prices.length - 1])
  }

  const min = Math.min(...sampled)
  const max = Math.max(...sampled)
  const range = max - min || 1
  const padY = 4

  const points = sampled.map((value, idx) => {
    const x = (idx / (sampled.length - 1)) * width
    const y = height - padY - ((value - min) / range) * (height - padY * 2)
    return [x, y]
  })

  const linePath = points
    .map(([x, y], idx) => `${idx === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ")

  const areaPath = `${linePath} L${width},${height} L0,${height} Z`
  const strokeColor = isPositive ? "#10b981" : "#f43f5e"

  return (
    <svg
      className="sparkline-svg"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.32" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path
        d={linePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
