import Sparkline from "./Sparkline"
import {
  formatCompactCurrency,
  formatPercent,
  formatPrice
} from "../utils/format"

export default function CoinCard({
  coin,
  isFavorite,
  onToggleFavorite,
  onSelect
}) {
  const change24h = coin.price_change_percentage_24h ?? 0
  const isPositive24h = change24h >= 0

  const sparklinePrices = coin.sparkline_in_7d?.price
  const change7d =
    coin.price_change_percentage_7d_in_currency ??
    (sparklinePrices && sparklinePrices.length >= 2
      ? sparklinePrices[sparklinePrices.length - 1] - sparklinePrices[0]
      : change24h)
  const isSparklinePositive = change7d >= 0

  return (
    <article className="coin-card glass-panel">
      <button
        type="button"
        className="coin-card-trigger"
        onClick={() => onSelect(coin)}
        aria-label={`Открыть статистику ${coin.name} (${coin.symbol.toUpperCase()})`}
      />

      <div className="coin-card-header">
        <div className="coin-identity">
          <div className="coin-icon-wrap">
            <img
              className="coin-image"
              src={coin.image}
              alt={coin.name}
              loading="lazy"
            />
          </div>
          <div className="coin-titles">
            <div className="coin-name-line">
              <span className="coin-name">{coin.name}</span>
            </div>
            <div className="coin-meta-line">
              <span className="coin-rank mono">
                #{coin.market_cap_rank ?? "—"}
              </span>
              <span className="coin-symbol mono">
                {coin.symbol.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          className={`fav-button${isFavorite ? " active" : ""}`}
          onClick={() => onToggleFavorite(coin.id)}
          aria-label={
            isFavorite
              ? `Убрать ${coin.name} из избранного`
              : `Добавить ${coin.name} в избранное`
          }
          aria-pressed={isFavorite}
          title={isFavorite ? "В избранном" : "В избранное"}
        >
          {isFavorite ? "★" : "☆"}
        </button>
      </div>

      <div className="coin-price-row">
        <div className="coin-price mono">{formatPrice(coin.current_price)}</div>
        <span
          className={`change-pill mono ${
            isPositive24h ? "positive" : "negative"
          }`}
        >
          {isPositive24h ? "▲" : "▼"} {formatPercent(change24h, { signed: false })}
        </span>
      </div>

      <div className="coin-sparkline-wrap">
        <Sparkline
          prices={sparklinePrices}
          isPositive={isSparklinePositive}
        />
        <span className="sparkline-caption mono">7Д</span>
      </div>

      <div className="coin-card-footer">
        <div className="coin-stat">
          <span className="coin-stat-label">Капитализация</span>
          <span className="coin-stat-val mono">
            {formatCompactCurrency(coin.market_cap)}
          </span>
        </div>
        <div className="coin-stat">
          <span className="coin-stat-label">Объём 24ч</span>
          <span className="coin-stat-val mono">
            {formatCompactCurrency(coin.total_volume)}
          </span>
        </div>
        <span className="coin-more-hint" aria-hidden="true">
          Подробнее →
        </span>
      </div>
    </article>
  )
}
