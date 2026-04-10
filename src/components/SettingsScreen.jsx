import { useState, useRef } from 'react';
import Header from './Header';
import Modal from './Modal';
import { TAG_PRESETS, exportBackupJSON, clearData, todayStr } from '../utils/store';
import { exportClassExcel, exportAllExcel, exportSummaryExcel } from '../utils/excel';

export default function SettingsScreen({ data, onSave, onNavigate }) {
  const [subject, setSubject] = useState(data.teacher.subject || '');
  const [school, setSchool] = useState(data.teacher.school || '');
  const [showCustomAdd, setShowCustomAdd] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customColor, setCustomColor] = useState('#E5E5E5');
  const [editingCustom, setEditingCustom] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showResetFinal, setShowResetFinal] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(null);
  const [showExportPicker, setShowExportPicker] = useState(false);
  const [showExportClass, setShowExportClass] = useState(false);
  const fileRef = useRef(null);

  function saveTeacher() {
    onSave({
      ...data,
      teacher: { subject: subject.trim(), school: school.trim() },
    });
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
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-muted block mb-1">학교</label>
              <input
                type="text"
                value={school}
                onChange={e => setSchool(e.target.value)}
                onBlur={saveTeacher}
                className="w-full border border-muted/30 rounded-[12px] px-3 py-2 bg-bg text-sm"
                placeholder="삼향초"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted block mb-1">과목</label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                onBlur={saveTeacher}
                className="w-full border border-muted/30 rounded-[12px] px-3 py-2 bg-bg text-sm"
                placeholder="음악"
              />
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
              {cls.grade}-{cls.classNum} ({cls.students.length}명)
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
