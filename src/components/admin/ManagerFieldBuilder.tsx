import { Button } from '@/components/ui/button';
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { ManagerField, FIELD_TYPE_OPTIONS, MAX_DYNAMIC_FIELDS } from './managerTypes';

interface Props {
    fields: ManagerField[];
    onChange: (fields: ManagerField[]) => void;
}

const emptyField = (): ManagerField => ({
    name: '',
    field_type: 'text',
    required: false,
    options: [],
});

export default function ManagerFieldBuilder({ fields, onChange }: Props) {
    const updateField = (index: number, patch: Partial<ManagerField>) => {
        const next = fields.map((f, i) => (i === index ? { ...f, ...patch } : f));
        onChange(next);
    };

    const addField = () => {
        if (fields.length >= MAX_DYNAMIC_FIELDS) return;
        onChange([...fields, emptyField()]);
    };

    const removeField = (index: number) => {
        onChange(fields.filter((_, i) => i !== index));
    };

    const moveField = (index: number, direction: -1 | 1) => {
        const target = index + direction;
        if (target < 0 || target >= fields.length) return;
        const next = [...fields];
        [next[index], next[target]] = [next[target], next[index]];
        onChange(next);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-200">Fields</h4>
                <span className="text-xs text-muted-foreground">{fields.length} / {MAX_DYNAMIC_FIELDS}</span>
            </div>

            {fields.length === 0 && (
                <p className="text-sm text-muted-foreground italic">No fields yet. Add at least one field to define record structure.</p>
            )}

            {fields.map((field, index) => (
                <div key={index} className="p-4 rounded-xl border border-border/50 bg-card/40 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-muted-foreground">Field {index + 1}</span>
                        <div className="flex items-center gap-1">
                            <button type="button" onClick={() => moveField(index, -1)} disabled={index === 0} className="text-muted-foreground hover:text-white p-1 disabled:opacity-30" title="Move up">
                                <ChevronUp className="w-4 h-4" />
                            </button>
                            <button type="button" onClick={() => moveField(index, 1)} disabled={index === fields.length - 1} className="text-muted-foreground hover:text-white p-1 disabled:opacity-30" title="Move down">
                                <ChevronDown className="w-4 h-4" />
                            </button>
                            <button type="button" onClick={() => removeField(index)} className="text-red-400 hover:text-red-300 p-1">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Field Name</label>
                            <input
                                value={field.name}
                                onChange={e => updateField(index, { name: e.target.value })}
                                placeholder="e.g. Record Title"
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Field Type</label>
                            <select
                                value={field.field_type}
                                onChange={e => updateField(index, { field_type: e.target.value as ManagerField['field_type'] })}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
                            >
                                {FIELD_TYPE_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    {field.field_type === 'select' && (
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Options (one per line)</label>
                            <textarea
                                value={(field.options || []).join('\n')}
                                onChange={e => updateField(index, { options: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) })}
                                rows={3}
                                placeholder={'Planning\nIn Progress\nCompleted'}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm resize-y"
                            />
                        </div>
                    )}
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                            type="checkbox"
                            checked={field.required}
                            onChange={e => updateField(index, { required: e.target.checked })}
                            className="w-4 h-4 accent-teal-500"
                        />
                        Required
                    </label>
                </div>
            ))}

            <Button type="button" variant="outline" onClick={addField} disabled={fields.length >= MAX_DYNAMIC_FIELDS} className="w-full border-dashed">
                <Plus className="w-4 h-4 mr-2" /> Add Field
            </Button>
        </div>
    );
}
