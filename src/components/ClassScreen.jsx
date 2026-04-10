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
  const [bulkRows, setBulkRows] = useState([{ no: '', name: '', gender: '' }]);
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

  function updateBulkRow(idx, field, value) {
    const next = [...bulkRows];
    next[idx] = { ...next[idx], [field]: value };
    setBulkRows(next);
  }

  function addBulkRow() {
    const lastNo = bulkRows[bulkRows.length - 1]?.no;
    const nextNo = lastNo ? String(parseInt(lastNo) + 1) : '';
    setBulkRows([...bulkRows, { no: nextNo, name: '', gender: '' }]);
  }

  function removeBulkRow(idx) {
    if (bulkRows.length <= 1) return;
    setBulkRows(bulkRows.filter((_, i) => i !== idx));
  }

  function addBulkStudents() {
    const newStudents = [];
    for (const row of bulkRows) {
      const no = parseInt(row.no);
      const name = row.name.trim();
      if (!no || !name) continue;
      if (cls.students.find(s => s.no === no) || newStudents.find(s => s.no === no)) continue;
      newStudents.push({ no, name, gender: row.gender, records: [] });
    }
    if (newStudents.length === 0) {
      alert('추가할 학생이 없습니다. 번호와 이름을 입력해주세요.');
      return;
    }
    updateClass({
      ...cls,
      students: [...cls.students, ...newStudents],
    });
    setBulkRows([{ no: '', name: '', gender: '' }]);
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
        title={`${cls.subject ? cls.subject + ' ' : ''}${cls.grade}-${cls.classNum}`}
        onBack={() => onNavigate('home')}
        right={
          <span className="text-xs text-muted">{students.length}명</span>
        }
      />

      <div className="px-4">
        {/* Add student button */}
        <button
          className="btn-bounce w-full bg-primary text-white font-bold py-3 rounded-[16px] flex items-center justify-center gap-2 mb-4"
          onClick={() => setShowAdd(true)}
        >
          <span className="text-lg">+</span> 학생 추가
        </button>

        {/* Student list */}
        <div className="space-y-2">
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
      </div>

      {/* Add student modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="학생 추가" wide>
        <div className="space-y-4">
          {/* Mode tabs */}
          <div className="flex gap-1 bg-bg rounded-[12px] p-1">
            {[
              ['single', '1명 추가'],
              ['bulk', '일괄 추가'],
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
              {/* Column header */}
              <div className="flex gap-2 text-xs text-muted px-1">
                <span className="w-16 text-center">번호</span>
                <span className="flex-1">이름</span>
                <span className="w-16 text-center">성별</span>
                <span className="w-7" />
              </div>
              {/* Rows */}
              <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                {bulkRows.map((row, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="number"
                      min="1"
                      value={row.no}
                      onChange={e => updateBulkRow(idx, 'no', e.target.value)}
                      className="w-16 border border-muted/30 rounded-[10px] px-2 py-2 bg-bg text-center text-sm"
                      placeholder="#"
                    />
                    <input
                      type="text"
                      value={row.name}
                      onChange={e => updateBulkRow(idx, 'name', e.target.value)}
                      className="flex-1 border border-muted/30 rounded-[10px] px-3 py-2 bg-bg text-sm"
                      placeholder="이름"
                    />
                    <select
                      value={row.gender}
                      onChange={e => updateBulkRow(idx, 'gender', e.target.value)}
                      className="w-16 border border-muted/30 rounded-[10px] px-1 py-2 bg-bg text-sm text-center"
                    >
                      <option value="">-</option>
                      <option value="M">남</option>
                      <option value="F">여</option>
                    </select>
                    <button
                      onClick={() => removeBulkRow(idx)}
                      className={`btn-bounce w-7 h-7 rounded-full text-xs flex items-center justify-center ${
                        bulkRows.length <= 1 ? 'text-muted/20' : 'text-muted hover:text-red-400 bg-tag-noise/20'
                      }`}
                      disabled={bulkRows.length <= 1}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={addBulkRow}
                className="btn-bounce w-full border-2 border-dashed border-muted/30 rounded-[12px] py-2 text-sm text-muted"
              >
                + 행 추가
              </button>
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
