import { useEffect, useRef } from "react"

const FILTER_TABS = [
  { id: "all", label: "Все" },
  { id: "gainers", label: "Топ роста" },
  { id: "losers", label: "Топ падения" },
  { id: "favorites", label: "Избранное ★" }
]

const SORT_OPTIONS = [
  { value: "market_cap", label: "По капитализации" },
  { value: "price", label: "По цене" },
  { value: "change_24h", label: "Изменение 24ч" },
  { value: "volume", label: "Объём 24ч" }
]

export default function ControlsBar({
  searchValue,
  onSearchChange,
  activeFilter,
  onFilterChange,
  sortBy,
  onSortChange,
  favoritesCount,
  resultsCount
}) {
  const inputRef = useRef(null)

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey) {
        return
      }
      const tag = event.target?.tagName
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        event.target?.isContentEditable
      ) {
        return
      }
      event.preventDefault()
      inputRef.current?.focus()
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <section className="controls-bar glass-panel" aria-label="Поиск и фильтры">
      <div className="search-field">
        <svg
          className="search-icon"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M9 15.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13Zm7.5 1-3.4-3.4"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
        <input
          ref={inputRef}
          className="search-input"
          type="text"
          placeholder="Поиск по тикеру или названию..."
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Поиск криптовалюты"
        />
        {searchValue ? (
          <button
            type="button"
            className="search-clear"
            onClick={() => {
              onSearchChange("")
              inputRef.current?.focus()
            }}
            aria-label="Очистить поиск"
          >
            ✕
          </button>
        ) : (
          <kbd className="search-kbd" aria-hidden="true">
            /
          </kbd>
        )}
      </div>

      <div className="filter-tabs" role="tablist" aria-label="Фильтры монет">
        {FILTER_TABS.map((tab) => {
          const isActive = activeFilter === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`filter-tab${isActive ? " active" : ""}`}
              onClick={() => onFilterChange(tab.id)}
            >
              <span>{tab.label}</span>
              {tab.id === "favorites" && favoritesCount > 0 && (
                <span className="tab-count mono">{favoritesCount}</span>
              )}
            </button>
          )
        })}
      </div>

      <div className="sort-group">
        <span className="results-badge mono" title="Показано монет">
          {resultsCount}
        </span>
        <label className="sort-select-wrap">
          <span className="sr-only">Сортировка</span>
          <select
            className="sort-select"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            aria-label="Сортировка монет"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  )
}
