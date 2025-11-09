import { useEffect } from "react";
import { X } from "lucide-react";
import styles from "./ChartModal.module.css";

const ChartModal = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const stop = (e) => e.stopPropagation();

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modalFrame} onClick={stop}>
        <div className={styles.header}>
          <div className="flex items-start justify-between gap-6">
            <div className="flex flex-col">
              <h2 className="text-2xl font-semibold text-gray-900 leading-tight">{title}</h2>
              <p className="text-sm text-gray-500 mt-1">in CHF Mio.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className={styles.closeBtn}
                aria-label="Close modal"
              >
                <span className="mr-1">Close</span>
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className={styles.headerSeparator} />
        </div>
        <div className={styles.contentScroll}>{children}</div>
      </div>
    </div>
  );
};

export default ChartModal;
