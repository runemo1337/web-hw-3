import { useCallback, useEffect, useMemo, useState } from "react"
import MarketOverview from "./components/MarketOverview"
import ControlsBar from "./components/ControlsBar"
import CoinList from "./components/CoinList"
import StatusMessage from "./components/StatusMessage"
import CoinDetailModal from "./components/CoinDetailModal"
import { fetchMarketCoins } from "./services/coingecko"
import { formatDateRu } from "./utils/format"
import "./App.css"

const FAVORITES_KEY = "crypto_tracker_favorites_v1"

function readFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function getCoinIdFromHash() {
  const match = window.location.hash.match(/^#coin\/([^/?#]+)$/)
  return match ? decodeURIComponent(match[1]) : null
}

export default function App() {
  const [coins, setCoins] = useState([])
  const [loadState, setLoadState] = useState({ status: "loading", message: "" })
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [updatedAt, setUpdatedAt] = useState(null)

  const [searchValue, setSearchValue] = useState("")
  const [activeFilter, setActiveFilter] = useState("all")
  const [sortBy, setSortBy] = useState("market_cap")
  const [favorites, setFavorites] = useState(readFavorites)
  const [selectedCoinId, setSelectedCoinId] = useState(getCoinIdFromHash)

  const loadCoins = useCallback(async ({ force = false, signal } = {}) => {
    setLoadState((prev) =>
      prev.status === "ready"
        ? prev
        : { status: "loading", message: "" }
    )
    setIsRefreshing(true)

    try {
      const result = await fetchMarketCoins({ force, signal })
      if (signal?.aborted) return
      setCoins(result.data)
      setUpdatedAt(result.updatedAt)
      setLoadState({ status: "ready", message: "" })
    } catch (err) {
      if (err?.name === "AbortError" || signal?.aborted) return
      setLoadState((prev) => ({
        status: prev.status === "ready" ? "ready" : "error",
        message:
          err?.message ||
          "Не удалось загрузить данные. Проверьте соединение и попробуйте ещё раз."
      }))
    } finally {
      if (!signal?.aborted) {
        setIsRefreshing(false)
      }
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    loadCoins({ force: false, signal: controller.signal })
    return () => controller.abort()
  }, [loadCoins])

  // Persist favorites
  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
    } catch {
      // Ignore storage errors
    }
  }, [favorites])

  // Sync URL hash -> selectedCoinId
  useEffect(() => {
    function handleHashChange() {
      setSelectedCoinId(getCoinIdFromHash())
    }
    window.addEventListener("hashchange", handleHashChange)
    return () => window.removeEventListener("hashchange", handleHashChange)
  }, [])

  const openCoinModal = useCallback((coin) => {
    setSelectedCoinId(coin.id)
    const nextHash = `#coin/${encodeURIComponent(coin.id)}`
    if (window.location.hash !== nextHash) {
      window.history.pushState(null, "", nextHash)
    }
  }, [])

  const closeCoinModal = useCallback(() => {
    setSelectedCoinId(null)
    if (window.location.hash.startsWith("#coin/")) {
      window.history.pushState(
        null,
        "",
        window.location.pathname + window.location.search
      )
    }
  }, [])

  const toggleFavorite = useCallback((id) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }, [])

  const favoritesSet = useMemo(() => new Set(favorites), [favorites])

  const selectedCoin = useMemo(
    () => coins.find((c) => c.id === selectedCoinId) || null,
    [coins, selectedCoinId]
  )

  const displayedCoins = useMemo(() => {
    const query = searchValue.trim().toLowerCase()

    let list = coins.filter((coin) => {
      if (query) {
        const symbol = (coin.symbol || "").toLowerCase()
        const name = (coin.name || "").toLowerCase()
        if (!symbol.startsWith(query) && !name.includes(query)) {
          return false
        }
      }

      if (activeFilter === "favorites") {
        return favoritesSet.has(coin.id)
      }
      if (activeFilter === "gainers") {
        return (coin.price_change_percentage_24h ?? 0) > 0
      }
      if (activeFilter === "losers") {
        return (coin.price_change_percentage_24h ?? 0) < 0
      }
      return true
    })

    list = [...list].sort((a, b) => {
      if (activeFilter === "gainers" && sortBy === "market_cap") {
        return (
          (b.price_change_percentage_24h ?? -Infinity) -
          (a.price_change_percentage_24h ?? -Infinity)
        )
      }
      if (activeFilter === "losers" && sortBy === "market_cap") {
        return (
          (a.price_change_percentage_24h ?? Infinity) -
          (b.price_change_percentage_24h ?? Infinity)
        )
      }

      switch (sortBy) {
        case "price":
          return (b.current_price ?? 0) - (a.current_price ?? 0)
        case "change_24h":
          return (
            (b.price_change_percentage_24h ?? -Infinity) -
            (a.price_change_percentage_24h ?? -Infinity)
          )
        case "volume":
          return (b.total_volume ?? 0) - (a.total_volume ?? 0)
        case "market_cap":
        default:
          return (a.market_cap_rank ?? 9999) - (b.market_cap_rank ?? 9999)
      }
    })

    return list
  }, [coins, searchValue, activeFilter, sortBy, favoritesSet])

  return (
    <div className="app-shell">
      <div className="aurora-bg" aria-hidden="true">
        <div className="aurora-blob blob-1" />
        <div className="aurora-blob blob-2" />
        <div className="aurora-blob blob-3" />
        <div className="bg-grid" />
      </div>

      <div className="app-container">
        <header className="hero-header">
          <div className="hero-brand">
            <div className="live-pill">
              <span className="live-dot" aria-hidden="true" />
              <span>LIVE MARKET</span>
            </div>
            <h1 className="hero-title">Crypto Tracker</h1>
            <p className="hero-subtitle">
              Топ-100 криптовалют по капитализации · интерактивные графики и
              аналитика в реальном времени
            </p>
          </div>

          <div className="hero-actions">
            {updatedAt && (
              <span className="updated-stamp mono">
                Обновлено: {formatDateRu(updatedAt, { withTime: true })}
              </span>
            )}
            <button
              type="button"
              className="btn-primary refresh-btn"
              onClick={() => loadCoins({ force: true })}
              disabled={isRefreshing}
            >
              <span
                className={`refresh-icon${isRefreshing ? " spinning" : ""}`}
                aria-hidden="true"
              >
                ↻
              </span>
              <span>{isRefreshing ? "Обновление…" : "Обновить"}</span>
            </button>
          </div>
        </header>

        {loadState.status === "ready" && loadState.message && (
          <div className="inline-toast" role="alert">
            <span>{loadState.message}</span>
            <button
              type="button"
              className="btn-ghost-sm"
              onClick={() => setLoadState({ status: "ready", message: "" })}
            >
              Скрыть
            </button>
          </div>
        )}

        <main className="main-content">
          {loadState.status === "loading" && (
            <>
              <div className="bento-overview">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="skeleton-bento glass-panel" />
                ))}
              </div>
              <div className="coins-grid">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="skeleton-card glass-panel" />
                ))}
              </div>
            </>
          )}

          {loadState.status === "error" && (
            <StatusMessage
              variant="error"
              title="Ошибка загрузки"
              message={loadState.message}
              onRetry={() => loadCoins({ force: true })}
            />
          )}

          {loadState.status === "ready" && (
            <>
              <MarketOverview coins={coins} onSelectCoin={openCoinModal} />

              <ControlsBar
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                sortBy={sortBy}
                onSortChange={setSortBy}
                favoritesCount={favorites.length}
                resultsCount={displayedCoins.length}
              />

              {displayedCoins.length === 0 ? (
                <StatusMessage
                  title={
                    activeFilter === "favorites" && !searchValue
                      ? "В избранном пока пусто"
                      : "Ничего не найдено"
                  }
                  message={
                    activeFilter === "favorites" && !searchValue
                      ? "Нажмите на звёздочку ★ на любой карточке, чтобы добавить монету в избранное."
                      : "Попробуйте изменить поисковый запрос или переключить фильтр."
                  }
                />
              ) : (
                <CoinList
                  coins={displayedCoins}
                  favoritesSet={favoritesSet}
                  onToggleFavorite={toggleFavorite}
                  onSelectCoin={openCoinModal}
                />
              )}
            </>
          )}
        </main>

        <footer className="app-footer">
          <p>Алимурадов Руслан 24кнт-6 • Штыров Иван 24кнт-1</p>
          <p className="footer-attr">
            Данные предоставлены{" "}
            <a
              href="https://www.coingecko.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              CoinGecko API
            </a>
          </p>
        </footer>
      </div>

      {selectedCoin && (
        <CoinDetailModal
          coin={selectedCoin}
          isFavorite={favoritesSet.has(selectedCoin.id)}
          onToggleFavorite={toggleFavorite}
          onClose={closeCoinModal}
        />
      )}
    </div>
  )
}
