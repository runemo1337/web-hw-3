import CoinCard from "./CoinCard"

export default function CoinList({ coins }) {
  return (
    <div className="grid">
      {coins.map((coin) => (
        <CoinCard key={coin.id} coin={coin} />
      ))}
    </div>
  )
}
