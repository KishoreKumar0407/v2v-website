import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { API_BASE_URL, getAuthHeaders } from '@/lib/apiConfig';
import { useToast } from '@/components/ui/toast';
import { ManagerDefinition, ManagerField, ManagerRecord } from './managerTypes';
import { ManagerIcon } from './managerIcons';
import ManagerRecordForm from './ManagerRecordForm';
import ManagerRecordTable from './ManagerRecordTable';
import AdminManagerLayout from './AdminManagerLayout';

interface AdminUser {
    role: string;
    email: string;
    name: string;
}

/** Independent manager page — one page per created manager (e.g. Financial Management). */
export default function ManagerPage() {
    const { slug } = useParams<{ slug: string }>();
    const toast = useToast();
    const [user, setUser] = useState<AdminUser | null>(null);
    const [manager, setManager] = useState<ManagerDefinition | null>(null);
    const [fields, setFields] = useState<ManagerField[]>([]);
    const [records, setRecords] = useState<ManagerRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editingRecord, setEditingRecord] = useState<ManagerRecord | null>(null);
    const [viewRecord, setViewRecord] = useState<ManagerRecord | null>(null);
    const [saving, setSaving] = useState(false);

    const authHeaders = (_u: AdminUser) => getAuthHeaders();

    const fetchManager = async (u: AdminUser) => {
        const r = await fetch(`${API_BASE_URL}/api/managers/${slug}`, { headers: authHeaders(u) });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || 'Failed to load manager');
        setManager(d.data);
        setFields(d.data.fields || []);
    };

    const fetchRecords = async (u: AdminUser) => {
        const r = await fetch(`${API_BASE_URL}/api/managers/${slug}/records`, { headers: authHeaders(u) });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || 'Failed to load records');
        setRecords(d.data || []);
        if (d.fields) setFields(d.fields);
    };

    useEffect(() => {
        const init = async () => {
            const stored = localStorage.getItem('admin_user');
            if (!stored) { setLoading(false); return; }
            let parsed: AdminUser;
            try {
                parsed = JSON.parse(stored);
            } catch {
                localStorage.removeItem('admin_user');
                setLoading(false);
                return;
            }
            setUser(parsed);
            try {
                await fetchManager(parsed);
                await fetchRecords(parsed);
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Access denied');
            }
            setLoading(false);
        };
        init();
    }, [slug]);

    const saveRecord = async (values: Record<string, string>) => {
        if (!user) return;
        setSaving(true);
        try {
            const url = editingRecord
                ? `${API_BASE_URL}/api/managers/${slug}/records/${editingRecord.id}`
                : `${API_BASE_URL}/api/managers/${slug}/records`;
            const r = await fetch(url, {
                method: editingRecord ? 'PUT' : 'POST',
                headers: { ...authHeaders(user), 'Content-Type': 'application/json' },
                body: JSON.stringify({ values }),
            });
            const d = await r.json();
            if (!r.ok) throw new Error(d.error || 'Save failed');
            toast.showToast(editingRecord ? '✅ Record updated' : '✅ Record created', 'success');
            setShowForm(false);
            setEditingRecord(null);
            await fetchRecords(user);
        } catch (e) {
            toast.showToast(`❌ ${e instanceof Error ? e.message : 'Error'}`, 'error');
        }
        setSaving(false);
    };

    const deleteRecord = async (record: ManagerRecord) => {
        if (!user || !confirm('Delete this record?')) return;
        try {
            const r = await fetch(`${API_BASE_URL}/api/managers/${slug}/records/${record.id}`, {
                method: 'DELETE',
                headers: authHeaders(user),
            });
            const d = await r.json();
            if (!r.ok) throw new Error(d.error);
            toast.showToast('✅ Record deleted', 'success');
            setViewRecord(null);
            await fetchRecords(user);
        } catch {
            toast.showToast('❌ Delete failed', 'error');
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" /></div>;
    if (!user) return <Navigate to="/admin-login" replace />;

    if (error) {
        return (
            <AdminManagerLayout>
                <div className="flex items-center justify-center py-20">
                    <Card className="max-w-md w-full border-red-500/30">
                        <CardContent className="pt-6 text-center">
                            <p className="text-2xl font-bold text-red-400 mb-2">403 Forbidden</p>
                            <p className="text-muted-foreground text-sm mb-6">{error}</p>
                            <Button variant="outline" onClick={() => window.location.href = '/admin-dashboard'}>Return to Dashboard</Button>
                        </CardContent>
                    </Card>
                </div>
            </AdminManagerLayout>
        );
    }

    return (
        <AdminManagerLayout>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="border border-cyan-500/30 bg-cyan-950/10">
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                            <div className="flex gap-4">
                                {manager?.image ? (
                                    <img src={manager.image} alt={manager.name} className="w-16 h-16 rounded-xl object-cover border border-cyan-500/30 shrink-0 hidden sm:block" />
                                ) : (
                                    <div className="w-16 h-16 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0 hidden sm:flex">
                                        <ManagerIcon name={manager?.icon} className="w-8 h-8 text-cyan-400" />
                                    </div>
                                )}
                                <div>
                                    <CardTitle className="flex items-center gap-2 text-cyan-400 text-xl uppercase tracking-wide">
                                        <ManagerIcon name={manager?.icon} className="w-6 h-6 sm:hidden" />
                                        {manager?.name}
                                    </CardTitle>
                                    <div className="mt-2 space-y-1 text-sm text-slate-400">
                                        {manager?.category && <p><span className="text-muted-foreground">Category:</span> {manager.category}</p>}
                                        {manager?.project_name && <p><span className="text-muted-foreground">Project:</span> {manager.project_name}</p>}
                                        {manager?.description && <p>{manager.description}</p>}
                                    </div>
                                </div>
                            </div>
                            <Button onClick={() => { setEditingRecord(null); setShowForm(true); setViewRecord(null); }} className="bg-cyan-600 hover:bg-cyan-500 text-white shrink-0">
                                <Plus className="w-4 h-4 mr-2" /> Add Project
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {showForm && (
                            <ManagerRecordForm
                                key={editingRecord?.id ?? 'new'}
                                fields={fields}
                                record={editingRecord}
                                title={editingRecord ? 'Edit Project' : 'New Project'}
                                submitText={editingRecord ? 'Update Project' : 'Add Project'}
                                itemLabel="Project"
                                theme="cyan"
                                saving={saving}
                                onCancel={() => { setShowForm(false); setEditingRecord(null); }}
                                onSubmit={saveRecord}
                            />
                        )}

                        {viewRecord && !showForm && (
                            <div className="p-5 rounded-xl border border-cyan-500/20 bg-card/60 space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-cyan-400">Item Details</h3>
                                    <button onClick={() => setViewRecord(null)} className="text-muted-foreground hover:text-white"><X className="w-5 h-5" /></button>
                                </div>
                                {fields.map(f => {
                                    const value = viewRecord.values[f.name] || '';
                                    const isImage = f.field_type === 'image' || /(^|\s)(image|cover)(\s|$)/i.test(String(f.name || '').toLowerCase().replace(/[_-]+/g, ' ')) || /image.*url|cover.*url/i.test(String(f.name || '').toLowerCase().replace(/[_-]+/g, ' '));
                                    return (
                                        <div key={f.id ?? f.name}>
                                            <p className="text-xs text-muted-foreground">{f.name}</p>
                                            {isImage && value ? (
                                                <img src={value} alt={f.name} className="mt-2 h-24 w-24 rounded-lg object-cover border border-border/50 bg-background" />
                                            ) : (
                                                <p className="text-sm font-medium">{value || '—'}</p>
                                            )}
                                        </div>
                                    );
                                })}
                                <p className="text-xs text-muted-foreground pt-2 border-t border-border/30">Created by {viewRecord.created_by}</p>
                                <div className="flex gap-2 pt-2">
                                    <Button size="sm" variant="outline" onClick={() => { setEditingRecord(viewRecord); setShowForm(true); setViewRecord(null); }}>Edit</Button>
                                    <Button size="sm" variant="destructive" onClick={() => deleteRecord(viewRecord)}>Delete</Button>
                                </div>
                            </div>
                        )}

                        <div>
                            <h3 className="text-sm font-semibold text-cyan-400 mb-3 uppercase tracking-wide">Projects</h3>
                            <ManagerRecordTable
                                fields={fields}
                                records={records}
                                onEdit={r => { setEditingRecord(r); setShowForm(true); setViewRecord(null); }}
                                onDelete={deleteRecord}
                                onView={r => { setViewRecord(r); setShowForm(false); }}
                            />
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </AdminManagerLayout>
    );
}
