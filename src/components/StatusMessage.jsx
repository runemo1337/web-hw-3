export default function StatusMessage({
  title,
  message,
  onRetry,
  variant = "neutral"
}) {
  return (
    <div className={`status-box glass-panel status-${variant}`} role="status">
      {title && <h2 className="status-title">{title}</h2>}
      <p className="status-text">{message}</p>
      {onRetry && (
        <button type="button" className="btn-primary" onClick={onRetry}>
          Повторить попытку
        </button>
      )}
    </div>
  )
}
