import { useState } from 'react';
import { X } from 'lucide-react';
import { ManagerField, ManagerRecord } from './managerTypes';
import ManagerFieldRenderer from './ManagerFieldRenderer';
import { Button } from '@/components/ui/button';

interface Props {
    fields: ManagerField[];
    record?: ManagerRecord | null;
    onSubmit: (values: Record<string, string>) => void;
    onCancel: () => void;
    saving?: boolean;
    title: string;
    submitText?: string;
    theme?: 'cyan' | 'purple' | 'blue' | 'sky' | 'emerald';
    itemLabel?: string;
}

const themeClasses = {
    cyan: { border: 'border-cyan-500/30', button: 'bg-cyan-600 hover:bg-cyan-500 text-white' },
    purple: { border: 'border-purple-500/30', button: 'bg-purple-600 hover:bg-purple-500 text-white' },
    blue: { border: 'border-blue-500/30', button: 'bg-blue-600 hover:bg-blue-500 text-white' },
    sky: { border: 'border-sky-500/30', button: 'bg-sky-600 hover:bg-sky-500 text-white' },
    emerald: { border: 'border-emerald-500/30', button: 'bg-emerald-600 hover:bg-emerald-500 text-white' },
};

const isWideField = (field: ManagerField) => {
    const normalizedName = String(field.name || '').toLowerCase().replace(/[_-]+/g, ' ');
    const looksLikeImageField = field.field_type === 'image' || /(^|\s)(image|cover)(\s|$)/i.test(normalizedName) || /image.*url|cover.*url/i.test(normalizedName);
    return field.field_type === 'long_text' || field.field_type === 'image' || looksLikeImageField || field.field_type === 'url';
};

export default function ManagerRecordForm({
    fields, record, onSubmit, onCancel, saving, title, submitText = 'Save',
    theme = 'cyan', itemLabel = 'Project',
}: Props) {
    const buildInitial = () => {
        const v: Record<string, string> = {};
        fields.forEach(f => { v[f.name] = record?.values?.[f.name] ?? (f.field_type === 'boolean' ? 'false' : ''); });
        return v;
    };

    const [values, setValues] = useState<Record<string, string>>(buildInitial);
    const [error, setError] = useState('');
    const t = themeClasses[theme];

    const setField = (name: string, val: string) => setValues(prev => ({ ...prev, [name]: val }));

    const handleSubmit = () => {
        for (const f of fields) {
            if (f.required && !String(values[f.name] ?? '').trim()) {
                setError(`${f.name} is required.`);
                return;
            }
        }
        setError('');
        onSubmit(values);
    };

    return (
        <div className={`mb-6 p-5 rounded-xl border ${t.border} bg-card/80 space-y-4`}>
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg text-primary">{title}</h3>
                <button type="button" onClick={onCancel} className="text-muted-foreground hover:text-white">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fields.map(field => (
                    <div key={field.id ?? field.name} className={isWideField(field) ? 'md:col-span-2' : ''}>
                        <label className="text-xs text-muted-foreground mb-1 block">
                            {field.name}{field.required && <span className="text-red-400 ml-1">*</span>}
                        </label>
                        <ManagerFieldRenderer
                            field={field}
                            value={values[field.name] ?? ''}
                            onChange={v => setField(field.name, v)}
                            disabled={saving}
                        />
                    </div>
                ))}
            </div>

            {error && <p className="text-sm font-medium text-red-400">{error}</p>}

            <div className="flex gap-3 justify-end pt-2">
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={saving} className={t.button}>
                    {saving ? 'Saving...' : submitText || `Add ${itemLabel}`}
                </Button>
            </div>
        </div>
    );
}
