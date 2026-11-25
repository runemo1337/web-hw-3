export function formatPrice(price) {
  if (price === null || price === undefined || Number.isNaN(Number(price))) {
    return "—"
  }
  const num = Number(price)
  if (num === 0) return "$0.00"

  const abs = Math.abs(num)
  const sign = num < 0 ? "-" : ""

  if (abs >= 1) {
    return `${sign}$${abs.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`
  }

  if (abs >= 0.01) {
    return `${sign}$${abs.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    })}`
  }

  if (abs >= 0.0001) {
    return `${sign}$${abs.toLocaleString("en-US", {
      minimumFractionDigits: 4,
      maximumFractionDigits: 6
    })}`
  }

  return `${sign}$${abs.toLocaleString("en-US", {
    maximumSignificantDigits: 4,
    maximumFractionDigits: 8
  })}`
}

export function formatCompactCurrency(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "—"
  }
  const num = Number(value)
  const abs = Math.abs(num)
  const sign = num < 0 ? "-" : ""

  if (abs >= 1e12) return `${sign}$${(abs / 1e12).toFixed(2)}T`
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(2)}M`
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(1)}K`
  return `${sign}$${abs.toFixed(0)}`
}

export function formatCompactNumber(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "—"
  }
  const num = Number(value)
  const abs = Math.abs(num)

  if (abs >= 1e12) return `${(num / 1e12).toFixed(2)}T`
  if (abs >= 1e9) return `${(num / 1e9).toFixed(2)}B`
  if (abs >= 1e6) return `${(num / 1e6).toFixed(2)}M`
  if (abs >= 1e3) return `${(num / 1e3).toFixed(1)}K`
  return num.toLocaleString("en-US", { maximumFractionDigits: 2 })
}

export function formatSupply(value, symbol = "") {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "∞"
  }
  const formatted = formatCompactNumber(value)
  return symbol ? `${formatted} ${symbol.toUpperCase()}` : formatted
}

export function formatPercent(value, { signed = true } = {}) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "—"
  }
  const num = Number(value)
  const prefix = signed && num > 0 ? "+" : ""
  return `${prefix}${num.toFixed(2)}%`
}

export function formatDateRu(dateInput, { withTime = false } = {}) {
  if (!dateInput) return "—"
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput)
  if (Number.isNaN(date.getTime())) return "—"

  const options = withTime
    ? {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }
    : {
        day: "numeric",
        month: "short",
        year: "numeric"
      }

  return new Intl.DateTimeFormat("ru-RU", options).format(date)
}

export function formatChartTime(timestamp, days) {
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return ""

  if (days === "1") {
    return new Intl.DateTimeFormat("ru-RU", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date)
  }

  if (days === "7" || days === "30") {
    return new Intl.DateTimeFormat("ru-RU", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date)
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(date)
}

export function stripHtml(html) {
  if (!html || typeof html !== "string") return ""
  try {
    if (typeof DOMParser !== "undefined") {
      const doc = new DOMParser().parseFromString(html, "text/html")
      return (doc.body.textContent || "").replace(/\s+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim()
    }
  } catch {
    // Fallback to regex cleanup below
  }
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s{2,}/g, " ")
    .trim()
}
