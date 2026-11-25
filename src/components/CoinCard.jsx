function formatPrice(price) {
  if (price >= 1) {
    return price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }
  return price.toLocaleString("en-US", { maximumSignificantDigits: 4 })
}

export default function CoinCard({ coin }) {
  const change = coin.price_change_percentage_24h ?? 0
  const isPositive = change >= 0

  return (
    <article className="coin-card">
      <div className="coin-top">
        <img className="coin-image" src={coin.image} alt={coin.name} />
        <div className="coin-info">
          <span className="coin-symbol">{coin.symbol.toUpperCase()}</span>
          <span className="coin-name">{coin.name}</span>
        </div>
        <span
          className={
            isPositive ? "change-badge positive" : "change-badge negative"
          }
        >
          {isPositive ? "▲" : "▼"} {change.toFixed(2)}%
        </span>
      </div>
      <div className="coin-price">${formatPrice(coin.current_price ?? 0)}</div>
    </article>
  )
}
