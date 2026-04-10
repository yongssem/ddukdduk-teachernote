export default function BackupBanner({ days, onGoSettings }) {
  if (days < 30) return null;
  return (
    <div className="mx-4 mb-3 bg-tag-growth/50 rounded-[16px] p-3 text-xs text-text flex items-center justify-between gap-2">
      <span>
        <b>백업 알림</b> — 마지막 백업으로부터 {days === Infinity ? '아직 백업한 적이 없어요' : `${days}일이 지났어요`}. 백업해주세요!
      </span>
      <button
        onClick={onGoSettings}
        className="btn-bounce shrink-0 bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-full"
      >
        설정
      </button>
    </div>
  );
}
