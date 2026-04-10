import { useState } from 'react';
import { todayStr, getSubjectColor } from '../utils/store';
import Modal from './Modal';

export default function HomeScreen({ data, onSave, onNavigate }) {
  const [showAddClass, setShowAddClass] = useState(false);
  const [grade, setGrade] = useState('');
  const [classNum, setClassNum] = useState('');
  const [selectedSubject, setSelectedSubject] = useState(data.teacher.subjects?.[0] || '');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const today = todayStr();
  const subjects = data.teacher.subjects || [];
  const totalToday = data.classes.reduce((sum, cls) => {
    return sum + cls.students.reduce((s, st) => {
      return s + (st.records || []).filter(r => r.date === today).length;
    }, 0);
  }, 0);

  // Group classes by subject
  const classesBySubject = {};
  for (const subj of subjects) {
    classesBySubject[subj] = data.classes.filter(c => c.subject === subj);
  }
  // Also collect classes with no/unknown subject
  const orphanClasses = data.classes.filter(c => !c.subject || !subjects.includes(c.subject));

  function handleAddClass() {
    const g = parseInt(grade);
    const c = parseInt(classNum);
    if (!g || !c || g < 1 || g > 6 || c < 1 || !selectedSubject) return;
    const id = `${selectedSubject}-${g}-${c}`;
    if (data.classes.find(cls => cls.id === id)) {
      alert('이미 존재하는 반입니다.');
      return;
    }
    const newData = {
      ...data,
      classes: [...data.classes, { id, grade: g, classNum: c, subject: selectedSubject, students: [] }]
        .sort((a, b) => a.grade - b.grade || a.classNum - b.classNum),
    };
    onSave(newData);
    setShowAddClass(false);
    setGrade('');
    setClassNum('');
  }

  function handleDeleteClass() {
    if (!deleteTarget) return;
    onSave({
      ...data,
      classes: data.classes.filter(c => c.id !== deleteTarget),
    });
    setDeleteTarget(null);
  }

  function renderClassCard(cls) {
    const studentCount = cls.students.length;
    const recordCount = cls.students.reduce((s, st) => s + (st.records || []).length, 0);
    const todayCount = cls.students.reduce((s, st) =>
      s + (st.records || []).filter(r => r.date === today).length, 0);
    const color = getSubjectColor(cls.subject, subjects);

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
        <p className="text-2xl font-bold" style={{ color }}>{cls.grade}-{cls.classNum}</p>
        <p className="text-xs text-muted mt-1">{studentCount}명</p>
        <div className="flex items-center gap-2 mt-2 text-xs">
          <span className="rounded-full px-2 py-0.5" style={{ backgroundColor: color + '30' }}>기록 {recordCount}</span>
          {todayCount > 0 && (
            <span className="rounded-full px-2 py-0.5" style={{ backgroundColor: color + '25' }}>오늘 {todayCount}</span>
          )}
        </div>
      </button>
    );
  }

  return (
    <div className="px-4 pb-6">
      {/* Header area */}
      <div className="flex items-center justify-between py-4">
        <div>
          <h1 className="text-xl font-bold">뚝딱교담수첩</h1>
          {data.teacher.school && (
            <p className="text-xs text-muted">
              {data.teacher.school} · {subjects.join(', ')}
            </p>
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

      {/* Classes grouped by subject */}
      {subjects.map(subj => {
        const subjColor = getSubjectColor(subj, subjects);
        return (
        <div key={subj} className="mb-4">
          <h2 className="text-sm font-bold text-muted mb-2 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: subjColor }} />
            <span style={{ color: subjColor }}>{subj}</span>
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {classesBySubject[subj].map(renderClassCard)}
          </div>
        </div>
        );
      })}

      {/* Orphan classes (backward compat) */}
      {orphanClasses.length > 0 && (
        <div className="mb-4">
          <h2 className="text-sm font-bold text-muted mb-2">기타</h2>
          <div className="grid grid-cols-2 gap-3">
            {orphanClasses.map(renderClassCard)}
          </div>
        </div>
      )}

      {/* Add class button */}
      <button
        className="btn-bounce w-full bg-card/50 border-2 border-dashed border-muted/30 rounded-[20px] p-4 flex items-center justify-center gap-2 text-muted"
        onClick={() => { setSelectedSubject(subjects[0] || ''); setShowAddClass(true); }}
      >
        <span className="text-2xl">+</span>
        <span className="text-sm">반 추가</span>
      </button>

      {/* Add class modal */}
      <Modal open={showAddClass} onClose={() => setShowAddClass(false)} title="반 추가">
        <div className="space-y-3">
          {/* Subject selector */}
          {subjects.length > 1 && (
            <div>
              <label className="text-xs text-muted block mb-1">과목</label>
              <div className="flex gap-2 flex-wrap">
                {subjects.map(subj => {
                  const sc = getSubjectColor(subj, subjects);
                  return (
                    <button
                      key={subj}
                      className={`btn-bounce rounded-full px-4 py-2 text-sm font-medium border-2 transition-all ${
                        selectedSubject === subj
                          ? 'text-text'
                          : 'bg-bg border-muted/20 text-muted'
                      }`}
                      style={selectedSubject === subj ? { backgroundColor: sc + '30', borderColor: sc } : {}}
                      onClick={() => setSelectedSubject(subj)}
                    >
                      {subj}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {subjects.length === 1 && (
            <p className="text-sm text-muted">과목: <b className="text-text">{subjects[0]}</b></p>
          )}

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
          이 반과 모든 학생 데이터를 삭제합니다. 이 작업은 되돌릴 수 없습니다.
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
