import { type ReactNode, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, CheckCircle, Info, AlertCircle, Inbox, Loader } from 'lucide-react';
import { useToast } from '../../store/toast';
import type { ToastType } from '../../types';

// ── Modal ────────────────────────────────────────────────────

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}
export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overlay-enter"
      style={{ background: 'rgba(9,9,12,0.85)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className={`w-full ${widths[size]} bg-surface border border-white/10 rounded-2xl
                       shadow-[0_25px_80px_rgba(0,0,0,0.45),0_0_40px_rgba(255,122,53,0.06)] modal-enter flex flex-col max-h-[90vh] relative overflow-hidden`}>
        {/* Accent glow top */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent" />
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 bg-white/[0.02] border-b border-white/[0.06] flex-shrink-0 relative">
          <h2 className="font-syne font-bold text-[17px] tracking-tight">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="btn-icon w-9 h-9"
          >
            <X size={16} />
          </button>
        </div>
        {/* Body */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6">{children}</div>
      </div>
    </div>,
    document.body
  );
}

// ── Confirm Dialog ────────────────────────────────────────────

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
}
export function ConfirmDialog({
  open, onClose, onConfirm, title, message,
  confirmLabel = 'Konfirmasi', danger = false, loading = false
}: ConfirmDialogProps) {
  if (!open) return null;
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overlay-enter"
      style={{ background: 'rgba(9,9,12,0.85)' }}
    >
      <div className="w-full max-w-sm bg-surface border border-white/10 rounded-2xl p-6 modal-enter relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-danger to-transparent" />
        <div className="flex items-start gap-4 mb-5">
          <div className="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={20} className="text-danger" />
          </div>
          <div>
            <h3 className="font-syne font-bold text-[15px] mb-1">{title}</h3>
            <p className="text-[13px] text-sub leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
          <button type="button" onClick={onClose} className="btn-ghost w-full sm:w-auto" disabled={loading}>Batal</button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={danger ? 'btn-danger' : 'btn-primary'}
          >
            {loading ? <Spinner size={14} /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Empty State ───────────────────────────────────────────────

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}
export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center anim-fade-up">
      <div className="w-16 h-16 rounded-2xl bg-elevated border border-border flex items-center
                      justify-center mb-4 text-muted">
        {icon || <Inbox size={28} />}
      </div>
      <p className="font-syne font-bold text-[15px] mb-2">{title}</p>
      {description && <p className="text-[13px] text-sub max-w-[280px] leading-relaxed mb-4">{description}</p>}
      {action}
    </div>
  );
}

// ── Loading State ─────────────────────────────────────────────

export function LoadingState({ message = 'Memuat data...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-8 h-8 border-2 border-border border-t-accent rounded-full spin" />
      <p className="text-[13px] text-sub">{message}</p>
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────

export function Spinner({ size = 16 }: { size?: number }) {
  return (
    <div
      className="border-2 border-border border-t-current rounded-full spin inline-block"
      style={{ width: size, height: size }}
    />
  );
}

// ── Toast Container ───────────────────────────────────────────

const toastIcons: Record<ToastType, ReactNode> = {
  success: <CheckCircle size={15} />,
  error:   <AlertCircle size={15} />,
  warning: <AlertTriangle size={15} />,
  info:    <Info size={15} />,
};
const toastColors: Record<ToastType, string> = {
  success: 'border-ok/30 text-ok',
  error:   'border-danger/30 text-danger',
  warning: 'border-warn/30 text-warn',
  info:    'border-accent/30 text-accent',
};

export function ToastContainer() {
  const { toasts, remove } = useToast();
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-[340px] w-full px-4">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-start gap-3 bg-surface border rounded-xl px-4 py-3
                      shadow-xl anim-fade-up ${toastColors[t.type]}`}
        >
          <span className="mt-px flex-shrink-0">{toastIcons[t.type]}</span>
          <p className="text-[13px] text-tx flex-1 leading-relaxed">{t.message}</p>
          <button type="button" onClick={() => remove(t.id)} className="text-sub hover:text-tx ml-1 flex-shrink-0">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Form Fields ───────────────────────────────────────────────

interface FieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  hint?: string;
  htmlFor?: string;
}
export function FormField({ label, error, required, children, hint, htmlFor }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="font-mono text-[11px] text-sub uppercase tracking-[0.08em]">
        {label}{required && <span className="text-danger ml-1">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-[11px] text-muted">{hint}</p>}
      {error && <p className="text-[11px] text-danger">{error}</p>}
    </div>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}
export function InputField({ label, error, id, name, ...props }: InputProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const fieldName = name ?? fieldId;

  if (!label) return (
    <div>
      <input id={fieldId} name={fieldName} className={`input-field ${error ? 'border-danger' : ''}`} {...props} />
      {error && <p className="text-[11px] text-danger mt-1">{error}</p>}
    </div>
  );
  return (
    <FormField label={label} htmlFor={fieldId} error={error} required={props.required as boolean}>
      <input id={fieldId} name={fieldName} className={`input-field ${error ? 'border-danger' : ''}`} {...props} />
    </FormField>
  );
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}
export function TextAreaField({ label, error, id, name, ...props }: TextAreaProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const fieldName = name ?? fieldId;

  if (!label) return (
    <div>
      <textarea id={fieldId} name={fieldName} className={`input-field resize-none ${error ? 'border-danger' : ''}`} {...props} />
      {error && <p className="text-[11px] text-danger mt-1">{error}</p>}
    </div>
  );
  return (
    <FormField label={label} htmlFor={fieldId} error={error} required={props.required as boolean}>
      <textarea id={fieldId} name={fieldName} className={`input-field resize-none ${error ? 'border-danger' : ''}`} {...props} />
    </FormField>
  );
}

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}
export function SelectField({ label, error, options, id, name, ...props }: SelectFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const fieldName = name ?? fieldId;

  const el = (
    <select
      id={fieldId}
      name={fieldName}
      className={`input-field bg-void ${error ? 'border-danger' : ''}`}
      {...props}
    >
      {options.map(o => (
        <option key={o.value} value={o.value} className="bg-surface">{o.label}</option>
      ))}
    </select>
  );
  if (!label) return el;
  return (
    <FormField label={label} htmlFor={fieldId} error={error} required={props.required as boolean}>
      {el}
    </FormField>
  );
}

