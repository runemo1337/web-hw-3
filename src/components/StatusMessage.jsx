export default function StatusMessage({ message, onRetry }) {
  return (
    <div className="status-message">
      <p>{message}</p>
      {onRetry && (
        <button className="retry-button" onClick={onRetry}>
          Повторить попытку
        </button>
      )}
    </div>
  )
}
