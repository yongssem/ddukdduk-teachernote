import { useState } from 'react';

export default function InitialSetupScreen({ onComplete }) {
  const [school, setSchool] = useState('');
  const [subjects, setSubjects] = useState(['']);
  const [step, setStep] = useState(0); // 0=welcome, 1=setup

  function updateSubject(idx, value) {
    const next = [...subjects];
    next[idx] = value;
    setSubjects(next);
  }

  function addSubject() {
    setSubjects([...subjects, '']);
  }

  function removeSubject(idx) {
    if (subjects.length <= 1) return;
    setSubjects(subjects.filter((_, i) => i !== idx));
  }

  function handleComplete() {
    const trimmedSubjects = subjects.map(s => s.trim()).filter(Boolean);
    if (!school.trim() || trimmedSubjects.length === 0) {
      alert('학교 이름과 과목을 1개 이상 입력해주세요.');
      return;
    }
    onComplete({ school: school.trim(), subjects: trimmedSubjects });
  }

  if (step === 0) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-6">
        <div className="bg-card rounded-[24px] shadow-sm p-8 max-w-sm w-full text-center space-y-4">
          <p className="text-4xl">📋</p>
          <h1 className="text-xl font-bold text-text">뚝딱교담수첩</h1>
          <p className="text-sm text-muted">교담(전담) 교사를 위한<br/>학생 누가기록 앱</p>
          <div className="bg-tag-growth/30 rounded-[16px] p-3 text-xs text-left text-text">
            <p className="font-bold mb-1">중요 안내</p>
            <p>데이터는 <b>이 브라우저에만</b> 저장됩니다.</p>
            <p className="mt-1">설정 &gt; 백업 버튼으로 주기적으로 백업하세요.</p>
          </div>
          <button
            onClick={() => setStep(1)}
            className="btn-bounce w-full bg-primary text-white font-bold py-3 rounded-[16px]"
          >
            시작하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-6">
      <div className="bg-card rounded-[24px] shadow-sm p-6 max-w-sm w-full space-y-5">
        <div className="text-center">
          <p className="text-2xl mb-1">🏫</p>
          <h2 className="text-lg font-bold">교사 정보 설정</h2>
          <p className="text-xs text-muted mt-1">나중에 설정에서 변경할 수 있어요</p>
        </div>

        {/* School */}
        <div>
          <label className="text-xs text-muted block mb-1">학교 이름</label>
          <input
            type="text"
            value={school}
            onChange={e => setSchool(e.target.value)}
            className="w-full border border-muted/30 rounded-[12px] px-3 py-2.5 bg-bg text-sm"
            placeholder="삼향초등학교"
            autoFocus
          />
        </div>

        {/* Subjects */}
        <div>
          <label className="text-xs text-muted block mb-1">담당 과목</label>
          <div className="space-y-2">
            {subjects.map((subj, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={subj}
                  onChange={e => updateSubject(idx, e.target.value)}
                  className="flex-1 border border-muted/30 rounded-[12px] px-3 py-2.5 bg-bg text-sm"
                  placeholder={idx === 0 ? '예: 음악' : '예: 미술'}
                />
                {subjects.length > 1 && (
                  <button
                    onClick={() => removeSubject(idx)}
                    className="btn-bounce w-9 h-9 rounded-full bg-tag-noise/30 text-sm flex items-center justify-center text-muted hover:text-red-400"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={addSubject}
            className="btn-bounce mt-2 text-xs text-primary font-medium"
          >
            + 과목 추가
          </button>
        </div>

        <button
          onClick={handleComplete}
          className="btn-bounce w-full bg-primary text-white font-bold py-3 rounded-[16px]"
        >
          설정 완료
        </button>
      </div>
    </div>
  );
}