// ── Tag Input ─────────────────────────────────────────────────

interface TagInputProps {
  label?: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  id?: string;
  name?: string;
}
export function TagInput({ label, tags, onChange, placeholder = 'Ketik lalu Enter...', id, name }: TagInputProps) {
  const generatedId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const fieldId = id ?? generatedId;
  const fieldName = name ?? fieldId;

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = inputRef.current?.value.trim();
      if (val && !tags.includes(val)) onChange([...tags, val]);
      if (inputRef.current) inputRef.current.value = '';
    }
  }
  function remove(tag: string) {
    onChange(tags.filter(t => t !== tag));
  }

  const el = (
    <div
      className="min-h-[42px] bg-void border border-border rounded-lg px-3 py-2 flex
                 flex-wrap gap-1.5 items-center cursor-text focus-within:border-accent
                 transition-colors"
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map(tag => (
        <span key={tag} className="flex items-center gap-1 bg-elevated border border-border
                                   text-[12px] text-tx px-2 py-0.5 rounded-md">
          {tag}
          <button type="button" onClick={() => remove(tag)} className="text-sub hover:text-danger ml-0.5">
            <X size={10} />
          </button>
        </span>
      ))}
      <input
        id={fieldId}
        name={fieldName}
        aria-label={label ?? 'Tag input'}
        ref={inputRef}
        onKeyDown={handleKey}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[120px] bg-transparent outline-none text-[13px]
                   text-tx placeholder-muted"
      />
    </div>
  );

  if (!label) return el;
  return (
    <FormField label={label} htmlFor={fieldId} hint="Tekan Enter atau koma untuk menambah tag">
      {el}
    </FormField>
  );
}

