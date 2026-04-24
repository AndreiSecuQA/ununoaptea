import { useEffect } from "react";
import { createPortal } from "react-dom";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function LegalModal({ open, onClose, title, children }: Props) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-ink/50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className="bg-cream max-w-2xl w-full max-h-[85vh] rounded-md overflow-hidden shadow-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink/10">
          <h2 className="serif text-xl">{title}</h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-ink text-2xl leading-none"
            aria-label="Închide"
          >
            ×
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto text-sm leading-relaxed">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
