import { useEffect, useMemo, useState } from "react"
import PriceChart from "./PriceChart"
import { fetchCoinDetails } from "../services/coingecko"
import {
  formatCompactCurrency,
  formatDateRu,
  formatPercent,
  formatPrice,
  formatSupply,
  stripHtml
} from "../utils/format"

function sanitizeUrl(url) {
  if (!url || typeof url !== "string") return null
  const trimmed = url.trim()
  if (trimmed.startsWith("https://") || trimmed.startsWith("http://")) {
    return trimmed
  }
  return null
}

export default function CoinDetailModal({
  coin,
  isFavorite,
  onToggleFavorite,
  onClose
}) {
  const [detailsState, setDetailsState] = useState({
    status: "loading",
    data: null,
    error: null
  })
  const [descExpanded, setDescExpanded] = useState(false)
  const [coinAmount, setCoinAmount] = useState("1")
  const [usdAmount, setUsdAmount] = useState(() =>
    coin.current_price ? String(Number(coin.current_price.toFixed(4))) : "0"
  )

  // Reset converter & description state when switching coins
  useEffect(() => {
    setDescExpanded(false)
    setCoinAmount("1")
    setUsdAmount(
      coin.current_price ? String(Number(coin.current_price.toFixed(4))) : "0"
    )
  }, [coin.id, coin.current_price])

  // Lock body scroll & close on Escape
  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [onClose])

  // Load extra details from /coins/{id}
  useEffect(() => {
    const controller = new AbortController()
    setDetailsState({ status: "loading", data: null, error: null })

    fetchCoinDetails(coin.id, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setDetailsState({ status: "ready", data, error: null })
        }
      })
      .catch((err) => {
        if (err?.name === "AbortError" || controller.signal.aborted) return
        setDetailsState({
          status: "error",
          data: null,
          error: err?.message || "Не удалось загрузить дополнительные данные."
        })
      })

    return () => controller.abort()
  }, [coin.id])

  const price = coin.current_price || 0

  function handleCoinInputChange(value) {
    setCoinAmount(value)
    const parsed = parseFloat(value)
    if (Number.isNaN(parsed) || !price) {
      setUsdAmount("")
    } else {
      const nextUsd = parsed * price
      setUsdAmount(nextUsd >= 1 ? nextUsd.toFixed(2) : nextUsd.toPrecision(4))
    }
  }

  function handleUsdInputChange(value) {
    setUsdAmount(value)
    const parsed = parseFloat(value)
    if (Number.isNaN(parsed) || !price) {
      setCoinAmount("")
    } else {
      const nextCoin = parsed / price
      setCoinAmount(
        nextCoin >= 1 ? nextCoin.toFixed(4) : nextCoin.toPrecision(4)
      )
    }
  }

  // 24h Range progress
  const low24 = coin.low_24h
  const high24 = coin.high_24h
  const rangePct =
    typeof low24 === "number" &&
    typeof high24 === "number" &&
    high24 > low24
      ? Math.max(0, Math.min(100, ((price - low24) / (high24 - low24)) * 100))
      : 50

  // Supply progress
  const supplyPct =
    coin.circulating_supply && coin.max_supply
      ? Math.min(100, (coin.circulating_supply / coin.max_supply) * 100)
      : null

  // Volume / Market Cap ratio
  const volToMcap =
    coin.total_volume && coin.market_cap
      ? (coin.total_volume / coin.market_cap) * 100
      : null

  // Extract details fields safely
  const details = detailsState.data
  const categories = useMemo(() => {
    if (!Array.isArray(details?.categories)) return []
    return details.categories.filter(Boolean).slice(0, 4)
  }, [details])

  const officialLinks = useMemo(() => {
    if (!details?.links) return []
    const items = [
      { label: "Сайт", url: sanitizeUrl(details.links.homepage?.[0]) },
      { label: "Explorer", url: sanitizeUrl(details.links.blockchain_site?.[0]) },
      { label: "GitHub", url: sanitizeUrl(details.links.repos_url?.github?.[0]) },
      { label: "Reddit", url: sanitizeUrl(details.links.subreddit_url) }
    ]
    return items.filter((item) => Boolean(item.url))
  }, [details])

  const cleanDescription = useMemo(
    () => stripHtml(details?.description?.en || ""),
    [details]
  )

  const sentimentUp = details?.sentiment_votes_up_percentage
  const sentimentDown = details?.sentiment_votes_down_percentage
  const hasSentiment =
    typeof sentimentUp === "number" && typeof sentimentDown === "number"

  const dynamics = [
    { label: "1Ч", value: coin.price_change_percentage_1h_in_currency },
    { label: "24Ч", value: coin.price_change_percentage_24h },
    { label: "7Д", value: coin.price_change_percentage_7d_in_currency }
  ]

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="modal-dialog glass-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-coin-title"
      >
        <header className="modal-header">
          <div className="modal-coin-title-group">
            <div className="modal-icon-glow">
              <img
                className="modal-coin-icon"
                src={coin.image}
                alt={coin.name}
              />
            </div>
            <div className="modal-title-text">
              <div className="modal-name-row">
                <h2 id="modal-coin-title">{coin.name}</h2>
                <span className="modal-symbol mono">
                  {coin.symbol.toUpperCase()}
                </span>
                <span className="modal-rank mono">
                  #{coin.market_cap_rank ?? "—"}
                </span>
              </div>
              {categories.length > 0 && (
                <div className="modal-categories">
                  {categories.map((cat) => (
                    <span key={cat} className="category-pill">
                      {cat}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="modal-header-actions">
            <button
              type="button"
              className={`fav-button fav-button-lg${isFavorite ? " active" : ""}`}
              onClick={() => onToggleFavorite(coin.id)}
              aria-label={
                isFavorite ? "Убрать из избранного" : "Добавить в избранное"
              }
              aria-pressed={isFavorite}
            >
              {isFavorite ? "★" : "☆"}
            </button>
            <button
              type="button"
              className="modal-close-btn"
              onClick={onClose}
              aria-label="Закрыть окно"
            >
              ✕
            </button>
          </div>
        </header>

        <div className="modal-body">
          <PriceChart coin={coin} />

          <div className="modal-dynamics-row">
            {dynamics.map((item) => {
              const hasVal = typeof item.value === "number"
              const isPos = hasVal && item.value >= 0
              return (
                <div key={item.label} className="dynamic-pill glass-subpanel">
                  <span className="dynamic-label">{item.label}</span>
                  <span
                    className={`dynamic-value mono ${
                      !hasVal ? "" : isPos ? "text-positive" : "text-negative"
                    }`}
                  >
                    {hasVal
                      ? `${isPos ? "▲" : "▼"} ${formatPercent(item.value)}`
                      : "—"}
                  </span>
                </div>
              )
            })}
          </div>

          {typeof low24 === "number" && typeof high24 === "number" && (
            <div className="range-card glass-subpanel">
              <div className="range-header">
                <span className="metric-label">Диапазон за 24ч</span>
                <span className="range-current mono">
                  Текущая: {formatPrice(price)}
                </span>
              </div>
              <div className="range-bar-track">
                <div
                  className="range-bar-fill"
                  style={{ width: `${rangePct}%` }}
                />
                <div
                  className="range-bar-marker"
                  style={{ left: `${rangePct}%` }}
                  aria-hidden="true"
                />
              </div>
              <div className="range-bounds mono">
                <span>Мин 24ч: {formatPrice(low24)}</span>
                <span>Макс 24ч: {formatPrice(high24)}</span>
              </div>
            </div>
          )}

          <div className="metrics-bento">
            <div className="metric-card glass-subpanel">
              <span className="metric-label">Капитализация</span>
              <span className="metric-value mono">
                {formatCompactCurrency(coin.market_cap)}
              </span>
              {typeof coin.market_cap_change_percentage_24h === "number" && (
                <span
                  className={`metric-sub mono ${
                    coin.market_cap_change_percentage_24h >= 0
                      ? "text-positive"
                      : "text-negative"
                  }`}
                >
                  {formatPercent(coin.market_cap_change_percentage_24h)} за 24ч
                </span>
              )}
            </div>

            <div className="metric-card glass-subpanel">
              <span className="metric-label">Объём 24ч</span>
              <span className="metric-value mono">
                {formatCompactCurrency(coin.total_volume)}
              </span>
              {volToMcap !== null && (
                <span className="metric-sub mono">
                  Vol/MCap: {volToMcap.toFixed(2)}%
                </span>
              )}
            </div>

            <div className="metric-card glass-subpanel">
              <span className="metric-label">Полная оценка (FDV)</span>
              <span className="metric-value mono">
                {formatCompactCurrency(coin.fully_diluted_valuation)}
              </span>
              <span className="metric-sub">При макс. эмиссии</span>
            </div>

            <div className="metric-card glass-subpanel">
              <span className="metric-label">В обращении / Макс.</span>
              <span className="metric-value mono">
                {formatSupply(coin.circulating_supply, coin.symbol)}
              </span>
              <span className="metric-sub mono">
                Макс: {formatSupply(coin.max_supply, coin.symbol)}
              </span>
              {supplyPct !== null && (
                <div className="supply-bar" aria-hidden="true">
                  <div
                    className="supply-bar-fill"
                    style={{ width: `${supplyPct}%` }}
                  />
                </div>
              )}
            </div>

            <div className="metric-card glass-subpanel">
              <span className="metric-label">Исторический максимум (ATH)</span>
              <span className="metric-value mono">{formatPrice(coin.ath)}</span>
              <span className="metric-sub mono">
                <span
                  className={
                    (coin.ath_change_percentage ?? 0) >= 0
                      ? "text-positive"
                      : "text-negative"
                  }
                >
                  {formatPercent(coin.ath_change_percentage)}
                </span>{" "}
                · {formatDateRu(coin.ath_date)}
              </span>
            </div>

            <div className="metric-card glass-subpanel">
              <span className="metric-label">Исторический минимум (ATL)</span>
              <span className="metric-value mono">{formatPrice(coin.atl)}</span>
              <span className="metric-sub mono">
                <span
                  className={
                    (coin.atl_change_percentage ?? 0) >= 0
                      ? "text-positive"
                      : "text-negative"
                  }
                >
                  {formatPercent(coin.atl_change_percentage)}
                </span>{" "}
                · {formatDateRu(coin.atl_date)}
              </span>
            </div>
          </div>

          <div className="converter-card glass-subpanel">
            <span className="metric-label">Быстрый конвертер</span>
            <div className="converter-row">
              <label className="converter-input-wrap">
                <span className="converter-unit mono">
                  {coin.symbol.toUpperCase()}
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  className="converter-input mono"
                  value={coinAmount}
                  onChange={(e) => handleCoinInputChange(e.target.value)}
                  aria-label={`Количество ${coin.symbol.toUpperCase()}`}
                />
              </label>

              <span className="converter-swap" aria-hidden="true">
                ⇄
              </span>

              <label className="converter-input-wrap">
                <span className="converter-unit mono">USD</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  className="converter-input mono"
                  value={usdAmount}
                  onChange={(e) => handleUsdInputChange(e.target.value)}
                  aria-label="Сумма в USD"
                />
              </label>
            </div>
          </div>

          <div className="details-extra glass-subpanel">
            {detailsState.status === "loading" && (
              <div className="details-loading">
                <span className="spinner" aria-hidden="true" />
                <span>Загрузка описания, ссылок и настроений…</span>
              </div>
            )}

            {detailsState.status === "error" && (
              <p className="details-muted">{detailsState.error}</p>
            )}

            {detailsState.status === "ready" && (
              <>
                {hasSentiment && (
                  <div className="sentiment-block">
                    <div className="sentiment-header">
                      <span className="metric-label">Настроения сообщества</span>
                      <div className="sentiment-values mono">
                        <span className="text-positive">
                          Бычий {sentimentUp.toFixed(0)}%
                        </span>
                        <span className="text-negative">
                          Медвежий {sentimentDown.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div className="pulse-bar" aria-hidden="true">
                      <div
                        className="pulse-bar-fill"
                        style={{ width: `${sentimentUp}%` }}
                      />
                    </div>
                  </div>
                )}

                {officialLinks.length > 0 && (
                  <div className="links-block">
                    <span className="metric-label">Официальные ссылки</span>
                    <div className="links-row">
                      {officialLinks.map((link) => (
                        <a
                          key={link.label}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ext-link-pill"
                        >
                          {link.label} ↗
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {cleanDescription && (
                  <div className="description-block">
                    <span className="metric-label">О проекте</span>
                    <p
                      className={`coin-description${
                        descExpanded ? " expanded" : ""
                      }`}
                    >
                      {cleanDescription}
                    </p>
                    {cleanDescription.length > 260 && (
                      <button
                        type="button"
                        className="btn-link"
                        onClick={() => setDescExpanded((v) => !v)}
                      >
                        {descExpanded ? "Свернуть" : "Читать полностью"}
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
