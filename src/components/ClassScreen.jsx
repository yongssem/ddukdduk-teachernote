import { useState, useRef } from 'react';
import Header from './Header';
import Modal from './Modal';
import { generateId, formatDate } from '../utils/store';
import { parseStudentsFromExcel } from '../utils/excel';

export default function ClassScreen({ cls, data, onSave, onNavigate }) {
  const [showAdd, setShowAdd] = useState(false);
  const [addMode, setAddMode] = useState('single'); // single | bulk | excel
  const [singleName, setSingleName] = useState('');
  const [singleNo, setSingleNo] = useState('');
  const [singleGender, setSingleGender] = useState('');
  const [bulkText, setBulkText] = useState('');
  const fileRef = useRef(null);

  const students = [...(cls.students || [])].sort((a, b) => a.no - b.no);

  function updateClass(newCls) {
    const newData = {
      ...data,
      classes: data.classes.map(c => c.id === cls.id ? newCls : c),
    };
    onSave(newData);
  }

  function addSingleStudent() {
    const no = parseInt(singleNo);
    const name = singleName.trim();
    if (!no || !name) return;
    if (cls.students.find(s => s.no === no)) {
      alert(`${no}번은 이미 존재합니다.`);
      return;
    }
    updateClass({
      ...cls,
      students: [...cls.students, { no, name, gender: singleGender, records: [] }],
    });
    setSingleNo('');
    setSingleName('');
    setSingleGender('');
  }

  function addBulkStudents() {
    const lines = bulkText.trim().split('\n').filter(l => l.trim());
    const newStudents = [];
    for (const line of lines) {
      const parts = line.split(/\t|,/).map(s => s.trim());
      const no = parseInt(parts[0]);
      const name = parts[1];
      if (!no || !name) continue;
      if (cls.students.find(s => s.no === no) || newStudents.find(s => s.no === no)) continue;
      let gender = '';
      if (parts[2]) {
        const g = parts[2];
        if (['남', 'M', 'm', '남자'].includes(g)) gender = 'M';
        else if (['여', 'F', 'f', '여자'].includes(g)) gender = 'F';
      }
      newStudents.push({ no, name, gender, records: [] });
    }
    if (newStudents.length === 0) {
      alert('추가할 학생이 없습니다. 형식: 번호\\t이름\\t성별');
      return;
    }
    updateClass({
      ...cls,
      students: [...cls.students, ...newStudents],
    });
    setBulkText('');
    setShowAdd(false);
  }

  async function handleExcelUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = await parseStudentsFromExcel(file);
      const newStudents = parsed.filter(s => !cls.students.find(ex => ex.no === s.no));
      if (newStudents.length === 0) {
        alert('추가할 학생이 없습니다.');
        return;
      }
      updateClass({
        ...cls,
        students: [...cls.students, ...newStudents],
      });
      setShowAdd(false);
    } catch {
      alert('엑셀 파일을 읽을 수 없습니다.');
    }
    if (fileRef.current) fileRef.current.value = '';
  }

  function deleteStudent(no) {
    if (!confirm(`${no}번 학생을 삭제할까요?`)) return;
    updateClass({
      ...cls,
      students: cls.students.filter(s => s.no !== no),
    });
  }

  return (
    <div className="pb-6">
      <Header
        title={`${cls.grade}-${cls.classNum}`}
        onBack={() => onNavigate('home')}
        right={
          <span className="text-xs text-muted">{students.length}명</span>
        }
      />

      <div className="px-4">
        {/* Student list */}
        <div className="space-y-2 mb-4">
          {students.map(student => {
            const recordCount = (student.records || []).length;
            const lastRecord = (student.records || [])
              .sort((a, b) => b.date.localeCompare(a.date))[0];

            return (
              <button
                key={student.no}
                className="btn-bounce w-full bg-card rounded-[16px] shadow-sm p-3 flex items-center gap-3 text-left"
                onClick={() => onNavigate('student', cls.id, student.no)}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                  student.gender === 'F' ? 'bg-primary/70' : student.gender === 'M' ? 'bg-blue-300' : 'bg-muted/50'
                }`}>
                  {student.no}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{student.name}</p>
                  {lastRecord && (
                    <p className="text-xs text-muted truncate">
                      최근 {formatDate(lastRecord.date)} — {lastRecord.memo?.slice(0, 20) || '(메모 없음)'}
                    </p>
                  )}
                </div>
                {recordCount > 0 && (
                  <span className="shrink-0 bg-accent/40 text-xs rounded-full px-2 py-0.5 font-medium">
                    {recordCount}
                  </span>
                )}
                <button
                  className="shrink-0 text-muted/40 hover:text-red-400 text-sm"
                  onClick={(e) => { e.stopPropagation(); deleteStudent(student.no); }}
                >
                  ✕
                </button>
              </button>
            );
          })}
        </div>

        {/* Add student button */}
        <button
          className="btn-bounce w-full bg-primary text-white font-bold py-3 rounded-[16px] flex items-center justify-center gap-2"
          onClick={() => setShowAdd(true)}
        >
          <span className="text-lg">+</span> 학생 추가
        </button>
      </div>

      {/* Add student modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="학생 추가" wide>
        <div className="space-y-4">
          {/* Mode tabs */}
          <div className="flex gap-1 bg-bg rounded-[12px] p-1">
            {[
              ['single', '1명 추가'],
              ['bulk', '일괄 붙여넣기'],
              ['excel', '엑셀 업로드'],
            ].map(([mode, label]) => (
              <button
                key={mode}
                className={`btn-bounce flex-1 py-2 rounded-[10px] text-xs font-medium transition-colors ${
                  addMode === mode ? 'bg-card shadow-sm text-text' : 'text-muted'
                }`}
                onClick={() => setAddMode(mode)}
              >
                {label}
              </button>
            ))}
          </div>

          {addMode === 'single' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="w-20">
                  <label className="text-xs text-muted block mb-1">번호</label>
                  <input
                    type="number"
                    min="1"
                    value={singleNo}
                    onChange={e => setSingleNo(e.target.value)}
                    className="w-full border border-muted/30 rounded-[12px] px-3 py-2 bg-bg text-center"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-muted block mb-1">이름</label>
                  <input
                    type="text"
                    value={singleName}
                    onChange={e => setSingleName(e.target.value)}
                    className="w-full border border-muted/30 rounded-[12px] px-3 py-2 bg-bg"
                    placeholder="홍길동"
                  />
                </div>
                <div className="w-20">
                  <label className="text-xs text-muted block mb-1">성별</label>
                  <select
                    value={singleGender}
                    onChange={e => setSingleGender(e.target.value)}
                    className="w-full border border-muted/30 rounded-[12px] px-2 py-2 bg-bg text-sm"
                  >
                    <option value="">-</option>
                    <option value="M">남</option>
                    <option value="F">여</option>
                  </select>
                </div>
              </div>
              <button
                onClick={addSingleStudent}
                className="btn-bounce w-full bg-primary text-white font-bold py-3 rounded-[16px]"
              >
                추가
              </button>
            </div>
          )}

          {addMode === 'bulk' && (
            <div className="space-y-3">
              <p className="text-xs text-muted">한 줄에 한 명씩. 형식: <b>번호 (탭) 이름 (탭) 성별</b></p>
              <textarea
                value={bulkText}
                onChange={e => setBulkText(e.target.value)}
                rows={6}
                className="w-full border border-muted/30 rounded-[12px] px-3 py-2 bg-bg text-sm resize-none"
                placeholder={`1\t홍길동\t남\n2\t김영희\t여\n3\t이철수\t남`}
              />
              <button
                onClick={addBulkStudents}
                className="btn-bounce w-full bg-primary text-white font-bold py-3 rounded-[16px]"
              >
                일괄 추가
              </button>
            </div>
          )}

          {addMode === 'excel' && (
            <div className="space-y-3">
              <p className="text-xs text-muted">
                .xlsx 파일 업로드. 첫 번째 열: 번호, 두 번째 열: 이름, 세 번째 열: 성별
              </p>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleExcelUpload}
                className="w-full text-sm file:btn-bounce file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-primary file:text-white file:font-medium"
              />
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
