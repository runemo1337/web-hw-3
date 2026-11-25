import { formatCompactCurrency, formatPercent } from "../utils/format"

export default function MarketOverview({ coins, onSelectCoin }) {
  if (!coins || coins.length === 0) return null

  const totalMarketCap = coins.reduce((sum, c) => sum + (c.market_cap || 0), 0)
  const totalVolume = coins.reduce((sum, c) => sum + (c.total_volume || 0), 0)

  const withChange = coins.filter(
    (c) => typeof c.price_change_percentage_24h === "number"
  )

  const topGainer = withChange.reduce(
    (best, c) =>
      !best || c.price_change_percentage_24h > best.price_change_percentage_24h
        ? c
        : best,
    null
  )

  const topLoser = withChange.reduce(
    (worst, c) =>
      !worst || c.price_change_percentage_24h < worst.price_change_percentage_24h
        ? c
        : worst,
    null
  )

  const gainersCount = withChange.filter(
    (c) => c.price_change_percentage_24h >= 0
  ).length
  const losersCount = withChange.length - gainersCount
  const gainersPct = withChange.length
    ? Math.round((gainersCount / withChange.length) * 100)
    : 50

  return (
    <section className="bento-overview" aria-label="Обзор рынка">
      <div className="bento-card glass-panel">
        <span className="bento-label">Капитализация Топ-100</span>
        <div className="bento-value mono">
          {formatCompactCurrency(totalMarketCap)}
        </div>
        <div className="bento-sub">
          Объём 24ч:{" "}
          <span className="mono bento-sub-strong">
            {formatCompactCurrency(totalVolume)}
          </span>
        </div>
      </div>

      {topGainer && (
        <button
          type="button"
          className="bento-card bento-card-interactive glass-panel"
          onClick={() => onSelectCoin(topGainer)}
        >
          <div className="bento-top-row">
            <span className="bento-label">Лидер роста 24ч</span>
            <span className="change-pill positive mono">
              ▲ {formatPercent(topGainer.price_change_percentage_24h)}
            </span>
          </div>
          <div className="bento-coin-row">
            <img
              className="bento-coin-icon"
              src={topGainer.image}
              alt={topGainer.name}
            />
            <div className="bento-coin-meta">
              <span className="bento-coin-name">{topGainer.name}</span>
              <span className="bento-coin-symbol mono">
                {topGainer.symbol.toUpperCase()}
              </span>
            </div>
            <span className="bento-arrow" aria-hidden="true">
              →
            </span>
          </div>
        </button>
      )}

      {topLoser && (
        <button
          type="button"
          className="bento-card bento-card-interactive glass-panel"
          onClick={() => onSelectCoin(topLoser)}
        >
          <div className="bento-top-row">
            <span className="bento-label">Лидер падения 24ч</span>
            <span className="change-pill negative mono">
              ▼ {formatPercent(topLoser.price_change_percentage_24h)}
            </span>
          </div>
          <div className="bento-coin-row">
            <img
              className="bento-coin-icon"
              src={topLoser.image}
              alt={topLoser.name}
            />
            <div className="bento-coin-meta">
              <span className="bento-coin-name">{topLoser.name}</span>
              <span className="bento-coin-symbol mono">
                {topLoser.symbol.toUpperCase()}
              </span>
            </div>
            <span className="bento-arrow" aria-hidden="true">
              →
            </span>
          </div>
        </button>
      )}

      <div className="bento-card glass-panel">
        <div className="bento-top-row">
          <span className="bento-label">Пульс рынка</span>
          <span className="bento-pulse-pct mono">{gainersPct}% в плюсе</span>
        </div>
        <div className="pulse-bar" aria-hidden="true">
          <div
            className="pulse-bar-fill"
            style={{ width: `${gainersPct}%` }}
          />
        </div>
        <div className="pulse-counts mono">
          <span className="text-positive">▲ {gainersCount} растут</span>
          <span className="text-negative">▼ {losersCount} падают</span>
        </div>
      </div>
    </section>
  )
}
