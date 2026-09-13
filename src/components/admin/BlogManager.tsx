import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { API_BASE_URL, getAuthHeaders } from '@/lib/apiConfig';
import { useToast } from '@/components/ui/toast';
import { ManagerDefinition, ManagerField, ManagerRecord } from './managerTypes';
import { ManagerIcon } from './managerIcons';
import ManagerRecordForm from './ManagerRecordForm';
import ManagerRecordTable from './ManagerRecordTable';

interface AdminUser {
    role: string;
    email: string;
    name: string;
}

interface Props {
    manager: ManagerDefinition;
    user: AdminUser;
    onDeleted?: () => void;
}

/** Blog Manager — same UX as CustomManagerSection but labeled for blog posts. */
export default function BlogManager({ manager: initial, user, onDeleted }: Props) {
    const toast = useToast();
    const isMainAdmin = (user.role || '').toUpperCase() === 'MAIN_ADMIN';
    const [manager, setManager] = useState<ManagerDefinition>(initial);
    const [fields, setFields] = useState<ManagerField[]>(initial.fields || []);
    const [records, setRecords] = useState<ManagerRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingRecord, setEditingRecord] = useState<ManagerRecord | null>(null);
    const [saving, setSaving] = useState(false);

    const headers = getAuthHeaders();

    const load = async () => {
        try {
            const [mgrRes, recRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/managers/${initial.slug}`, { headers }),
                fetch(`${API_BASE_URL}/api/managers/${initial.slug}/records`, { headers }),
            ]);
            const mgrData = await mgrRes.json();
            const recData = await recRes.json();
            if (mgrRes.ok && mgrData.data) {
                setManager(mgrData.data);
                setFields(mgrData.data.fields || []);
            }
            if (recRes.ok) setRecords(recData.data || []);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    useEffect(() => {
        load();
    }, [initial.slug]);

    const openNew = () => {
        setEditingRecord(null);
        setShowForm(true);
    };

    const openEdit = (record: ManagerRecord) => {
        setEditingRecord(record);
        setShowForm(true);
    };

    const saveRecord = async (values: Record<string, string>) => {
        setSaving(true);
        try {
            const url = editingRecord
                ? `${API_BASE_URL}/api/managers/${initial.slug}/records/${editingRecord.id}`
                : `${API_BASE_URL}/api/managers/${initial.slug}/records`;
            const r = await fetch(url, {
                method: editingRecord ? 'PUT' : 'POST',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ values }),
            });
            const d = await r.json();
            if (!r.ok) throw new Error(d.error || 'Save failed');
            toast.showToast(editingRecord ? '✅ Post updated' : '✅ Post added', 'success');
            setShowForm(false);
            setEditingRecord(null);
            await load();
        } catch (e) {
            toast.showToast(`❌ ${e instanceof Error ? e.message : 'Error'}`, 'error');
        }
        setSaving(false);
    };

    const deleteRecord = async (record: ManagerRecord) => {
        if (!confirm('Delete this post?')) return;
        try {
            const r = await fetch(`${API_BASE_URL}/api/managers/${initial.slug}/records/${record.id}`, {
                method: 'DELETE',
                headers,
            });
            const d = await r.json();
            if (!r.ok) throw new Error(d.error);
            toast.showToast('✅ Post deleted', 'success');
            await load();
        } catch {
            toast.showToast('❌ Delete failed', 'error');
        }
    };

    const deleteManager = async () => {
        if (!isMainAdmin) return;
        if (!confirm(`Remove "${manager.name}"?\n\nThis manager will be removed from navigation. Existing projects/records are preserved in the database.`)) return;
        try {
            const r = await fetch(`${API_BASE_URL}/api/managers/${initial.slug}`, {
                method: 'DELETE',
                headers,
            });
            const d = await r.json();
            if (!r.ok) throw new Error(d.error || 'Delete failed');
            toast.showToast(`✅ ${manager.name} removed`, 'success');
            onDeleted?.();
        } catch (e) {
            toast.showToast(`❌ ${e instanceof Error ? e.message : 'Delete failed'}`, 'error');
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
            <Card className="border border-sky-500/30 bg-sky-950/10">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-sky-400">
                                <ManagerIcon name={manager.icon} className="w-5 h-5" />
                                {manager.name}
                                <span className="text-xs bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full border border-sky-500/30 font-normal">Blog Manager</span>
                            </CardTitle>
                            <CardDescription className="mt-2">
                                {manager.category && <span className="block">Category: {manager.category}</span>}
                                {manager.project_name && <span className="block">Project: {manager.project_name}</span>}
                                <span className="block">{manager.description || `Create, edit and delete posts for the "${manager.name}" section`}</span>
                            </CardDescription>
                        </div>
                        <div className="flex flex-wrap gap-2 shrink-0">
                            <Button onClick={openNew} className="bg-sky-600 hover:bg-sky-500 text-white">
                                <Plus className="w-4 h-4 mr-2" /> New Post
                            </Button>
                            {isMainAdmin && (
                                <Button
                                    variant="outline"
                                    onClick={deleteManager}
                                    className="border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" /> Delete Manager
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-400" />
                        </div>
                    ) : (
                        <>
                            {showForm && (
                                <ManagerRecordForm
                                    key={editingRecord?.id ?? 'new'}
                                    fields={fields}
                                    record={editingRecord}
                                    title={editingRecord ? 'Edit Post' : 'New Post'}
                                    submitText={editingRecord ? 'Update Post' : 'Add Post'}
                                    itemLabel="Post"
                                    theme="sky"
                                    saving={saving}
                                    onCancel={() => { setShowForm(false); setEditingRecord(null); }}
                                    onSubmit={saveRecord}
                                />
                            )}

                            <ManagerRecordTable
                                fields={fields}
                                records={records}
                                onEdit={openEdit}
                                onDelete={deleteRecord}
                            />
                        </>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}
