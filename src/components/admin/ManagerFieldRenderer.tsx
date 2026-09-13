import { ManagerField } from './managerTypes';

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
                return (
                    <div className="space-y-2">
                        <input
                            id={id}
                            type="file"
                            accept="image/*"
                            onChange={async e => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.onload = () => onChange(String(reader.result ?? ''));
                                reader.readAsDataURL(file);
                            }}
                            disabled={disabled}
                            className={`${inputClass} file:mr-3 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white file:cursor-pointer`}
                        />
                        {value && (
                            <img src={value} alt="Selected upload" className="max-h-48 max-w-md rounded-lg border border-border object-contain bg-slate-950/40 p-1" />
                        )}
                    </div>
                );
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
            return (
                <div className="space-y-2">
                    <input
                        id={id}
                        type="file"
                        accept="image/*"
                        onChange={async e => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = () => onChange(String(reader.result ?? ''));
                            reader.readAsDataURL(file);
                        }}
                        disabled={disabled}
                        className={`${inputClass} file:mr-3 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white file:cursor-pointer`}
                    />
                    {value && (
                        <img src={value} alt="Selected upload" className="max-h-48 max-w-md rounded-lg border border-border object-contain bg-slate-950/40 p-1" />
                    )}
                </div>
            );
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
