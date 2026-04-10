import { useState } from 'react';
import Header from './Header';
import RecordModal from './RecordModal';
import { getTagColor, getTagEmoji, formatDate } from '../utils/store';

export default function StudentScreen({ cls, student, data, onSave, onNavigate }) {
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const records = [...(student.records || [])].sort((a, b) => b.date.localeCompare(a.date));

  function updateStudent(newStudent) {
    const newCls = {
      ...cls,
      students: cls.students.map(s => s.no === student.no ? newStudent : s),
    };
    const newData = {
      ...data,
      classes: data.classes.map(c => c.id === cls.id ? newCls : c),
    };
    onSave(newData);
  }

  function handleSaveRecord(record) {
    if (editingRecord) {
      updateStudent({
        ...student,
        records: student.records.map(r => r.id === editingRecord.id ? { ...record, id: editingRecord.id } : r),
      });
    } else {
      updateStudent({
        ...student,
        records: [...(student.records || []), record],
      });
    }
    setShowRecordModal(false);
    setEditingRecord(null);
  }

  function handleDeleteRecord() {
    if (!deleteTarget) return;
    updateStudent({
      ...student,
      records: student.records.filter(r => r.id !== deleteTarget),
    });
    setDeleteTarget(null);
  }

  return (
    <div className="pb-24">
      <Header
        title={`${cls.grade}-${cls.classNum}`}
        onBack={() => onNavigate('class', cls.id)}
      />

      {/* Student profile */}
      <div className="px-4 mb-4">
        <div className="bg-card rounded-[24px] shadow-sm p-5 flex items-center gap-4">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white ${
            student.gender === 'F' ? 'bg-primary/70' : student.gender === 'M' ? 'bg-blue-300' : 'bg-muted/50'
          }`}>
            {student.no}
          </div>
          <div>
            <p className="text-lg font-bold">{student.name}</p>
            <p className="text-xs text-muted">
              {student.gender === 'M' ? '남' : student.gender === 'F' ? '여' : ''} · 기록 {records.length}건
            </p>
          </div>
        </div>
      </div>

      {/* Record timeline */}
      <div className="px-4">
        <h3 className="text-sm font-bold mb-3 text-muted">누가기록</h3>

        {records.length === 0 ? (
          <div className="text-center py-10 text-muted text-sm">
            <p className="text-3xl mb-2">📝</p>
            <p>아직 기록이 없어요</p>
            <p className="text-xs mt-1">아래 + 버튼으로 기록을 추가하세요</p>
          </div>
        ) : (
          <div className="space-y-2">
            {records.map(record => {
              const tagColor = getTagColor(record.tag, data.tagSettings);
              const tagEmoji = getTagEmoji(record.tag);

              return (
                <div
                  key={record.id}
                  className="bg-card rounded-[16px] shadow-sm p-3 flex gap-3"
                >
                  <div
                    className="w-2 rounded-full shrink-0 mt-1"
                    style={{ backgroundColor: tagColor, minHeight: '2rem' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted">{formatDate(record.date)}</span>
                      {record.tag && (
                        <span
                          className="text-xs rounded-full px-2 py-0.5 font-medium"
                          style={{ backgroundColor: tagColor + '60' }}
                        >
                          {tagEmoji} {record.tag}
                        </span>
                      )}
                    </div>
                    <p className="text-sm whitespace-pre-wrap break-words">{record.memo || '(메모 없음)'}</p>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      className="btn-bounce text-muted hover:text-text text-xs px-1"
                      onClick={() => { setEditingRecord(record); setShowRecordModal(true); }}
                    >
                      수정
                    </button>
                    <button
                      className="btn-bounce text-muted/50 hover:text-red-400 text-xs px-1"
                      onClick={() => setDeleteTarget(record.id)}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        className="btn-bounce fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center text-2xl z-40"
        onClick={() => { setEditingRecord(null); setShowRecordModal(true); }}
      >
        +
      </button>

      {/* Record modal */}
      <RecordModal
        open={showRecordModal}
        onClose={() => { setShowRecordModal(false); setEditingRecord(null); }}
        onSave={handleSaveRecord}
        tagSettings={data.tagSettings}
        editingRecord={editingRecord}
      />

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setDeleteTarget(null)}>
          <div className="fixed inset-0 bg-black/30" />
          <div className="relative bg-card rounded-[24px] shadow-xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <p className="text-sm mb-4">이 기록을 삭제할까요?</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteTarget(null)} className="btn-bounce flex-1 bg-muted/20 font-bold py-3 rounded-[16px]">
                취소
              </button>
              <button onClick={handleDeleteRecord} className="btn-bounce flex-1 bg-red-400 text-white font-bold py-3 rounded-[16px]">
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
