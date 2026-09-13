import { useRef } from 'react';
import { ManagerField } from './managerTypes';
import { processImageFile } from '@/lib/imageUtils';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface Props {
    field: ManagerField;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}

const inputClass = 'w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary';

export default function ManagerFieldRenderer({ field, value, onChange, disabled }: Props) {
    const id = `field-${field.id ?? field.name}`;
    const normalizedName = String(field.name || '').toLowerCase().replace(/[_-]+/g, ' ');
    const isImageField = field.field_type === 'image' || /(^|\s)(image|cover)(\s|$)/i.test(normalizedName) || /image.*url|cover.*url/i.test(normalizedName);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const renderImageInput = () => (
        <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <input
                    ref={fileInputRef}
                    id={id}
                    type="file"
                    accept="image/*"
                    disabled={disabled}
                    onChange={async e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                            const compressed = await processImageFile(file);
                            onChange(compressed);
                        } catch (err) {
                            console.error('Failed to process image file:', err);
                        } finally {
                            e.target.value = '';
                        }
                    }}
                    className="hidden"
                />
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-blue-300 text-xs px-3 py-2 rounded-lg border border-slate-700 transition-colors"
                >
                    <Upload className="w-4 h-4" />
                    <span>Upload Image File</span>
                </button>
                <span className="text-xs text-muted-foreground">or image URL:</span>
                <input
                    type="text"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    disabled={disabled}
                    className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary w-full sm:w-auto"
                    placeholder="https://example.com/image.png or /images/pic.png"
                />
                {value && (
                    <button
                        type="button"
                        onClick={() => onChange('')}
                        disabled={disabled}
                        className="text-red-400 hover:text-red-300 text-xs px-2 py-1 flex items-center gap-1 rounded bg-red-950/30 border border-red-800/40"
                    >
                        <X className="w-3.5 h-3.5" /> Remove
                    </button>
                )}
            </div>
            {value && (
                <div className="flex items-center gap-3 pt-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <ImageIcon className="w-3.5 h-3.5 text-primary" /> Preview:
                    </span>
                    <div className="max-h-48 max-w-md rounded-lg border border-border bg-slate-950/50 p-1 flex items-center justify-center overflow-hidden">
                        <img
                            src={value}
                            alt="Preview"
                            className="max-h-44 max-w-full object-contain rounded"
                            onError={e => {
                                (e.target as HTMLElement).style.display = 'none';
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );

    switch (field.field_type) {
        case 'long_text':
            return (
                <textarea
                    id={id}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    disabled={disabled}
                    rows={4}
                    className={`${inputClass} resize-y`}
                    placeholder={field.name}
                />
            );
        case 'select':
            return (
                <select
                    id={id}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    disabled={disabled}
                    className={inputClass}
                >
                    <option value="">Select {field.name}</option>
                    {(field.options || []).map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
            );
        case 'boolean':
            return (
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        id={id}
                        type="checkbox"
                        checked={value === 'true' || value === '1'}
                        onChange={e => onChange(e.target.checked ? 'true' : 'false')}
                        disabled={disabled}
                        className="w-4 h-4 accent-primary"
                    />
                    <span className="text-sm text-muted-foreground">Yes</span>
                </label>
            );
        case 'date':
            return (
                <input
                    id={id}
                    type="date"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    disabled={disabled}
                    className={inputClass}
                />
            );
        case 'number':
        case 'percentage':
            return (
                <div className="flex items-center gap-2">
                    <input
                        id={id}
                        type="number"
                        value={value}
                        onChange={e => onChange(e.target.value)}
                        disabled={disabled}
                        min={field.field_type === 'percentage' ? 0 : undefined}
                        max={field.field_type === 'percentage' ? 100 : undefined}
                        className={inputClass}
                        placeholder={field.field_type === 'percentage' ? '0–100' : field.name}
                    />
                    {field.field_type === 'percentage' && <span className="text-sm text-muted-foreground">%</span>}
                </div>
            );
        case 'email':
            return (
                <input
                    id={id}
                    type="email"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    disabled={disabled}
                    className={inputClass}
                    placeholder="email@example.com"
                />
            );
        case 'url': {
            if (isImageField) {
                return renderImageInput();
            }
            return (
                <input
                    id={id}
                    type="url"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    disabled={disabled}
                    className={inputClass}
                    placeholder="https://"
                />
            );
        }
        case 'image':
            return renderImageInput();
        default:
            return (
                <input
                    id={id}
                    type="text"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    disabled={disabled}
                    className={inputClass}
                    placeholder={field.name}
                />
            );
    }
}
