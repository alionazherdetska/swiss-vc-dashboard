import { useEffect } from "react";
import { X } from "lucide-react";
import ExportButton from "./ExportButton";
import styles from "./ChartModal.module.css";

const ChartModal = ({ isOpen, onClose, title, children, onExport, headerRight = null }) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

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
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <h2 className="text-2xl font-semibold text-gray-900 leading-tight">{title}</h2>
              <p className="text-sm text-gray-500 mt-1">in CHF Mio.</p>
            </div>
            <div className={`flex items-center ${styles.exportContainer}`}>
              {onExport && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Download</span>
                  <ExportButton
                    onClick={() => onExport("csv")}
                    label="CSV"
                    iconOnly={false}
                    showIcon={true}
                    className="!h-10 !px-4 !rounded-full !bg-white !border !border-gray-300 !text-gray-800 hover:!bg-gray-50"
                    title="Download as CSV"
                  />
                  <ExportButton
                    onClick={() => onExport("pdf")}
                    label="PDF"
                    iconOnly={false}
                    showIcon={true}
                    className="!h-10 !px-4 !rounded-full !bg-white !border !border-gray-300 !text-gray-800 hover:!bg-gray-50"
                    title="Download as PDF"
                  />
                </div>
              )}
              {headerRight}
              <button onClick={onClose} className={styles.closeBtn} aria-label="Close modal">
                Close
                <X className="h-5 w-5" />
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