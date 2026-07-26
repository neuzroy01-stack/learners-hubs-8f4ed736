import React, { useRef, useState } from 'react';
import { Upload, Trash2, ImageIcon, Loader2 } from 'lucide-react';

interface ImageUploaderProps {
  value?: string;
  onChange: (dataUrl: string) => void;
  onRemove?: () => void;
  label?: string;
  hint?: string;
  shape?: 'circle' | 'square' | 'wide';
  maxSizeMb?: number;
  maxDimension?: number;
  disabled?: boolean;
}

const ACCEPTED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

async function compressImage(file: File, maxDimension: number): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read the selected file.'));
    reader.readAsDataURL(file);
  });

  return new Promise<string>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(dataUrl);
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  onRemove,
  label = 'Image',
  hint = 'JPG, PNG or WEBP · max 2 MB',
  shape = 'square',
  maxSizeMb = 2,
  maxDimension = 800,
  disabled = false
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleFile = async (file?: File | null) => {
    if (!file) return;
    setError('');
    if (!ACCEPTED.includes(file.type)) {
      setError('Only JPG, PNG or WEBP images are allowed.');
      return;
    }
    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(`Image is too large. Maximum size is ${maxSizeMb} MB.`);
      return;
    }
    setBusy(true);
    try {
      onChange(await compressImage(file, maxDimension));
    } catch (err: any) {
      setError(err?.message || 'Upload failed. Please try another image.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const frame =
    shape === 'circle'
      ? 'h-20 w-20 rounded-full'
      : shape === 'wide'
      ? 'h-20 w-36 rounded-xl'
      : 'h-20 w-20 rounded-xl';

  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">{label}</label>
      <div className="flex items-center gap-3">
        <div className={`${frame} shrink-0 overflow-hidden border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800`}>
          {value ? (
            <img src={value} alt={label} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center text-slate-400">
              <ImageIcon className="h-5 w-5" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={disabled || busy}
              onClick={() => inputRef.current?.click()}
              className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              <span>{value ? 'Replace' : 'Upload'}</span>
            </button>
            {value && onRemove && (
              <button
                type="button"
                disabled={disabled || busy}
                onClick={() => {
                  setError('');
                  onRemove();
                }}
                className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-rose-200 px-3 py-1.5 text-[11px] font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-900 dark:hover:bg-rose-950/40"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Remove</span>
              </button>
            )}
          </div>
          <p className="text-[10px] text-slate-400">{hint}</p>
          {error && <p className="text-[10px] font-semibold text-rose-500">{error}</p>}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
};
