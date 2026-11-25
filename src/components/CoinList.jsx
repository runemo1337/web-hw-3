import CoinCard from "./CoinCard"

export default function CoinList({
  coins,
  favoritesSet,
  onToggleFavorite,
  onSelectCoin
}) {
  return (
    <div className="coins-grid">
      {coins.map((coin) => (
        <CoinCard
          key={coin.id}
          coin={coin}
          isFavorite={favoritesSet.has(coin.id)}
          onToggleFavorite={onToggleFavorite}
          onSelect={onSelectCoin}
        />
      ))}
    </div>
  )
}
