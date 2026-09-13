import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Globe, FlaskConical, Layers, Plus, Settings, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { API_BASE_URL, getAuthHeaders } from '@/lib/apiConfig';
import { useToast } from '@/components/ui/toast';

const isTruthy = (v: unknown) => v === true || v === 1 || v === '1';
import ManagerFieldBuilder from './ManagerFieldBuilder';
import { ManagerDefinition, ManagerField } from './managerTypes';
import { MANAGER_ICON_OPTIONS, ManagerIcon } from './managerIcons';
import AdminManagerLayout from './AdminManagerLayout';
import CustomManagerSection from './CustomManagerSection';

interface AdminUser {
    role: string;
    email: string;
    name: string;
    id?: number;
    can_manage_blogs?: boolean | number | string;
    blog_manager?: boolean | number | string;
    can_manage_experiments?: boolean | number | string;
    experiment_manager?: boolean | number | string;
}
interface CoFounder { id: number; name: string; email: string; }

export default function ManagerManagementAdmin() {
    const navigate = useNavigate();
    const toast = useToast();
    const [user, setUser] = useState<AdminUser | null>(null);
    const [managers, setManagers] = useState<ManagerDefinition[]>([]);
    const [coFounders, setCoFounders] = useState<CoFounder[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [editingManager, setEditingManager] = useState<ManagerDefinition | null>(null);
    const [permManager, setPermManager] = useState<ManagerDefinition | null>(null);
    const [permMap, setPermMap] = useState<Record<number, boolean>>({});
    const [form, setForm] = useState({
        name: '', category: '', project_name: '', description: '', icon: 'layers', image: '', status: 'active',
    });
    const [fields, setFields] = useState<ManagerField[]>([]);
    const [saving, setSaving] = useState(false);

    const DEFAULT_MANAGER_FIELDS: ManagerField[] = [
        { name: 'Project Name', field_type: 'text', required: true, options: [] },
        { name: 'Technical Name/Version', field_type: 'text', required: false, options: [] },
        { name: 'Description', field_type: 'long_text', required: true, options: [] },
        { name: 'Status', field_type: 'select', required: false, options: ['In Progress', 'Testing', 'Completed'] },
        { name: 'Completion', field_type: 'percentage', required: false, options: [] },
        { name: 'Cover Image', field_type: 'image', required: false, options: [] },
    ];

    const headers = (u: AdminUser) => ({
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
    });

    const fetchManagers = async (u: AdminUser) => {
        const r = await fetch(`${API_BASE_URL}/api/managers`, { headers: headers(u) });
        const d = await r.json();
        if (d.data) setManagers(d.data);
    };

    const fetchCoFounders = async (u: AdminUser) => {
        const r = await fetch(`${API_BASE_URL}/api/admin-users`, { headers: headers(u) });
        const d = await r.json();
        if (d.data) setCoFounders(d.data.filter((a: { role: string }) => (a.role || '').toUpperCase() !== 'MAIN_ADMIN'));
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
            if ((parsed.role || '').toUpperCase() !== 'MAIN_ADMIN') { setLoading(false); return; }
            setUser(parsed);
            await fetchManagers(parsed);
            await fetchCoFounders(parsed);
            setLoading(false);
        };
        init();
    }, []);

    const openCreate = () => {
        setForm({ name: '', category: '', project_name: '', description: '', icon: 'layers', image: '', status: 'active' });
        setFields(DEFAULT_MANAGER_FIELDS);
        setEditingManager(null);
        setShowCreate(true);
    };

    const openEdit = async (manager: ManagerDefinition) => {
        if (!user) return;
        const r = await fetch(`${API_BASE_URL}/api/managers/${manager.slug}`, { headers: headers(user) });
        const d = await r.json();
        if (d.data) {
            setEditingManager(d.data);
            setForm({
                name: d.data.name,
                category: d.data.category || '',
                project_name: d.data.project_name || '',
                description: d.data.description || '',
                icon: d.data.icon || 'layers',
                image: d.data.image || '',
                status: d.data.status || 'active',
            });
            setFields(d.data.fields || []);
            setShowCreate(true);
        }
    };

    const saveManager = async (confirmRemove = false) => {
        if (!user || !form.name.trim()) {
            toast.showToast('Manager name is required', 'error');
            return;
        }
        if (!form.category.trim()) {
            toast.showToast('Category is required', 'error');
            return;
        }
        setSaving(true);
        try {
            const payload = { ...form, fields };
            if (editingManager) {
                await fetch(`${API_BASE_URL}/api/managers/${editingManager.slug}`, {
                    method: 'PUT',
                    headers: headers(user),
                    body: JSON.stringify(form),
                });
                const r = await fetch(`${API_BASE_URL}/api/managers/${editingManager.slug}/fields`, {
                    method: 'PUT',
                    headers: headers(user),
                    body: JSON.stringify({ fields, confirmRemove }),
                });
                const d = await r.json();
                if (!r.ok) {
                    if (d.requiresConfirmation && !confirmRemove) {
                        if (confirm(`Removing fields: ${d.fieldsToRemove?.join(', ')}. Existing data is preserved. Continue?`)) {
                            setSaving(false);
                            return saveManager(true);
                        }
                        setSaving(false);
                        return;
                    }
                    throw new Error(d.error);
                }
                toast.showToast('✅ Manager updated successfully', 'success');
            } else {
                const r = await fetch(`${API_BASE_URL}/api/managers`, {
                    method: 'POST',
                    headers: headers(user),
                    body: JSON.stringify(payload),
                });
                const d = await r.json();
                if (!r.ok) throw new Error(d.error);
                toast.showToast('✅ Manager created successfully', 'success');
            }
            setShowCreate(false);
            await fetchManagers(user);
        } catch (e) {
            toast.showToast(`❌ ${e instanceof Error ? e.message : 'Error'}`, 'error');
        }
        setSaving(false);
    };

    const deleteManager = async (manager: ManagerDefinition) => {
        if (!user || !confirm(`Deactivate "${manager.name}"? Records will be preserved.`)) return;
        const r = await fetch(`${API_BASE_URL}/api/managers/${manager.slug}`, {
            method: 'DELETE', headers: headers(user),
        });
        if (r.ok) { toast.showToast('Manager deactivated', 'success'); fetchManagers(user); }
    };

    const openPermissions = async (manager: ManagerDefinition) => {
        if (!user) return;
        setPermManager(manager);
        const r = await fetch(`${API_BASE_URL}/api/managers/${manager.slug}/permissions`, { headers: headers(user) });
        const d = await r.json();
        const map: Record<number, boolean> = {};
        (d.data || []).forEach((p: { admin_user_id: number }) => { map[p.admin_user_id] = true; });
        setPermMap(map);
    };

    const togglePermission = async (userId: number, granted: boolean) => {
        if (!user || !permManager) return;
        await fetch(`${API_BASE_URL}/api/managers/${permManager.slug}/permissions/${userId}`, {
            method: 'PUT',
            headers: headers(user),
            body: JSON.stringify({ granted }),
        });
        setPermMap(prev => ({ ...prev, [userId]: granted }));
        toast.showToast(granted ? '✅ Access granted' : 'Access revoked', 'success');
    };

    const isMainAdmin = (user?.role || '').toUpperCase() === 'MAIN_ADMIN';
    const canManageBlogs = isMainAdmin || isTruthy(user?.can_manage_blogs) || isTruthy(user?.blog_manager);
    const canManageExperiments = isMainAdmin || isTruthy(user?.can_manage_experiments) || isTruthy(user?.experiment_manager);

    if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" /></div>;
    if (!user || !isMainAdmin) return <Navigate to="/admin-dashboard" replace />;

    return (
        <AdminManagerLayout requireMainAdmin>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {canManageBlogs && (
                        <Card className="border border-blue-500/30 bg-blue-950/10">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2 text-blue-400">
                                            <Globe className="w-5 h-5" /> Blog Manager
                                        </CardTitle>
                                        <CardDescription>Manage blog posts and website updates.</CardDescription>
                                    </div>
                                    <Button onClick={() => navigate('/admin/blog-manager')} className="bg-blue-600 hover:bg-blue-500 text-white">
                                        Open
                                    </Button>
                                </div>
                            </CardHeader>
                        </Card>
                    )}
                    {canManageExperiments && (
                        <Card className="border border-purple-500/30 bg-purple-950/10">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2 text-purple-400">
                                            <FlaskConical className="w-5 h-5" /> Experiments Manager
                                        </CardTitle>
                                        <CardDescription>Manage research and development projects.</CardDescription>
                                    </div>
                                    <Button onClick={() => navigate('/admin/experiment-manager')} className="bg-purple-600 hover:bg-purple-500 text-white">
                                        Open
                                    </Button>
                                </div>
                            </CardHeader>
                        </Card>
                    )}
                </div>
                <Card className="border border-indigo-500/30 bg-indigo-950/10">
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <CardTitle className="flex flex-col gap-2 text-indigo-400 sm:flex-row sm:items-center">
                                    <span className="flex items-center gap-2">
                                        <Layers className="w-5 h-5" /> Custom Managers
                                    </span>
                                </CardTitle>
                                <CardDescription>
                                    Create independent manager modules (Financial Manager, Marketing Manager, HR Manager, etc.).
                                    Each manager has its own page, items, and permissions.
                                </CardDescription>
                            </div>
                            <Button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-500 text-white">
                                <Plus className="w-4 h-4 mr-2" /> Add New Manager
                            </Button>
                        </div>
                    </CardHeader>
                    {managers.length === 0 && (
                        <CardContent>
                            <p className="text-center py-8 text-muted-foreground italic">No managers created yet. Use Add New Manager to start.</p>
                        </CardContent>
                    )}
                </Card>

                {user && managers.map(m => (
                    <CustomManagerSection
                        key={m.id}
                        manager={m}
                        user={user}
                        onDeleted={() => fetchManagers(user)}
                    />
                ))}

                {showCreate && (
                    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/70 overflow-y-auto">
                        <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl w-full max-w-2xl my-8">
                            <h3 className="text-lg font-bold mb-4">{editingManager ? 'Edit Manager' : 'Add New Manager'}</h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-muted-foreground">Manager Name *</label>
                                        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full bg-background border border-border rounded-lg px-3 py-2 mt-1" placeholder="Financial Manager" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground">Category *</label>
                                        <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full bg-background border border-border rounded-lg px-3 py-2 mt-1" placeholder="Finance" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-muted-foreground">Project / Section Name</label>
                                        <input value={form.project_name} onChange={e => setForm(f => ({ ...f, project_name: e.target.value }))} className="w-full bg-background border border-border rounded-lg px-3 py-2 mt-1" placeholder="Financial Projects" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground">Icon</label>
                                        <select value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} className="w-full bg-background border border-border rounded-lg px-3 py-2 mt-1">
                                            {MANAGER_ICON_OPTIONS.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground">Description</label>
                                    <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full bg-background border border-border rounded-lg px-3 py-2 mt-1 resize-y" placeholder="Manage financial workflows and reporting" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-muted-foreground">Image Upload (optional)</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                const reader = new FileReader();
                                                reader.onload = () => setForm(f => ({ ...f, image: String(reader.result ?? '') }));
                                                reader.readAsDataURL(file);
                                            }}
                                            className="w-full bg-background border border-border rounded-lg px-3 py-2 mt-1 file:mr-3 file:rounded file:border-0 file:bg-indigo-600 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white file:cursor-pointer"
                                        />
                                        {form.image && <img src={form.image} alt="Manager preview" className="mt-3 max-h-48 max-w-md rounded-lg border border-border object-contain bg-slate-950/40 p-1" />}
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground">Status</label>
                                        <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full bg-background border border-border rounded-lg px-3 py-2 mt-1">
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                    </div>
                                </div>
                                <ManagerFieldBuilder fields={fields} onChange={setFields} />
                                <div className="flex justify-end gap-2 pt-4">
                                    <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                                    <Button onClick={() => saveManager()} disabled={saving} className="bg-indigo-600 text-white">
                                        {saving ? 'Saving...' : (editingManager ? 'Update Manager' : 'Create Manager')}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {permManager && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
                        <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl w-full max-w-md">
                            <h3 className="text-lg font-bold mb-2">Permissions — {permManager.name}</h3>
                            <p className="text-xs text-muted-foreground mb-4">Grant co-founders access to this independent manager.</p>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {coFounders.map(cf => (
                                    <label key={cf.id} className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-card/40">
                                        <span className="text-sm">{cf.name || cf.email}</span>
                                        <input type="checkbox" checked={!!permMap[cf.id]} onChange={e => togglePermission(cf.id, e.target.checked)} className="w-4 h-4 accent-indigo-500" />
                                    </label>
                                ))}
                            </div>
                            <Button className="w-full mt-4" variant="outline" onClick={() => setPermManager(null)}>Close</Button>
                        </div>
                    </div>
                )}
            </motion.div>
        </AdminManagerLayout>
    );
}
