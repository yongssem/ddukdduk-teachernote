import { useState, useRef } from 'react';
import Header from './Header';
import Modal from './Modal';
import { TAG_PRESETS, exportBackupJSON, clearData, todayStr, getSubjectColor } from '../utils/store';
import { exportClassExcel, exportAllExcel, exportSummaryExcel } from '../utils/excel';

export default function SettingsScreen({ data, onSave, onNavigate }) {
  const [school, setSchool] = useState(data.teacher.school || '');
  const [subjects, setSubjects] = useState(data.teacher.subjects || []);
  const [newSubject, setNewSubject] = useState('');
  const [showCustomAdd, setShowCustomAdd] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customColor, setCustomColor] = useState('#E5E5E5');
  const [editingCustom, setEditingCustom] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showResetFinal, setShowResetFinal] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(null);
  const [showExportClass, setShowExportClass] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const fileRef = useRef(null);

  function saveSchool() {
    onSave({
      ...data,
      teacher: { ...data.teacher, school: school.trim() },
    });
  }

  function addSubject() {
    const name = newSubject.trim();
    if (!name) return;
    if (subjects.includes(name)) { alert('이미 존재하는 과목입니다.'); return; }
    const next = [...subjects, name];
    setSubjects(next);
    setNewSubject('');
    onSave({ ...data, teacher: { ...data.teacher, subjects: next } });
  }

  function removeSubject(idx) {
    const name = subjects[idx];
    const hasClasses = data.classes.some(c => c.subject === name);
    if (hasClasses) {
      alert(`"${name}" 과목에 연결된 반이 있어 삭제할 수 없습니다. 반을 먼저 삭제해주세요.`);
      return;
    }
    const next = subjects.filter((_, i) => i !== idx);
    setSubjects(next);
    onSave({ ...data, teacher: { ...data.teacher, subjects: next } });
  }

  function togglePreset(name) {
    const newPresets = { ...data.tagSettings.presets };
    newPresets[name] = !newPresets[name];
    onSave({
      ...data,
      tagSettings: { ...data.tagSettings, presets: newPresets },
    });
  }

  function saveCustomTag() {
    const name = customName.trim();
    if (!name) return;
    if (TAG_PRESETS[name]) {
      alert('프리셋 태그와 같은 이름은 사용할 수 없습니다.');
      return;
    }
    const customs = [...(data.tagSettings.custom || [])];
    if (editingCustom !== null) {
      customs[editingCustom] = { name, color: customColor };
    } else {
      if (customs.find(t => t.name === name)) {
        alert('이미 존재하는 태그입니다.');
        return;
      }
      customs.push({ name, color: customColor });
    }
    onSave({
      ...data,
      tagSettings: { ...data.tagSettings, custom: customs },
    });
    setShowCustomAdd(false);
    setCustomName('');
    setCustomColor('#E5E5E5');
    setEditingCustom(null);
  }

  function deleteCustomTag(idx) {
    const customs = data.tagSettings.custom.filter((_, i) => i !== idx);
    onSave({
      ...data,
      tagSettings: { ...data.tagSettings, custom: customs },
    });
  }

  function handleBackup() {
    const newData = { ...data, lastBackupDate: todayStr() };
    onSave(newData);
    exportBackupJSON(newData);
  }

  function handleRestoreFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (!parsed.classes) throw new Error('Invalid');
        setShowRestoreConfirm(parsed);
      } catch {
        alert('올바른 백업 파일이 아닙니다.');
      }
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = '';
  }

  function confirmRestore() {
    if (!showRestoreConfirm) return;
    onSave({ ...showRestoreConfirm, firstRunDone: true });
    setShowRestoreConfirm(null);
    setSchool(showRestoreConfirm.teacher?.school || '');
    setSubjects(showRestoreConfirm.teacher?.subjects || []);
    alert('복구가 완료되었습니다.');
  }

  function handleReset() {
    clearData();
    window.location.reload();
  }

  return (
    <div className="pb-6">
      <Header title="설정" onBack={() => onNavigate('home')} />

      <div className="px-4 space-y-4">
        {/* Teacher info */}
        <div className="bg-card rounded-[24px] shadow-sm p-4 space-y-3">
          <h3 className="font-bold text-sm">교사 정보</h3>
          <div>
            <label className="text-xs text-muted block mb-1">학교</label>
            <input
              type="text"
              value={school}
              onChange={e => setSchool(e.target.value)}
              onBlur={saveSchool}
              className="w-full border border-muted/30 rounded-[12px] px-3 py-2 bg-bg text-sm"
              placeholder="삼향초등학교"
            />
          </div>

          {/* Subjects */}
          <div>
            <label className="text-xs text-muted block mb-1">담당 과목</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {subjects.map((subj, idx) => {
                const sc = getSubjectColor(subj, subjects);
                return (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium"
                    style={{ backgroundColor: sc + '30', color: sc }}
                  >
                    <span className="text-text">{subj}</span>
                    <button
                      className="btn-bounce text-text/40 hover:text-red-400 ml-0.5"
                      onClick={() => removeSubject(idx)}
                    >
                      ✕
                    </button>
                  </span>
                );
              })}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSubject}
                onChange={e => setNewSubject(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addSubject()}
                className="flex-1 border border-muted/30 rounded-[12px] px-3 py-2 bg-bg text-sm"
                placeholder="과목 이름"
              />
              <button
                onClick={addSubject}
                className="btn-bounce bg-primary text-white px-4 rounded-[12px] text-sm font-medium"
              >
                추가
              </button>
            </div>
          </div>
        </div>

        {/* Tag settings */}
        <div className="bg-card rounded-[24px] shadow-sm p-4 space-y-3">
          <h3 className="font-bold text-sm">태그 관리</h3>

          {/* Preset tags */}
          <div>
            <p className="text-xs text-muted mb-2">프리셋 태그 (ON/OFF)</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(TAG_PRESETS).map(([name, { color, emoji }]) => {
                const enabled = data.tagSettings.presets[name] !== false;
                return (
                  <button
                    key={name}
                    className={`btn-bounce flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium border-2 transition-opacity ${
                      enabled ? 'border-text/20 opacity-100' : 'border-transparent opacity-40'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => togglePreset(name)}
                  >
                    <span>{emoji}</span>
                    <span>{name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom tags */}
          <div>
            <p className="text-xs text-muted mb-2">커스텀 태그</p>
            <div className="flex flex-wrap gap-2 mb-2">
              {(data.tagSettings.custom || []).map((tag, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium"
                  style={{ backgroundColor: tag.color || '#E5E5E5' }}
                >
                  <span>{tag.name}</span>
                  <button
                    className="btn-bounce ml-1 text-text/50 hover:text-text"
                    onClick={() => {
                      setEditingCustom(idx);
                      setCustomName(tag.name);
                      setCustomColor(tag.color || '#E5E5E5');
                      setShowCustomAdd(true);
                    }}
                  >
                    ✎
                  </button>
                  <button
                    className="btn-bounce text-text/50 hover:text-red-400"
                    onClick={() => deleteCustomTag(idx)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              className="btn-bounce text-xs text-primary font-medium"
              onClick={() => {
                setEditingCustom(null);
                setCustomName('');
                setCustomColor('#E5E5E5');
                setShowCustomAdd(true);
              }}
            >
              + 커스텀 태그 추가
            </button>
          </div>
        </div>

        {/* Excel export */}
        <div className="bg-card rounded-[24px] shadow-sm p-4 space-y-3">
          <h3 className="font-bold text-sm">엑셀 내보내기</h3>
          <div className="space-y-2">
            <button
              className="btn-bounce w-full bg-accent/30 rounded-[12px] px-4 py-3 text-sm text-left flex items-center gap-2"
              onClick={() => {
                if (data.classes.length === 0) { alert('반이 없습니다.'); return; }
                if (data.classes.length === 1) {
                  exportClassExcel(data.classes[0], data.tagSettings);
                } else {
                  setShowExportClass(true);
                }
              }}
            >
              <span>📊</span> 반별 내보내기
            </button>
            <button
              className="btn-bounce w-full bg-accent/30 rounded-[12px] px-4 py-3 text-sm text-left flex items-center gap-2"
              onClick={() => {
                if (data.classes.length === 0) { alert('반이 없습니다.'); return; }
                exportAllExcel(data.classes, data.tagSettings);
              }}
            >
              <span>📋</span> 전체 내보내기
            </button>
            <button
              className="btn-bounce w-full bg-accent/30 rounded-[12px] px-4 py-3 text-sm text-left flex items-center gap-2"
              onClick={() => {
                if (data.classes.length === 0) { alert('반이 없습니다.'); return; }
                exportSummaryExcel(data.classes, data.tagSettings);
              }}
            >
              <span>📈</span> 학생별 요약 + 통계
            </button>
          </div>
        </div>

        {/* Backup / Restore / Reset */}
        <div className="bg-card rounded-[24px] shadow-sm p-4 space-y-3">
          <h3 className="font-bold text-sm">데이터 관리</h3>
          <button
            onClick={handleBackup}
            className="btn-bounce w-full bg-blue-100 rounded-[12px] px-4 py-3 text-sm text-left flex items-center gap-2"
          >
            <span>💾</span> 백업 (JSON 다운로드)
          </button>
          <div>
            <label className="btn-bounce block w-full bg-blue-100 rounded-[12px] px-4 py-3 text-sm text-left cursor-pointer flex items-center gap-2">
              <span>📂</span> 복구 (JSON 업로드)
              <input
                ref={fileRef}
                type="file"
                accept=".json"
                onChange={handleRestoreFile}
                className="hidden"
              />
            </label>
          </div>
          <button
            onClick={() => setShowResetConfirm(true)}
            className="btn-bounce w-full bg-red-100 rounded-[12px] px-4 py-3 text-sm text-left flex items-center gap-2 text-red-500"
          >
            <span>🗑️</span> 데이터 초기화
          </button>
          {data.lastBackupDate && (
            <p className="text-xs text-muted text-center">마지막 백업: {data.lastBackupDate}</p>
          )}
        </div>

        {/* About */}
        <button
          onClick={() => setShowAbout(true)}
          className="btn-bounce w-full bg-card rounded-[24px] shadow-sm p-4 text-sm text-left flex items-center gap-3"
        >
          <span className="text-lg">📋</span>
          <div>
            <p className="font-bold">뚝딱교담수첩</p>
            <p className="text-xs text-muted">앱 소개 · v1.0</p>
          </div>
        </button>
      </div>

      {/* Custom tag modal */}
      <Modal open={showCustomAdd} onClose={() => setShowCustomAdd(false)} title={editingCustom !== null ? '태그 수정' : '커스텀 태그 추가'}>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted block mb-1">태그 이름</label>
            <input
              type="text"
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              className="w-full border border-muted/30 rounded-[12px] px-3 py-2 bg-bg"
              placeholder="예: 지각"
            />
          </div>
          <div>
            <label className="text-xs text-muted block mb-1">색상</label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={customColor}
                onChange={e => setCustomColor(e.target.value)}
                className="w-10 h-10 rounded-[8px] border-0 cursor-pointer"
              />
              <div
                className="flex-1 h-10 rounded-[12px] flex items-center justify-center text-sm font-medium"
                style={{ backgroundColor: customColor }}
              >
                {customName || '미리보기'}
              </div>
            </div>
          </div>
          <button
            onClick={saveCustomTag}
            className="btn-bounce w-full bg-primary text-white font-bold py-3 rounded-[16px]"
          >
            {editingCustom !== null ? '수정' : '추가'}
          </button>
        </div>
      </Modal>

      {/* Restore confirm modal */}
      <Modal open={!!showRestoreConfirm} onClose={() => setShowRestoreConfirm(null)} title="데이터 복구">
        <div className="space-y-3">
          <p className="text-sm">기존 데이터를 덮어씁니다. 계속할까요?</p>
          <div className="bg-tag-growth/30 rounded-[12px] p-3 text-xs">
            <p>반 수: {showRestoreConfirm?.classes?.length || 0}개</p>
            <p>학생 수: {showRestoreConfirm?.classes?.reduce((s, c) => s + c.students.length, 0) || 0}명</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowRestoreConfirm(null)} className="btn-bounce flex-1 bg-muted/20 font-bold py-3 rounded-[16px]">
              취소
            </button>
            <button onClick={confirmRestore} className="btn-bounce flex-1 bg-primary text-white font-bold py-3 rounded-[16px]">
              복구
            </button>
          </div>
        </div>
      </Modal>

      {/* Reset confirm - step 1 */}
      <Modal open={showResetConfirm} onClose={() => setShowResetConfirm(false)} title="데이터 초기화">
        <div className="space-y-3">
          <p className="text-sm text-red-500 font-medium">모든 데이터가 삭제됩니다!</p>
          <p className="text-xs text-muted">반, 학생, 기록, 설정이 모두 초기화됩니다. 이 작업은 되돌릴 수 없습니다.</p>
          <div className="flex gap-2">
            <button onClick={() => setShowResetConfirm(false)} className="btn-bounce flex-1 bg-muted/20 font-bold py-3 rounded-[16px]">
              취소
            </button>
            <button
              onClick={() => { setShowResetConfirm(false); setShowResetFinal(true); }}
              className="btn-bounce flex-1 bg-red-400 text-white font-bold py-3 rounded-[16px]"
            >
              계속
            </button>
          </div>
        </div>
      </Modal>

      {/* Reset confirm - step 2 */}
      <Modal open={showResetFinal} onClose={() => setShowResetFinal(false)} title="정말 초기화할까요?">
        <div className="space-y-3">
          <p className="text-sm text-center font-bold text-red-500">마지막 확인입니다</p>
          <div className="flex gap-2">
            <button onClick={() => setShowResetFinal(false)} className="btn-bounce flex-1 bg-muted/20 font-bold py-3 rounded-[16px]">
              취소
            </button>
            <button onClick={handleReset} className="btn-bounce flex-1 bg-red-600 text-white font-bold py-3 rounded-[16px]">
              초기화
            </button>
          </div>
        </div>
      </Modal>

      {/* About modal */}
      <Modal open={showAbout} onClose={() => setShowAbout(false)} wide>
        <div className="space-y-4 text-sm">
          <div className="text-center">
            <p className="text-4xl mb-2">📋</p>
            <h2 className="text-xl font-bold">뚝딱교담수첩</h2>
            <p className="text-xs text-muted mt-1">교담(전담) 교사를 위한 학생 누가기록 앱</p>
          </div>

          <div className="bg-bg rounded-[16px] p-4 space-y-3">
            <div className="flex gap-3 items-start">
              <span className="text-lg mt-0.5">🏫</span>
              <div>
                <p className="font-bold">다과목 반 관리</p>
                <p className="text-xs text-muted">여러 과목을 담당해도 과목별로 반을 나눠 관리할 수 있어요.</p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-lg mt-0.5">📝</span>
              <div>
                <p className="font-bold">누가기록</p>
                <p className="text-xs text-muted">날짜 · 메모 · 태그로 학생별 관찰 기록을 간편하게 남겨요.</p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-lg mt-0.5">🏷️</span>
              <div>
                <p className="font-bold">태그 시스템</p>
                <p className="text-xs text-muted">우수 · 참여 · 성장 · 소란 · 특이 + 커스텀 태그로 기록을 분류해요.</p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-lg mt-0.5">📊</span>
              <div>
                <p className="font-bold">엑셀 내보내기</p>
                <p className="text-xs text-muted">반별 · 전체 · 학생별 요약 + 통계까지 엑셀로 바로 뽑아요.</p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-lg mt-0.5">💾</span>
              <div>
                <p className="font-bold">백업 & 복구</p>
                <p className="text-xs text-muted">JSON 파일로 데이터를 백업하고, 언제든 복구할 수 있어요.</p>
              </div>
            </div>
          </div>

          <div className="bg-tag-growth/20 rounded-[16px] p-3 text-xs text-center">
            <p>모든 데이터는 <b>내 브라우저에만</b> 저장돼요.</p>
            <p className="mt-0.5">서버 전송 없이 안전하게 사용하세요.</p>
          </div>

          <div className="text-center text-xs text-muted pt-1">
            <a href="https://mumuclass.kr" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
              &copy; 2026 무궁무진클래스 · 용쌤
            </a>
          </div>

          <button
            onClick={() => setShowAbout(false)}
            className="btn-bounce w-full bg-primary text-white font-bold py-3 rounded-[16px]"
          >
            닫기
          </button>
        </div>
      </Modal>

      {/* Export class picker */}
      <Modal open={showExportClass} onClose={() => setShowExportClass(false)} title="반 선택">
        <div className="space-y-2">
          {data.classes.map(cls => (
            <button
              key={cls.id}
              className="btn-bounce w-full bg-bg rounded-[12px] px-4 py-3 text-sm text-left font-medium"
              onClick={() => {
                exportClassExcel(cls, data.tagSettings);
                setShowExportClass(false);
              }}
            >
              {cls.subject ? `[${cls.subject}] ` : ''}{cls.grade}-{cls.classNum} ({cls.students.length}명)
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
