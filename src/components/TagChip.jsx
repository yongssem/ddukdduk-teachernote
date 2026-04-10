export default function TagChip({ name, color, emoji, selected, onClick, small }) {
  return (
    <button
      type="button"
      className={`btn-bounce inline-flex items-center gap-1 rounded-full border-2 font-medium whitespace-nowrap
        ${small ? 'px-2 py-0.5 text-xs' : 'px-3 py-1.5 text-sm'}
        ${selected ? 'border-text/30 shadow-sm' : 'border-transparent opacity-60'}
      `}
      style={{ backgroundColor: color || '#E5E5E5' }}
      onClick={onClick}
    >
      {emoji && <span>{emoji}</span>}
      <span className="text-text">{name}</span>
    </button>
  );
}
