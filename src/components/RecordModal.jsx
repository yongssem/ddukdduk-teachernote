import { useState, useEffect } from 'react';
import Modal from './Modal';
import TagChip from './TagChip';
import { generateId, todayStr, getAllActiveTags } from '../utils/store';

export default function RecordModal({ open, onClose, onSave, tagSettings, editingRecord }) {
  const [date, setDate] = useState(todayStr());
  const [memo, setMemo] = useState('');
  const [tag, setTag] = useState('');

  useEffect(() => {
    if (open) {
      if (editingRecord) {
        setDate(editingRecord.date || todayStr());
        setMemo(editingRecord.memo || '');
        setTag(editingRecord.tag || '');
      } else {
        setDate(todayStr());
        setMemo('');
        setTag('');
      }
    }
  }, [open, editingRecord]);

  const activeTags = getAllActiveTags(tagSettings);

  function handleSave() {
    onSave({
      id: editingRecord?.id || generateId(),
      date,
      memo: memo.trim(),
      tag: tag || '',
    });
  }

  return (
    <Modal open={open} onClose={onClose} title={editingRecord ? '기록 수정' : '기록 추가'} wide>
      <div className="space-y-4">
        {/* Date */}
        <div>
          <label className="text-xs text-muted block mb-1">날짜</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full border border-muted/30 rounded-[12px] px-3 py-2 bg-bg"
          />
        </div>

        {/* Memo */}
        <div>
          <label className="text-xs text-muted block mb-1">메모</label>
          <textarea
            value={memo}
            onChange={e => setMemo(e.target.value)}
            rows={3}
            className="w-full border border-muted/30 rounded-[12px] px-3 py-2 bg-bg text-sm resize-none"
            placeholder="수업 중 관찰 내용을 기록하세요"
          />
        </div>

        {/* Tag chips */}
        <div>
          <label className="text-xs text-muted block mb-1">태그 (선택)</label>
          <div className="flex gap-2 overflow-x-auto tag-scroll pb-1">
            {activeTags.map(t => (
              <TagChip
                key={t.name}
                name={t.name}
                color={t.color}
                emoji={t.emoji}
                selected={tag === t.name}
                onClick={() => setTag(tag === t.name ? '' : t.name)}
              />
            ))}
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          className="btn-bounce w-full bg-primary text-white font-bold py-3 rounded-[16px]"
        >
          {editingRecord ? '수정 완료' : '기록 저장'}
        </button>
      </div>
    </Modal>
  );
}
