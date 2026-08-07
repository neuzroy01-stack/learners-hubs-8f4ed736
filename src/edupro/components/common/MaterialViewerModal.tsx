import React from 'react';
import { X, Download, ExternalLink } from 'lucide-react';

interface Props {
  title: string;
  url: string;
  fileType?: string | null;
  onClose: () => void;
}

const officeExt = ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'];

const viewerSrc = (url: string, type: string) => {
  if (officeExt.includes(type)) {
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
  }
  return url;
};

/** Read-only in-app viewer for study materials (PDF, images, office docs). */
export const MaterialViewerModal: React.FC<Props> = ({ title, url, fileType, onClose }) => {
  const type = (fileType || url.split('.').pop() || '').toLowerCase().replace(/[^a-z]/g, '');
  const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3">
      <div className="flex h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 p-4 dark:border-slate-800">
          <h3 className="truncate text-sm font-black text-slate-900 dark:text-white">{title}</h3>
          <div className="flex items-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-bold dark:border-slate-700"
            >
              <ExternalLink className="h-3.5 w-3.5" /> New tab
            </a>
            <a
              href={url}
              download
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-2.5 py-1.5 text-[11px] font-bold text-white"
            >
              <Download className="h-3.5 w-3.5" /> Download
            </a>
            <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close viewer">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 bg-slate-100 dark:bg-slate-950">
          {isImage ? (
            <img src={url} alt={title} className="mx-auto max-h-full object-contain" />
          ) : (
            <iframe title={title} src={viewerSrc(url, type)} className="h-full w-full border-0" />
          )}
        </div>
      </div>
    </div>
  );
};
