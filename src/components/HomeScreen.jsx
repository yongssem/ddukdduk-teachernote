import { useState } from 'react';
import { todayStr } from '../utils/store';
import Modal from './Modal';

export default function HomeScreen({ data, onSave, onNavigate }) {
  const [showAddClass, setShowAddClass] = useState(false);
  const [grade, setGrade] = useState('');
  const [classNum, setClassNum] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const today = todayStr();
  const totalToday = data.classes.reduce((sum, cls) => {
    return sum + cls.students.reduce((s, st) => {
      return s + (st.records || []).filter(r => r.date === today).length;
    }, 0);
  }, 0);

  function handleAddClass() {
    const g = parseInt(grade);
    const c = parseInt(classNum);
    if (!g || !c || g < 1 || g > 6 || c < 1) return;
    const id = `${g}-${c}`;
    if (data.classes.find(cls => cls.id === id)) {
      alert('이미 존재하는 반입니다.');
      return;
    }
    const newData = {
      ...data,
      classes: [...data.classes, { id, grade: g, classNum: c, students: [] }]
        .sort((a, b) => a.grade - b.grade || a.classNum - b.classNum),
    };
    onSave(newData);
    setShowAddClass(false);
    setGrade('');
    setClassNum('');
  }

  function handleDeleteClass() {
    if (!deleteTarget) return;
    const newData = {
      ...data,
      classes: data.classes.filter(c => c.id !== deleteTarget),
    };
    onSave(newData);
    setDeleteTarget(null);
  }

  return (
    <div className="px-4 pb-6">
      {/* Header area */}
      <div className="flex items-center justify-between py-4">
        <div>
          <h1 className="text-xl font-bold">뚝딱교담수첩</h1>
          {data.teacher.school && (
            <p className="text-xs text-muted">{data.teacher.school} · {data.teacher.subject || ''}</p>
          )}
        </div>
        <button
          onClick={() => onNavigate('settings')}
          className="btn-bounce w-10 h-10 flex items-center justify-center rounded-full bg-card shadow-sm text-lg"
        >
          ⚙️
        </button>
      </div>

      {/* Today count */}
      <div className="bg-card rounded-[24px] shadow-sm p-4 mb-4 flex items-center gap-3">
        <span className="text-2xl">📝</span>
        <div>
          <p className="text-xs text-muted">오늘의 기록</p>
          <p className="text-lg font-bold">{totalToday}건</p>
        </div>
      </div>

      {/* Class grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {data.classes.map(cls => {
          const studentCount = cls.students.length;
          const recordCount = cls.students.reduce((s, st) => s + (st.records || []).length, 0);
          const todayCount = cls.students.reduce((s, st) =>
            s + (st.records || []).filter(r => r.date === today).length, 0);

          return (
            <button
              key={cls.id}
              className="btn-bounce bg-card rounded-[20px] shadow-sm p-4 text-left relative group"
              onClick={() => onNavigate('class', cls.id)}
            >
              <button
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-tag-noise/40 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => { e.stopPropagation(); setDeleteTarget(cls.id); }}
              >
                ✕
              </button>
              <p className="text-2xl font-bold text-primary">{cls.grade}-{cls.classNum}</p>
              <p className="text-xs text-muted mt-1">{studentCount}명</p>
              <div className="flex items-center gap-2 mt-2 text-xs">
                <span className="bg-accent/30 rounded-full px-2 py-0.5">기록 {recordCount}</span>
                {todayCount > 0 && (
                  <span className="bg-primary/20 rounded-full px-2 py-0.5">오늘 {todayCount}</span>
                )}
              </div>
            </button>
          );
        })}

        {/* Add class button */}
        <button
          className="btn-bounce bg-card/50 border-2 border-dashed border-muted/30 rounded-[20px] p-4 flex flex-col items-center justify-center text-muted min-h-[120px]"
          onClick={() => setShowAddClass(true)}
        >
          <span className="text-3xl mb-1">+</span>
          <span className="text-xs">반 추가</span>
        </button>
      </div>

      {/* Add class modal */}
      <Modal open={showAddClass} onClose={() => setShowAddClass(false)} title="반 추가">
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-muted block mb-1">학년</label>
              <input
                type="number"
                min="1"
                max="6"
                value={grade}
                onChange={e => setGrade(e.target.value)}
                className="w-full border border-muted/30 rounded-[12px] px-3 py-2 text-center text-lg bg-bg"
                placeholder="3"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted block mb-1">반</label>
              <input
                type="number"
                min="1"
                value={classNum}
                onChange={e => setClassNum(e.target.value)}
                className="w-full border border-muted/30 rounded-[12px] px-3 py-2 text-center text-lg bg-bg"
                placeholder="1"
              />
            </div>
          </div>
          <button
            onClick={handleAddClass}
            className="btn-bounce w-full bg-primary text-white font-bold py-3 rounded-[16px]"
          >
            추가하기
          </button>
        </div>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="반 삭제">
        <p className="text-sm mb-4">
          <b>{deleteTarget}</b> 반과 모든 학생 데이터를 삭제합니다. 이 작업은 되돌릴 수 없습니다.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setDeleteTarget(null)}
            className="btn-bounce flex-1 bg-muted/20 font-bold py-3 rounded-[16px]"
          >
            취소
          </button>
          <button
            onClick={handleDeleteClass}
            className="btn-bounce flex-1 bg-red-400 text-white font-bold py-3 rounded-[16px]"
          >
            삭제
          </button>
        </div>
      </Modal>
    </div>
  );
}
