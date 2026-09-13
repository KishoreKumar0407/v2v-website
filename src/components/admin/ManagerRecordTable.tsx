import { Pencil, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ManagerField, ManagerRecord } from './managerTypes';

interface Props {
    fields: ManagerField[];
    records: ManagerRecord[];
    onEdit: (record: ManagerRecord) => void;
    onDelete: (record: ManagerRecord) => void;
    onView?: (record: ManagerRecord) => void;
    maxColumns?: number;
}

const isImageField = (field: ManagerField) => {
    const normalizedName = String(field.name || '').toLowerCase().replace(/[_-]+/g, ' ');
    return field.field_type === 'image' || /(^|\s)(image|cover)(\s|$)/i.test(normalizedName) || /image.*url|cover.*url/i.test(normalizedName);
};

const isImageValue = (value: string) => /^data:image\//i.test(value) || /^https?:\/\/.+\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(value);

const formatCell = (field: ManagerField, value: string) => {
    if (field.field_type === 'boolean') return value === 'true' || value === '1' ? 'Yes' : 'No';
    if (field.field_type === 'percentage' && value) return `${value}%`;
    if (field.field_type === 'long_text' && value.length > 40) return value.slice(0, 40) + '…';
    if (isImageField(field) && value) {
        return (
            <div className="flex items-center justify-center">
                <img src={value} alt={field.name} className="h-12 w-12 rounded-lg object-cover border border-border/50 bg-background" />
            </div>
        );
    }
    return value || '—';
};

export default function ManagerRecordTable({ fields, records, onEdit, onDelete, onView, maxColumns = 5 }: Props) {
    const imageField = fields.find(isImageField);
    const displayFields = fields.filter(f => !isImageField(f)).slice(0, imageField ? maxColumns - 1 : maxColumns);

    if (records.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground">
                <p className="mb-2 text-4xl">📋</p>
                <p>No projects yet. Click "Add Project" to create the first one.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-xl border border-border/50">
            <Table>
                <TableHeader>
                    <TableRow>
                        {displayFields.map(f => (
                            <TableHead key={f.id ?? f.name}>{f.name}</TableHead>
                        ))}
                        {imageField && <TableHead>Image</TableHead>}
                        <TableHead>Created By</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {records.map(record => (
                        <TableRow
                            key={record.id}
                            className={onView ? 'cursor-pointer hover:bg-muted/30' : undefined}
                            onClick={onView ? () => onView(record) : undefined}
                        >
                            {displayFields.map(f => (
                                <TableCell key={f.id ?? f.name} className="max-w-[180px] truncate">
                                    {formatCell(f, record.values[f.name] ?? '')}
                                </TableCell>
                            ))}
                            {imageField && (
                                <TableCell className="max-w-[120px]">
                                    {record.values[imageField.name] ? (
                                        <img src={record.values[imageField.name]} alt="Project image" className="h-12 w-12 rounded-lg object-cover border border-border/50 bg-background" />
                                    ) : (
                                        <span className="text-muted-foreground">—</span>
                                    )}
                                </TableCell>
                            )}
                            <TableCell className="text-xs text-muted-foreground">{record.created_by || '—'}</TableCell>
                            <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                                <div className="flex justify-end gap-1">
                                    <button onClick={() => onEdit(record)} className="p-2 rounded-lg hover:bg-primary/20 text-primary transition-colors" aria-label="Edit">
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => onDelete(record)} className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors" aria-label="Delete">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
