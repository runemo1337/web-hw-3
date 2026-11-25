const MARKETS_URL =
  "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=true&price_change_percentage=1h,24h,7d"

const MARKETS_CACHE_KEY = "crypto_tracker_markets_v1"
const MARKETS_TTL_MS = 60 * 1000
const DETAILS_TTL_MS = 10 * 60 * 1000
const CHART_TTL_MS = 5 * 60 * 1000

let marketsMemCache = null
const detailsCache = new Map()
const chartCache = new Map()

function createApiError(response) {
  if (response.status === 429) {
    const err = new Error(
      "Превышен лимит запросов к CoinGecko API (429). Подождите 30–60 секунд и попробуйте снова."
    )
    err.status = 429
    return err
  }
  if (response.status >= 500) {
    const err = new Error(
      `Сервер CoinGecko временно недоступен (код ${response.status}). Попробуйте позже.`
    )
    err.status = response.status
    return err
  }
  const err = new Error(
    `Не удалось загрузить данные (код ${response.status}). Попробуйте ещё раз.`
  )
  err.status = response.status
  return err
}

function readSessionMarkets() {
  try {
    const raw = sessionStorage.getItem(MARKETS_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || !Array.isArray(parsed.data) || typeof parsed.updatedAt !== "number") {
      return null
    }
    if (Date.now() - parsed.updatedAt < MARKETS_TTL_MS) {
      return parsed
    }
  } catch {
    // Ignore storage read errors
  }
  return null
}

function writeSessionMarkets(entry) {
  try {
    sessionStorage.setItem(MARKETS_CACHE_KEY, JSON.stringify(entry))
  } catch {
    // Ignore storage quota or private mode errors
  }
}

export async function fetchMarketCoins({ force = false, signal } = {}) {
  const now = Date.now()

  if (!force) {
    if (marketsMemCache && now - marketsMemCache.updatedAt < MARKETS_TTL_MS) {
      return { ...marketsMemCache, fromCache: true }
    }
    const sessionEntry = readSessionMarkets()
    if (sessionEntry) {
      marketsMemCache = sessionEntry
      return { ...sessionEntry, fromCache: true }
    }
  }

  let response
  try {
    response = await fetch(MARKETS_URL, { signal })
  } catch (err) {
    if (err?.name === "AbortError") throw err
    throw new Error(
      "Ошибка сети. Проверьте подключение к интернету и попробуйте снова."
    )
  }

  if (!response.ok) {
    throw createApiError(response)
  }

  const data = await response.json()
  const entry = { data, updatedAt: Date.now() }
  marketsMemCache = entry
  writeSessionMarkets(entry)
  return { ...entry, fromCache: false }
}

export async function fetchCoinDetails(id, signal) {
  const cached = detailsCache.get(id)
  if (cached && Date.now() - cached.updatedAt < DETAILS_TTL_MS) {
    return cached.data
  }

  const url = `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(
    id
  )}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false`

  let response
  try {
    response = await fetch(url, { signal })
  } catch (err) {
    if (err?.name === "AbortError") throw err
    throw new Error("Не удалось загрузить подробную информацию о монете.")
  }

  if (!response.ok) {
    throw createApiError(response)
  }

  const data = await response.json()
  detailsCache.set(id, { data, updatedAt: Date.now() })
  return data
}

export async function fetchCoinMarketChart(id, days, signal) {
  const cacheKey = `${id}:${days}`
  const cached = chartCache.get(cacheKey)
  if (cached && Date.now() - cached.updatedAt < CHART_TTL_MS) {
    return cached.data
  }

  const url = `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(
    id
  )}/market_chart?vs_currency=usd&days=${encodeURIComponent(days)}`

  let response
  try {
    response = await fetch(url, { signal })
  } catch (err) {
    if (err?.name === "AbortError") throw err
    throw new Error("Не удалось загрузить историю цены.")
  }

  if (!response.ok) {
    throw createApiError(response)
  }

  const json = await response.json()
  const prices = Array.isArray(json?.prices) ? json.prices : []
  chartCache.set(cacheKey, { data: prices, updatedAt: Date.now() })
  return prices
}
