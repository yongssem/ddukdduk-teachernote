export default function Header({ title, onBack, right }) {
  return (
    <div className="sticky top-0 z-30 bg-bg/80 backdrop-blur-md px-4 py-3 flex items-center gap-3">
      {onBack && (
        <button onClick={onBack} className="btn-bounce text-2xl leading-none text-muted hover:text-text -ml-1">
          ←
        </button>
      )}
      <h1 className="text-lg font-bold flex-1 truncate text-text">{title}</h1>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </div>
  );
}
