import { useEffect, useState } from "react"
import SearchBar from "./components/SearchBar"
import CoinList from "./components/CoinList"
import StatusMessage from "./components/StatusMessage"
import "./App.css"

const API_URL =
  "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1"

export default function App() {
  const [coins, setCoins] = useState([])
  const [searchValue, setSearchValue] = useState("")
  const [loadState, setLoadState] = useState({ status: "loading" })
  const [reloadCount, setReloadCount] = useState(0)

  useEffect(() => {
    let ignore = false

    async function loadCoins() {
      setLoadState({ status: "loading" })
      try {
        const response = await fetch(API_URL)
        if (!response.ok) {
          throw new Error("Ошибка загрузки данных")
        }
        const data = await response.json()
        if (!ignore) {
          setCoins(data)
          setLoadState({ status: "ready" })
        }
      } catch {
        if (!ignore) {
          setLoadState({
            status: "error",
            message: "Не удалось загрузить данные. Проверьте соединение и попробуйте ещё раз."
          })
        }
      }
    }

    loadCoins()

    return () => {
      ignore = true
    }
  }, [reloadCount])

  const query = searchValue.trim().toLowerCase()
  const filteredCoins = coins.filter((coin) => {
    const symbol = coin.symbol.toLowerCase()
    const name = coin.name.toLowerCase()
    return symbol.startsWith(query) || name.includes(query)
  })

  function reload() {
    setReloadCount((count) => count + 1)
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-text">
          <h1>Crypto Tracker</h1>
          <p>Топ-100 криптовалют по капитализации</p>
        </div>
        <div className="controls">
          <SearchBar value={searchValue} onChange={setSearchValue} />
          <button className="refresh-button" onClick={reload}>
            Обновить данные
          </button>
        </div>
      </header>

      <main>
        {loadState.status === "loading" && (
          <>
            <StatusMessage message="Загрузка данных..." />
            <div className="grid">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="skeleton-card" />
              ))}
            </div>
          </>
        )}

        {loadState.status === "error" && (
          <StatusMessage message={loadState.message} onRetry={reload} />
        )}

        {loadState.status === "ready" && filteredCoins.length === 0 && (
          <StatusMessage message="Ничего не найдено" />
        )}

        {loadState.status === "ready" && filteredCoins.length > 0 && (
          <CoinList coins={filteredCoins} />
        )}
      </main>

      <footer className="footer">
        Алимурадов Руслан 24кнт-6 · Штыров Иван 24кнт-1
      </footer>
    </div>
  )
}
