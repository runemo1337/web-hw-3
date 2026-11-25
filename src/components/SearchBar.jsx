export default function SearchBar({ value, onChange }) {
  return (
    <input
      className="search-input"
      type="text"
      placeholder="Поиск по тикеру или названию..."
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}