// ── Image Uploader ────────────────────────────────────────────

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  id?: string;
  name?: string;
  maxWidth?: number;
  quality?: number;
}
export function ImageUploader({ value, onChange, label, id, name, maxWidth = 1200, quality = 0.78 }: ImageUploaderProps) {
  const generatedId = useId();
  const baseId = id ?? generatedId;
  const fileId = `${baseId}-file`;
  const urlId = `${baseId}-url`;
  const fieldName = name ?? baseId;

  async function compressImage(file: File): Promise<string> {
    const imageUrl = URL.createObjectURL(file);

    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const next = new Image();
        next.onload = () => resolve(next);
        next.onerror = () => reject(new Error('Gagal memuat gambar.'));
        next.src = imageUrl;
      });

      const scale = img.width > maxWidth ? maxWidth / img.width : 1;
      const width = Math.max(1, Math.round(img.width * scale));
      const height = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas tidak tersedia.');

      context.drawImage(img, 0, 0, width, height);
      return canvas.toDataURL('image/jpeg', quality);
    } finally {
      URL.revokeObjectURL(imageUrl);
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;

    try {
      const compressed = await compressImage(file);
      onChange(compressed);
    } catch {
      const reader = new FileReader();
      reader.onload = ev => onChange(ev.target?.result as string);
      reader.readAsDataURL(file);
    } finally {
      e.target.value = '';
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <span className="font-mono text-[11px] text-sub uppercase tracking-[0.08em]">{label}</span>
      )}
      <div className="flex gap-3 items-start flex-wrap">
        {value && (
          <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-border">
            <img src={value} className="w-full h-full object-cover" alt="preview" />
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-danger text-white
                         flex items-center justify-center"
            >
              <X size={10} />
            </button>
          </div>
        )}
        <label htmlFor={fileId} className="flex flex-col items-center justify-center w-24 h-24 border
                           border-dashed border-border rounded-xl cursor-pointer
                           text-sub hover:border-accent hover:text-accent transition-colors">
          <Loader size={20} />
          <span className="text-[10px] mt-1">Unggah</span>
          <input id={fileId} name={`${fieldName}-file`} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </label>
      </div>
      <input
        id={urlId}
        name={`${fieldName}-url`}
        aria-label={label ? `${label} URL` : 'Image URL'}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="input-field text-[12px]"
        placeholder="atau tempel URL gambar..."
      />
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  color?: string;
  loading?: boolean;
}
export function StatCard({ label, value, icon, trend, color = 'text-accent', loading }: StatCardProps) {
  return (
    <div className="card group anim-fade-up relative overflow-hidden hover:border-accent/30">
      <div className={`absolute top-0 left-0 right-0 h-[2px] ${color.replace('text-', 'bg-')}`} />

      <div className="flex items-center gap-2.5 mb-4 sm:mb-5">
        <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center border border-white/10
                         ${color} bg-white/[0.04] group-hover:scale-105 transition-transform flex-shrink-0`}>
          {icon}
        </div>
        {trend && (
          <span className="font-mono text-[9px] sm:text-[10px] text-sub bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full ml-auto whitespace-nowrap">
            {trend}
          </span>
        )}
      </div>

      {loading ? (
        <div className="h-8 sm:h-9 w-16 sm:w-20 bg-white/[0.04] rounded-lg animate-pulse" />
      ) : (
        <div className="font-syne font-extrabold text-[26px] sm:text-[32px] tracking-tight leading-none mb-2 text-tx">
          {value}
        </div>
      )}

      <div className="font-mono text-[10px] sm:text-[11px] text-sub uppercase tracking-[0.1em] font-medium">{label}</div>
    </div>
  );
}
