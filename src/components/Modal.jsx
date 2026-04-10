import { useEffect } from 'react';

export default function Modal({ open, onClose, title, children, wide }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="fixed inset-0 bg-black/30" />
      <div
        className={`relative bg-card rounded-[24px] shadow-xl p-6 w-full ${wide ? 'max-w-lg' : 'max-w-sm'} max-h-[85vh] overflow-y-auto`}
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <h3 className="text-lg font-bold mb-4 text-text">{title}</h3>
        )}
        {children}
      </div>
    </div>
  );
}
