import Modal from './Modal';

export default function FirstRunModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="환영합니다!">
      <div className="space-y-3 text-sm text-text">
        <p className="text-2xl text-center">📋</p>
        <p className="font-bold text-center text-base">뚝딱교담수첩</p>
        <p>
          교담(전담) 교사를 위한 학생 누가기록 앱입니다.
        </p>
        <div className="bg-tag-growth/30 rounded-[16px] p-3 text-xs">
          <p className="font-bold mb-1">중요 안내</p>
          <p>데이터는 <b>이 브라우저에만</b> 저장됩니다.</p>
          <p className="mt-1">설정 &gt; 백업 버튼으로 주기적으로 백업하세요.</p>
        </div>
        <button
          onClick={onClose}
          className="btn-bounce w-full bg-primary text-white font-bold py-3 rounded-[16px] mt-2"
        >
          시작하기
        </button>
      </div>
    </Modal>
  );
}
