import { useEffect, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LogOut, User, Mail, Briefcase, Target, Linkedin, Award, Rocket, ExternalLink, Shield, Plus, Pencil, Trash2, X, RefreshCw, MessageSquare, Globe, FlaskConical, Cpu, Layers, Check, Lock, Camera, KeyRound, Eye, EyeOff } from 'lucide-react';
import { API_BASE_URL, getAuthHeaders } from "@/lib/apiConfig";
import { teamMembers } from "@/data/teamData";
import { useToast } from "@/components/ui/toast";
import AdminManagerNav from "./AdminManagerNav";
import { ManagerDefinition } from "./managerTypes";
import CustomManagerSection from "./CustomManagerSection";
import ManagerAccessRequestCard from "./ManagerAccessRequestCard";
import FAQManager from "./FAQManager";
import ServicesManager from "./ServicesManager";
import HomepageContentManager from "./HomepageContentManager";

interface ContactMessage { id: number; created_at: string; name: string; email: string; message: string; }
interface AdminUser { id: number; name: string; email: string; role: string; image?: string; session_token?: string; can_manage_blogs: boolean; can_manage_experiments: boolean; blog_granted_by?: string; experiment_granted_by?: string; blog_manager?: boolean; experiment_manager?: boolean; }
interface Blog { id: number; title: string; description: string; content: string; image: string; category: string; author: string; published_at: string; }
interface PendingRegistration { id: number; name: string; email: string; requested_at: string; }
interface ManagerAccessRequest {
    id: number;
    admin_user_id: number;
    requester_name: string;
    requester_email: string;
    request_type: 'blog' | 'experiment' | 'custom';
    manager_id?: number | null;
    manager_name?: string;
    message?: string;
    status: string;
    requested_at: string;
}

const WEBSITE_MANAGER_EMAIL = 'sivagurunathan.v2v@gmail.com';
const PROJECT_HEAD_EMAIL = 'sivaramireddy.v2v@gmail.com';
const PROJECT_HEAD_ROLE = 'project_head';
const WEBSITE_MANAGER_ROLE = 'website_manager';

interface Project { id: number; name: string; technicalName: string; description: string; image: string; status: string; completion: number; created_by?: string; created_by_email?: string; }

const isTruthy = (v: unknown) => v === true || v === 1 || v === '1';

const emptyBlog = { title: '', description: '', content: '', image: '', category: 'V2V Insights', author: 'V2V Tech' };
const emptyProject = { name: '', technicalName: '', description: '', image: '', status: 'In Progress', completion: 0 };

const AdminDashboard = ({ focusSection = 'all' }: { focusSection?: 'all' | 'blogs' | 'experiments' | 'faqs' | 'services' | 'capabilities' | 'our-team' }) => {
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [pendingUsers, setPendingUsers] = useState<PendingRegistration[]>([]);
    const [managerAccessRequests, setManagerAccessRequests] = useState<ManagerAccessRequest[]>([]);
    const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<AdminUser | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [permissionSavingId, setPermissionSavingId] = useState<number | null>(null);
    const [adminEdits, setAdminEdits] = useState<Record<number, { can_manage_blogs: boolean; can_manage_experiments: boolean; dirty: boolean; }>>({});
    const [managerPermEdits, setManagerPermEdits] = useState<Record<number, Record<number, boolean>>>({});
    const [managerPermGrantedBy, setManagerPermGrantedBy] = useState<Record<number, Record<number, string>>>({});
    const [managerPermDirty, setManagerPermDirty] = useState<Record<number, boolean>>({});
    const [adminMsgs, setAdminMsgs] = useState<Record<number, string>>({});
    const toast = useToast();
    const [showAddAdmin, setShowAddAdmin] = useState(false);
    const [newAdminForm, setNewAdminForm] = useState({ name: '', email: '', password: '', role: 'CO_FOUNDER', can_manage_blogs: false, can_manage_experiments: false });
    const [showBlogForm, setShowBlogForm] = useState(false);
    const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
    const [blogForm, setBlogForm] = useState(emptyBlog);
    const [blogSaving, setBlogSaving] = useState(false);
    const [blogMsg, setBlogMsg] = useState('');
    const [showProfileEdit, setShowProfileEdit] = useState(false);
    const [profileForm, setProfileForm] = useState({ name: '', image: '' });
    const [profileSaving, setProfileSaving] = useState(false);
    const [projects, setProjects] = useState<Project[]>([]);
    const [managers, setManagers] = useState<ManagerDefinition[]>([]);
    const [showProjectForm, setShowProjectForm] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [projectForm, setProjectForm] = useState(emptyProject);
    const [projectSaving, setProjectSaving] = useState(false);
    const [projectMsg, setProjectMsg] = useState('');
    const [passwordModalUser, setPasswordModalUser] = useState<AdminUser | null>(null);
    const [newPasswordInput, setNewPasswordInput] = useState('');
    const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
    const [showPasswordText, setShowPasswordText] = useState(false);
    const [passwordSaving, setPasswordSaving] = useState(false);

    const handleSetPasswordSubmit = async () => {
        if (!passwordModalUser) return;
        if (!newPasswordInput || newPasswordInput.length < 6) {
            toast.showToast('Password must be at least 6 characters long.', 'error');
            return;
        }
        if (newPasswordInput !== confirmPasswordInput) {
            toast.showToast('Passwords do not match.', 'error');
            return;
        }

        setPasswordSaving(true);
        try {
            const r = await fetch(`${API_BASE_URL}/api/admin-users/set-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                body: JSON.stringify({
                    email: passwordModalUser.email,
                    id: passwordModalUser.id,
                    newPassword: newPasswordInput
                })
            });
            const d = await r.json();
            if (d.message === 'success') {
                toast.showToast(`✅ Password successfully created for ${passwordModalUser.email}`, 'success');
                setPasswordModalUser(null);
                setNewPasswordInput('');
                setConfirmPasswordInput('');
            } else {
                toast.showToast('Error: ' + d.error, 'error');
            }
        } catch (e) {
            console.error(e);
            toast.showToast('Server error', 'error');
        } finally {
            setPasswordSaving(false);
        }
    };

    const navigate = useNavigate();


    useEffect(() => {
        const initDashboard = async () => {
            const storedUser = localStorage.getItem('admin_user');
            if (!storedUser) {
                setLoading(false);
                return;
            }

            let activeUser: AdminUser;
            try {
                activeUser = JSON.parse(storedUser);
            } catch {
                localStorage.removeItem('admin_user');
                setLoading(false);
                return;
            }
            try {
                const r = await fetch(`${API_BASE_URL}/api/me`, {
                    headers: getAuthHeaders()
                });
                const d = await r.json();
                if (d.data) {
                    const token = d.data.session_token || activeUser.session_token || '';
                    const updatedUser = { ...d.data, session_token: token };
                    activeUser = updatedUser;
                    setUser(updatedUser);
                    localStorage.setItem('admin_user', JSON.stringify(updatedUser));
                    if (token) {
                        localStorage.setItem('admin_session', token);
                    }
                } else {
                    setUser(activeUser);
                }
            } catch (e) {
                console.error(e);
                setUser(activeUser);
            }

            if ((activeUser.role || '').toUpperCase() === 'MAIN_ADMIN') {
                fetchPendingUsers(activeUser);
                fetchAdminUsers(activeUser);
                fetchManagerAccessRequests(activeUser);
            }
            fetchMessages();
            fetchBlogs(activeUser);
            fetchProjects(activeUser);
            fetchManagers(activeUser);
            if ((activeUser.role || '').toUpperCase() === 'MAIN_ADMIN') {
                fetchManagerPermissions(activeUser);
            }
        };

        initDashboard();
    }, []);

    const fetchPendingUsers = async (currentUser?: AdminUser) => {
        const authUser = currentUser || user;
        if (!authUser) return;
        try {
            const r = await fetch(`${API_BASE_URL}/api/pending-registrations`, {
                headers: {
                        ...getAuthHeaders()
                }
            });
            const d = await r.json();
            if (d.data) setPendingUsers(d.data);
        } catch (e) { console.error(e); }
    };

    const fetchManagerAccessRequests = async (currentUser?: AdminUser) => {
        const authUser = currentUser || user;
        if (!authUser) return;
        try {
            const r = await fetch(`${API_BASE_URL}/api/manager-access-requests/pending`, {
                headers: {
                        ...getAuthHeaders()
                }
            });
            const d = await r.json();
            if (d.data) setManagerAccessRequests(d.data);
        } catch (e) { console.error(e); }
    };

    const accessRequestLabel = (req: ManagerAccessRequest) => {
        if (req.request_type === 'blog') return 'Blog Manager';
        if (req.request_type === 'experiment') return 'Experiment Manager';
        return req.manager_name || 'Custom Manager';
    };

    const approveManagerAccess = async (id: number) => {
        if (!user) return;
        setManagerAccessRequests(prev => prev.filter(r => r.id !== id));
        try {
            const r = await fetch(`${API_BASE_URL}/api/manager-access-requests/${id}/approve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                }
            });
            const d = await r.json();
            if (d.message === 'success') {
                fetchManagerAccessRequests();
                fetchAdminUsers();
                fetchManagerPermissions(user);
                toast.showToast('✅ Access request approved', 'success');
            } else {
                fetchManagerAccessRequests();
                toast.showToast('Error: ' + d.error, 'error');
            }
        } catch (e) {
            fetchManagerAccessRequests();
            console.error(e);
        }
    };

    const rejectManagerAccess = async (id: number) => {
        if (!user) return;
        const reason = prompt('Optional reason for rejection:');
        if (reason === null) return;
        setManagerAccessRequests(prev => prev.filter(r => r.id !== id));
        try {
            const r = await fetch(`${API_BASE_URL}/api/manager-access-requests/${id}/reject`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                body: JSON.stringify({ reason })
            });
            const d = await r.json();
            if (d.message === 'success') {
                fetchManagerAccessRequests();
                toast.showToast('Request rejected', 'success');
            } else {
                fetchManagerAccessRequests();
                toast.showToast('Error: ' + d.error, 'error');
            }
        } catch (e) {
            fetchManagerAccessRequests();
            console.error(e);
        }
    };

    const fetchAdminUsers = async (currentUser?: AdminUser) => {
        const authUser = currentUser || user;
        if (!authUser) return;
        try {
            const r = await fetch(`${API_BASE_URL}/api/admin-users`, {
                headers: {
                    ...getAuthHeaders()
                }
            });
            const d = await r.json();
            if (d.data) setAdminUsers(d.data);
        } catch (e) { console.error(e); }
    };

    const fetchManagers = async (currentUser?: AdminUser) => {
        const authUser = currentUser || user;
        if (!authUser) return;
        try {
            const r = await fetch(`${API_BASE_URL}/api/managers`, {
                headers: {
                    ...getAuthHeaders()
                }
            });
            const d = await r.json();
            if (d.data) setManagers(d.data);
        } catch (e) { console.error(e); }
    };

    const fetchManagerPermissions = async (currentUser?: AdminUser) => {
        const authUser = currentUser || user;
        if (!authUser || (authUser.role || '').toUpperCase() !== 'MAIN_ADMIN') return;
        try {
            const r = await fetch(`${API_BASE_URL}/api/managers/permissions/all`, {
                headers: getAuthHeaders()
            });
            const d = await r.json();
            const edits: Record<number, Record<number, boolean>> = {};
            const granted: Record<number, Record<number, string>> = {};
            (d.data || []).forEach((p: { admin_user_id: number; manager_id: number; granted_by?: string }) => {
                if (!edits[p.admin_user_id]) edits[p.admin_user_id] = {};
                if (!granted[p.admin_user_id]) granted[p.admin_user_id] = {};
                edits[p.admin_user_id][p.manager_id] = true;
                if (p.granted_by) granted[p.admin_user_id][p.manager_id] = p.granted_by;
            });
            setManagerPermEdits(edits);
            setManagerPermGrantedBy(granted);
            setManagerPermDirty({});
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        const map: Record<number, { can_manage_blogs: boolean; can_manage_experiments: boolean; dirty: boolean; }> = {};
        adminUsers.forEach(a => {
            map[a.id] = {
                can_manage_blogs: isTruthy(a.can_manage_blogs) || isTruthy(a.blog_manager),
                can_manage_experiments: isTruthy(a.can_manage_experiments) || isTruthy(a.experiment_manager),
                dirty: false
            };
        });
        setAdminEdits(map);
    }, [adminUsers]);

    const approveUser = async (id: number, role: string = 'member') => {
        if (!user) return;
        setPendingUsers(prev => prev.filter(p => p.id !== id));
        try {
            const r = await fetch(`${API_BASE_URL}/api/approve-registration`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                body: JSON.stringify({ id, role })
            });
            const d = await r.json();
            if (d.message === 'success') {
                fetchPendingUsers();
                fetchAdminUsers();
                toast.showToast('✅ Approved user', 'success');
            } else {
                fetchPendingUsers();
                toast.showToast('Error: ' + d.error, 'error');
            }
        } catch (e) {
            fetchPendingUsers();
            console.error(e);
        }
    };

    const rejectUser = async (id: number) => {
        if (!user) return;
        if (!confirm('Reject this registration request?')) return;
        try {
            const r = await fetch(`${API_BASE_URL}/api/reject-registration`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                body: JSON.stringify({ id })
            });
            const d = await r.json();
            if (d.message === 'success') fetchPendingUsers();
            else toast.showToast('Error: ' + d.error, 'error');
        } catch (e) { console.error(e); }
    };

    const updateAdminRole = async (id: number, role: string) => {
        if (!user) return;
        try {
            const r = await fetch(`${API_BASE_URL}/api/admin-users/${id}/role`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                body: JSON.stringify({ role })
            });
            const d = await r.json();
            if (d.message === 'success') {
                fetchAdminUsers();
                toast.showToast('✅ Role updated', 'success');
            } else {
                toast.showToast('Error updating role: ' + d.error, 'error');
            }
        } catch (e) { console.error(e); }
    };

    const deleteAdminUser = async (adminUser: AdminUser) => {
        if (!user) return;
        if (!confirm(`Are you sure you want to delete co-founder "${adminUser.name || adminUser.email}"? This will revoke all their access.`)) return;
        try {
            const r = await fetch(`${API_BASE_URL}/api/admin-users/${adminUser.id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            const d = await r.json();
            if (d.message === 'success') {
                toast.showToast(`✅ Deleted co-founder ${adminUser.name || adminUser.email}`, 'success');
                fetchAdminUsers();
            } else {
                toast.showToast('Error deleting co-founder: ' + d.error, 'error');
            }
        } catch (e) {
            console.error('Delete admin user failed:', e);
            toast.showToast('Server error deleting co-founder', 'error');
        }
    };

    const updateAdminPermissions = async (id: number, canManageBlogs: boolean, canManageExperiments: boolean) => {
        if (!user) return false;
        setPermissionSavingId(id);
        try {
            const r = await fetch(`${API_BASE_URL}/api/admin-users/${id}/permissions`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                body: JSON.stringify({ can_manage_blogs: canManageBlogs, can_manage_experiments: canManageExperiments })
            });
            const d = await r.json();
            if (d.message === 'success') {
                await fetchAdminUsers();
                return true;
            } else {
                toast.showToast('Error updating permissions: ' + d.error, 'error');
                return false;
            }
        } catch (e) {
            console.error(e);
            return false;
        } finally {
            setPermissionSavingId(null);
        }
    };

    const handlePermissionChange = (admin: AdminUser, permission: 'can_manage_blogs' | 'can_manage_experiments', value: boolean) => {
        setAdminEdits(prev => ({
            ...prev,
            [admin.id]: {
                can_manage_blogs: permission === 'can_manage_blogs' ? value : (prev[admin.id]?.can_manage_blogs ?? (isTruthy(admin.can_manage_blogs) || isTruthy(admin.blog_manager))),
                can_manage_experiments: permission === 'can_manage_experiments' ? value : (prev[admin.id]?.can_manage_experiments ?? (isTruthy(admin.can_manage_experiments) || isTruthy(admin.experiment_manager))),
                dirty: true
            }
        }));
    };

    const handleManagerPermissionChange = (adminId: number, managerId: number, value: boolean) => {
        setManagerPermEdits(prev => ({
            ...prev,
            [adminId]: { ...(prev[adminId] || {}), [managerId]: value }
        }));
        setManagerPermDirty(prev => ({ ...prev, [adminId]: true }));
        setAdminEdits(prev => ({ ...prev, [adminId]: { ...(prev[adminId] || { can_manage_blogs: false, can_manage_experiments: false, dirty: false }), dirty: true } }));
    };

    const saveAdminPermissions = async (admin: AdminUser) => {
        const edits = adminEdits[admin.id];
        if (!edits) return;
        let ok = true;
        if (edits.dirty) {
            ok = await updateAdminPermissions(admin.id, edits.can_manage_blogs, edits.can_manage_experiments);
        }
        if (ok && managerPermDirty[admin.id] && managers.length > 0) {
            setPermissionSavingId(admin.id);
            try {
                const perms: Record<number, boolean> = {};
                managers.forEach(m => {
                    perms[m.id] = !!(managerPermEdits[admin.id]?.[m.id]);
                });
                const r = await fetch(`${API_BASE_URL}/api/admin-users/${admin.id}/manager-permissions`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        ...getAuthHeaders()
                    },
                    body: JSON.stringify({ permissions: perms })
                });
                const d = await r.json();
                if (d.message !== 'success') {
                    toast.showToast('Error updating manager permissions: ' + d.error, 'error');
                    ok = false;
                } else {
                    await fetchManagerPermissions();
                }
            } catch (e) {
                console.error(e);
                ok = false;
            } finally {
                setPermissionSavingId(null);
            }
        }
        if (ok) {
            setAdminEdits(prev => ({ ...prev, [admin.id]: { ...prev[admin.id], dirty: false } }));
            setManagerPermDirty(prev => ({ ...prev, [admin.id]: false }));
            setAdminMsgs(prev => ({ ...prev, [admin.id]: '✅ Permissions updated' }));
            toast.showToast(`✅ Permissions saved for ${admin.name || admin.email}`, 'success');
            setTimeout(() => setAdminMsgs(prev => { const c = { ...prev }; delete c[admin.id]; return c; }), 2200);
        }
    };

    const fetchMessages = async () => {
        setRefreshing(true);
        try {
            const r = await fetch(`${API_BASE_URL}/api/messages`, {
                headers: getAuthHeaders()
            });
            const d = await r.json();
            if (d.data) setMessages(d.data);
        } catch (e) { console.error(e); }
        setLoading(false);
        setRefreshing(false);
    };

    const fetchBlogs = async (currentUser?: AdminUser) => {
        try {
            const storedUser = currentUser || user || JSON.parse(localStorage.getItem('admin_user') || 'null');
            if (!storedUser) return;
            const headers: Record<string, string> = {
                ...getAuthHeaders()
            };

            const r = await fetch(`${API_BASE_URL}/api/blogs`, { headers });
            const d = await r.json();
            if (d.data) setBlogs(d.data);
        } catch (e) { console.error(e); }
    };

    const openNewBlog = () => { setBlogForm(emptyBlog); setEditingBlog(null); setShowBlogForm(true); setBlogMsg(''); };
    const openEditBlog = (b: Blog) => { setBlogForm({ title: b.title, description: b.description, content: b.content, image: b.image, category: b.category, author: b.author }); setEditingBlog(b); setShowBlogForm(true); setBlogMsg(''); };

    const saveBlog = async () => {
        if (!blogForm.title || !blogForm.description) { setBlogMsg('Title and description are required.'); return; }
        const storedUser = user || JSON.parse(localStorage.getItem('admin_user') || 'null');
        if (!storedUser) { setBlogMsg('❌ User not authenticated.'); return; }
        setBlogSaving(true);
        try {
            const url = editingBlog ? `${API_BASE_URL}/api/blogs/${editingBlog.id}` : `${API_BASE_URL}/api/blogs`;
            const method = editingBlog ? 'PUT' : 'POST';
            const r = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                body: JSON.stringify(blogForm)
            });
            const d = await r.json();
            if (d.message === 'success') {
                setBlogMsg(editingBlog ? '✅ Blog updated!' : '✅ Blog published!');
                fetchBlogs();
                setTimeout(() => setShowBlogForm(false), 1200);
                toast.showToast('✅ Blog saved', 'success');
            } else {
                if (r.status === 403 && d.error && d.error.includes('Unauthorized access')) {
                    localStorage.removeItem('admin_session');
                    localStorage.removeItem('admin_user');
                    toast.showToast('Session expired. Please log in again.', 'error');
                    setTimeout(() => navigate('/admin-login'), 1500);
                    return;
                }
                setBlogMsg('❌ Error: ' + d.error);
                toast.showToast('❌ Error: ' + d.error, 'error');
            }
        } catch (e) { setBlogMsg('❌ Server error'); }
        setBlogSaving(false);
    };

    const deleteBlog = async (id: number) => {
        const storedUser = user || JSON.parse(localStorage.getItem('admin_user') || 'null');
        if (!storedUser) return;
        if (!confirm('Delete this blog post?')) return;
        try {
            await fetch(`${API_BASE_URL}/api/blogs/${id}`, {
                method: 'DELETE',
                headers: {
                    ...getAuthHeaders()
                }
            });
            fetchBlogs();
        } catch (e) { console.error(e); }
    };

    const fetchProjects = async (currentUser?: AdminUser) => {
        try {
            const storedUser = currentUser || user || JSON.parse(localStorage.getItem('admin_user') || 'null');
            if (!storedUser) return;
            const headers: Record<string, string> = {
                ...getAuthHeaders()
            };

            const r = await fetch(`${API_BASE_URL}/api/projects`, { headers });
            const d = await r.json();
            if (d.message === 'unauthorized') {
                console.warn('Unauthorized project list access');
                return;
            }
            if (d.data) setProjects(d.data);
        } catch (e) { console.error(e); }
    };

    const openNewProject = () => { setProjectForm(emptyProject); setEditingProject(null); setShowProjectForm(true); setProjectMsg(''); };
    const openEditProject = (p: Project) => { setProjectForm({ name: p.name, technicalName: p.technicalName, description: p.description, image: p.image, status: p.status, completion: p.completion }); setEditingProject(p); setShowProjectForm(true); setProjectMsg(''); };

    const saveProject = async () => {
        if (!projectForm.name || !projectForm.description) { setProjectMsg('Name and description are required.'); return; }
        if (!user) { setProjectMsg('❌ User not authenticated.'); return; }
        setProjectSaving(true);
        try {
            const url = `${API_BASE_URL}/api/projects`;
            const body = JSON.stringify({ ...projectForm, email: user.email, id: editingProject?.id ?? null });
            const r = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                body
            });

            const d = await r.json();
            if (d.message === 'success') {
                setProjectMsg(editingProject ? '✅ Project updated!' : '✅ Project created!');
                fetchProjects();
                setTimeout(() => setShowProjectForm(false), 1200);
            } else setProjectMsg('❌ Error: ' + d.error);
        } catch (e) {
            console.error('Save project failed:', e);
            setProjectMsg('❌ Server error');
        }
        setProjectSaving(false);
    };

    const deleteProject = async (id: number) => {
        if (!user) return;
        if (!confirm('Delete this project?')) return;
        try {
            await fetch(`${API_BASE_URL}/api/projects/${id}`, {
                method: 'DELETE',
                headers: {
                    ...getAuthHeaders()
                }
            });
            fetchProjects();
        } catch (e) {
            console.error('Delete project failed:', e);
        }
    };

    const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            const result = String(reader.result || '');
            setProfileForm(f => ({ ...f, image: result }));
        };
        reader.readAsDataURL(file);
    };

    const removeProfileImage = () => {
        setProfileForm(f => ({ ...f, image: '' }));
    };

    const updateProfile = async () => {
        if (!user) return;
        setProfileSaving(true);
        try {
            const r = await fetch(`${API_BASE_URL}/api/update-profile`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({ email: user.email, name: profileForm.name, image: profileForm.image })
            });
            
            if (!r.ok) {
                const errorData = await r.json().catch(() => ({ error: 'Connection failed' }));
                throw new Error(errorData.error || `Server returned ${r.status}`);
            }

            const d = await r.json();
            if (d.message === 'success') {
                const newUser = { ...user, name: profileForm.name, image: profileForm.image };
                setUser(newUser);
                localStorage.setItem('admin_user', JSON.stringify(newUser));
                setShowProfileEdit(false);
                toast.showToast('✅ Profile updated!', 'success');
            } else toast.showToast('❌ Error: ' + d.error, 'error');
        } catch (e: any) { 
            console.error('Profile update failed:', e);
            toast.showToast(`❌ Error: ${e.message || 'Unknown error'}`, 'error'); 
        }
        setProfileSaving(false);
    };

    const handleLogout = () => { localStorage.removeItem('admin_session'); localStorage.removeItem('admin_user'); navigate('/admin-login'); };

    const isMainAdmin = (user?.role || '').toUpperCase() === 'MAIN_ADMIN';
    const canManageBlogs = (isMainAdmin || isTruthy(user?.can_manage_blogs) || isTruthy(user?.blog_manager)) && (focusSection === 'all' || focusSection === 'blogs');
    const canManageProjects = (isMainAdmin || isTruthy(user?.can_manage_experiments) || isTruthy(user?.experiment_manager)) && (focusSection === 'all' || focusSection === 'experiments');
    const isWebsiteManager = canManageBlogs;
    const isProjectHead = canManageProjects;
    const currentMember = teamMembers.find(m => m.email?.toLowerCase() === user?.email?.toLowerCase());
    const hasOwnProfileImage = !!user?.image && user.image.trim() !== '';
    const displayProfileImage = hasOwnProfileImage ? user.image : (currentMember?.image || '');

    if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
    if (!user) return <Navigate to="/admin-login" replace />;

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {user && <AdminManagerNav user={user} />}

                {/* Welcome Banner */}
                {user && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border border-primary/30 rounded-xl p-6 md:p-8">
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-primary/50 shrink-0 flex items-center justify-center bg-card">
                                {displayProfileImage ? (
                                    <img src={displayProfileImage} alt={user.name} className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-12 h-12 text-primary/40" />
                                )}
                            </div>
                            <div className="text-center md:text-left flex-1">
                                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                                    <h2 className="text-2xl md:text-3xl font-bold text-primary">Welcome, {user.name}!</h2>
                                    {isMainAdmin && <Award className="w-6 h-6 text-yellow-500" />}
                                    {isWebsiteManager && <Shield className="w-6 h-6 text-blue-400" />}
                                </div>
                                <div className="flex items-center justify-center md:justify-start gap-3 mb-3 text-muted-foreground">
                                    <div className="flex items-center gap-2"><Mail className="w-4 h-4" /><span>{user.email}</span></div>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => { setProfileForm({ name: user.name, image: user.image || '' }); setShowProfileEdit(true); }}
                                        className="h-7 px-2 text-[10px] uppercase tracking-wider border-primary/30 bg-primary/5 hover:bg-primary/20 text-primary transition-all"
                                    >
                                        <Pencil className="w-3 h-3 mr-1" /> Edit Profile
                                    </Button>
                                </div>
                                <div className="bg-card/50 rounded-lg p-4 inline-block">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Briefcase className="w-4 h-4 text-primary" />
                                        <span className="font-semibold text-primary">{currentMember?.role || user.role.replace('_', ' ').toUpperCase()}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Target className="w-4 h-4 text-green-500" />
                                        <span className="text-sm text-muted-foreground">{currentMember?.responsibility || 'Administrative Access'}</span>
                                    </div>
                                </div>
                            </div>
                            {currentMember?.linkedin && (
                                <a href={currentMember.linkedin} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 px-4 py-2 rounded-lg transition-colors">
                                    <Linkedin className="w-5 h-5 text-primary" /><span className="text-sm font-medium">View LinkedIn</span>
                                </a>
                            )}
                        </div>
                        <div className="mt-6 pt-4 border-t border-primary/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <p className="text-muted-foreground max-w-2xl">{currentMember?.bio || 'You have authorized access to the V2V Tech administrative systems. Use the tools below to manage content and requests.'}</p>
                            <a href="https://v2v-orbit.vercel.app/" target="_blank" rel="noopener noreferrer"
                                className="group flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-purple-500/25 transition-all hover:scale-105 shrink-0">
                                <Rocket className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
                                Launch V2V Orbit
                                <ExternalLink className="w-4 h-4 ml-1 opacity-70" />
                            </a>
                        </div>
                    </motion.div>
                )}

                {/* Profile Edit Modal */}
                {showProfileEdit && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm text-foreground">
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                            className="bg-slate-900 border border-white/10 p-6 rounded-2xl w-full max-w-md shadow-2xl">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold flex items-center gap-2 text-primary">
                                    <User className="w-5 h-5" /> Edit Profile
                                </h3>
                                <button onClick={() => setShowProfileEdit(false)}><X className="w-5 h-5 text-muted-foreground hover:text-white" /></button>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="flex justify-center">
                                    <div className="relative">
                                        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary/50 bg-slate-800 flex items-center justify-center">
                                            {profileForm.image ? (
                                                <img src={profileForm.image} alt="Profile preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="w-10 h-10 text-primary/40" />
                                            )}
                                        </div>
                                        <label className="absolute -bottom-2 -right-2 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-2 border-slate-900 bg-green-500 text-white shadow-lg hover:bg-green-400">
                                            <Camera className="w-4 h-4" />
                                            <input type="file" accept="image/*" className="hidden" onChange={handleProfileImageChange} />
                                        </label>
                                    </div>
                                </div>
                                <div className="flex gap-2 justify-center">
                                    <Button type="button" variant="outline" size="sm" onClick={removeProfileImage}>Remove image</Button>
                                    <label className="inline-flex">
                                        <span className="inline-flex items-center justify-center rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/20 cursor-pointer">
                                            Upload new picture
                                        </span>
                                        <input type="file" accept="image/*" className="hidden" onChange={handleProfileImageChange} />
                                    </label>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Full Name</label>
                                    <input value={profileForm.name} onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))}
                                        className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary" />
                                </div>
                                <div className="pt-2 flex gap-3">
                                    <Button variant="outline" className="flex-1" onClick={() => setShowProfileEdit(false)}>Cancel</Button>
                                    <Button className="flex-1 bg-primary hover:bg-primary/90 text-white" onClick={updateProfile} disabled={profileSaving}>
                                        {profileSaving ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Logout */}
                <div className="flex justify-end">
                    <Button variant="outline" onClick={handleLogout}><LogOut className="mr-2 h-4 w-4" />Logout</Button>
                </div>

                {/* Co-Founder: Request Manager Access */}
                {focusSection === 'all' && user && !isMainAdmin && (
                    <ManagerAccessRequestCard user={user} />
                )}

                {isMainAdmin && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                        <Card className="border border-teal-500/20 bg-[#0a0f1a]/90 shadow-lg">
                            <CardHeader className="pb-4">
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                    <div>
                                        <CardTitle className="flex items-center gap-2 text-teal-400 text-lg font-semibold">
                                            <Lock className="w-5 h-5" /> Co-Founder Permissions
                                        </CardTitle>
                                        <CardDescription className="text-slate-400 mt-1.5">
                                            Grant or revoke Blog Manager, Experiment Manager, and Custom Manager access for co-founders.
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <Button
                                            onClick={() => setShowAddAdmin(true)}
                                            variant="outline"
                                            size="sm"
                                            className="border-teal-500/30 text-teal-400 hover:bg-teal-500/10 hover:text-teal-300"
                                        >
                                            <Plus className="w-4 h-4 mr-1.5" /> Add Co-Founder
                                        </Button>
                                        <button
                                            type="button"
                                            onClick={() => fetchAdminUsers()}
                                            className="flex items-center gap-1.5 text-teal-400 hover:text-teal-300 text-sm font-medium transition-colors"
                                        >
                                            <RefreshCw className="w-4 h-4" /> Refresh
                                        </button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {adminUsers.filter(a => (a.role || '').toUpperCase() !== 'MAIN_ADMIN').length === 0 ? (
                                    <div className="text-center py-8 text-slate-500 italic text-sm">
                                        No co-founders available.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {adminUsers
                                            .filter(a => (a.role || '').toUpperCase() !== 'MAIN_ADMIN')
                                            .map(admin => {
                                            const blogVal = adminEdits[admin.id]?.can_manage_blogs ?? (isTruthy(admin.can_manage_blogs) || isTruthy(admin.blog_manager));
                                            const expVal = adminEdits[admin.id]?.can_manage_experiments ?? (isTruthy(admin.can_manage_experiments) || isTruthy(admin.experiment_manager));
                                            const isDirty = adminEdits[admin.id]?.dirty || managerPermDirty[admin.id];
                                            const roleLabel = (admin.role || 'member').toLowerCase().replace('co_founder', 'member').replace(/_/g, ' ');
                                            const isSaving = permissionSavingId === admin.id;

                                             return (
                                                <div
                                                    key={admin.id}
                                                    className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl bg-[#111827]/90 border border-slate-700/50"
                                                >
                                                    <div className="min-w-0 lg:w-72 shrink-0 flex items-center gap-3">
                                                        {admin.image ? (
                                                            <img
                                                                src={admin.image}
                                                                alt={admin.name}
                                                                className="w-10 h-10 rounded-full object-cover border border-purple-500/40 shrink-0"
                                                            />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-full bg-purple-600/20 border border-purple-500/30 text-purple-300 flex items-center justify-center font-bold text-sm shrink-0">
                                                                {(admin.name || admin.email)[0].toUpperCase()}
                                                            </div>
                                                        )}
                                                        <div className="min-w-0 flex-1">
                                                            <p className="font-semibold text-white truncate">{admin.name || admin.email.split('@')[0]}</p>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setPasswordModalUser(admin);
                                                                    setNewPasswordInput('');
                                                                    setConfirmPasswordInput('');
                                                                }}
                                                                className="text-xs text-purple-400 hover:text-purple-300 hover:underline flex items-center gap-1 font-mono cursor-pointer truncate mt-0.5"
                                                                title="Click to set password for this user"
                                                            >
                                                                <KeyRound className="w-3 h-3 shrink-0" />
                                                                <span className="truncate">{admin.email}</span>
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-x-8 gap-y-3 lg:flex-1 lg:justify-center">
                                                        <div className="flex flex-col gap-1">
                                                            <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={blogVal}
                                                                    onChange={e => handlePermissionChange(admin, 'can_manage_blogs', e.target.checked)}
                                                                    disabled={isSaving}
                                                                    className="w-4 h-4 rounded border-slate-500 bg-slate-900 text-teal-500 focus:ring-teal-500/40 focus:ring-offset-0 cursor-pointer accent-teal-500"
                                                                    aria-label={`Blog Manager permission for ${admin.email}`}
                                                                />
                                                                <span className="text-sm text-white">Blog Manager</span>
                                                            </label>
                                                            {blogVal && admin.blog_granted_by && (
                                                                <span className="text-[10px] text-teal-400/80 ml-6">Granted by {admin.blog_granted_by}</span>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col gap-1">
                                                            <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={expVal}
                                                                    onChange={e => handlePermissionChange(admin, 'can_manage_experiments', e.target.checked)}
                                                                    disabled={isSaving}
                                                                    className="w-4 h-4 rounded border-slate-500 bg-slate-900 text-teal-500 focus:ring-teal-500/40 focus:ring-offset-0 cursor-pointer accent-teal-500"
                                                                    aria-label={`Experiment Manager permission for ${admin.email}`}
                                                                />
                                                                <span className="text-sm text-white">Experiment Manager</span>
                                                            </label>
                                                            {expVal && admin.experiment_granted_by && (
                                                                <span className="text-[10px] text-teal-400/80 ml-6">Granted by {admin.experiment_granted_by}</span>
                                                            )}
                                                        </div>
                                                        {managers.map(mgr => {
                                                            const mgrVal = managerPermEdits[admin.id]?.[mgr.id] ?? false;
                                                            const grantedBy = managerPermGrantedBy[admin.id]?.[mgr.id];
                                                            return (
                                                                <div key={mgr.id} className="flex flex-col gap-1">
                                                                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={mgrVal}
                                                                            onChange={e => handleManagerPermissionChange(admin.id, mgr.id, e.target.checked)}
                                                                            disabled={isSaving}
                                                                            className="w-4 h-4 rounded border-slate-500 bg-slate-900 text-teal-500 focus:ring-teal-500/40 focus:ring-offset-0 cursor-pointer accent-teal-500"
                                                                            aria-label={`${mgr.name} permission for ${admin.email}`}
                                                                        />
                                                                        <span className="text-sm text-white">{mgr.name}</span>
                                                                    </label>
                                                                    {mgrVal && grantedBy && (
                                                                        <span className="text-[10px] text-teal-400/80 ml-6">Granted by {grantedBy}</span>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>

                                                    <div className="flex items-center gap-2 lg:justify-end shrink-0">
                                                        {adminMsgs[admin.id] && (
                                                            <span className="text-xs text-teal-400 font-medium">{adminMsgs[admin.id]}</span>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setPasswordModalUser(admin);
                                                                setNewPasswordInput('');
                                                                setConfirmPasswordInput('');
                                                            }}
                                                            className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold text-purple-300 bg-purple-950/60 border border-purple-500/40 hover:bg-purple-900/80 transition-all cursor-pointer"
                                                        >
                                                            <KeyRound className="w-3.5 h-3.5" />
                                                            Set Password
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => saveAdminPermissions(admin)}
                                                            disabled={isSaving || !isDirty}
                                                            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white transition-all ${
                                                                isSaving || !isDirty
                                                                    ? 'bg-teal-700/50 cursor-not-allowed opacity-70'
                                                                    : 'bg-teal-600 hover:bg-teal-500 shadow-md shadow-teal-900/30'
                                                            }`}
                                                        >
                                                            <Check className="w-3.5 h-3.5" />
                                                            {isSaving ? 'Saving...' : 'Save'}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => deleteAdminUser(admin)}
                                                            className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold text-red-300 bg-red-950/60 border border-red-500/40 hover:bg-red-900/80 hover:text-white transition-all cursor-pointer"
                                                            title="Delete this co-founder"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                                    {/* Set Password Modal for Arun / Main Admin */}
                                    {passwordModalUser && (
                                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
                                            <div className="bg-slate-900 border border-slate-700/80 p-6 rounded-2xl w-full max-w-md shadow-2xl space-y-5">
                                                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                                    <div className="flex items-center gap-3">
                                                        {passwordModalUser.image ? (
                                                            <img src={passwordModalUser.image} alt={passwordModalUser.name} className="w-10 h-10 rounded-full object-cover border border-purple-500/50" />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-full bg-purple-600/30 text-purple-300 flex items-center justify-center font-bold text-lg">
                                                                {(passwordModalUser.name || passwordModalUser.email)[0].toUpperCase()}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <h3 className="text-base font-bold text-white">Create / Set Password</h3>
                                                            <p className="text-xs text-purple-400 font-mono">{passwordModalUser.email}</p>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => setPasswordModalUser(null)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
                                                        <X className="w-5 h-5" />
                                                    </button>
                                                </div>

                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Co-Founder Email</label>
                                                        <input
                                                            type="text"
                                                            disabled
                                                            value={passwordModalUser.email}
                                                            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-300 font-mono"
                                                        />
                                                    </div>

                                                    <div>
                                                        <div className="flex items-center justify-between mb-1.5">
                                                            <label className="text-xs font-semibold text-slate-300">New Password *</label>
                                                            <button
                                                                type="button"
                                                                onClick={() => setShowPasswordText(!showPasswordText)}
                                                                className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium"
                                                            >
                                                                {showPasswordText ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                                                {showPasswordText ? 'Hide' : 'Show'}
                                                            </button>
                                                        </div>
                                                        <input
                                                            type={showPasswordText ? 'text' : 'password'}
                                                            placeholder="Min 6 characters..."
                                                            value={newPasswordInput}
                                                            onChange={e => setNewPasswordInput(e.target.value)}
                                                            className="w-full bg-slate-950 border border-slate-700 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Confirm Password *</label>
                                                        <input
                                                            type={showPasswordText ? 'text' : 'password'}
                                                            placeholder="Re-enter password..."
                                                            value={confirmPasswordInput}
                                                            onChange={e => setConfirmPasswordInput(e.target.value)}
                                                            className="w-full bg-slate-950 border border-slate-700 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
                                                    <Button variant="outline" onClick={() => setPasswordModalUser(null)} className="border-slate-700 text-slate-300 hover:bg-slate-800">
                                                        Cancel
                                                    </Button>
                                                    <Button
                                                        onClick={handleSetPasswordSubmit}
                                                        disabled={passwordSaving}
                                                        className="bg-purple-600 hover:bg-purple-500 text-white font-semibold"
                                                    >
                                                        <KeyRound className="w-4 h-4 mr-2" />
                                                        {passwordSaving ? 'Setting Password...' : 'Set Password'}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Add Co-Founder Modal */}
                                    {showAddAdmin && (

                                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
                                            <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl w-full max-w-md">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h3 className="text-lg font-bold">Add Co-Founder</h3>
                                                    <button onClick={() => setShowAddAdmin(false)} className="text-muted-foreground">Close</button>
                                                </div>
                                                <div className="space-y-3">
                                                    <div>
                                                        <label className="text-xs text-muted-foreground">Full Name</label>
                                                        <input value={newAdminForm.name} onChange={e => setNewAdminForm(f => ({ ...f, name: e.target.value }))} className="w-full bg-background border border-border rounded-lg px-3 py-2" />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-muted-foreground">Email</label>
                                                        <input value={newAdminForm.email} onChange={e => setNewAdminForm(f => ({ ...f, email: e.target.value }))} className="w-full bg-background border border-border rounded-lg px-3 py-2" />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-muted-foreground">Password (optional, default: CoFounder@123456)</label>
                                                        <input
                                                            type="password"
                                                            placeholder="Leave empty for default (CoFounder@123456)"
                                                            value={newAdminForm.password}
                                                            onChange={e => setNewAdminForm(f => ({ ...f, password: e.target.value }))}
                                                            className="w-full bg-background border border-border rounded-lg px-3 py-2"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-muted-foreground">Role</label>
                                                        <select value={newAdminForm.role} onChange={e => setNewAdminForm(f => ({ ...f, role: e.target.value }))} className="w-full bg-background border border-border rounded-lg px-3 py-2">
                                                            <option value="member">Member</option>
                                                            <option value="project_head">Experiment Manager</option>
                                                            <option value="website_manager">Blog Manager</option>
                                                            <option value="main_admin">Main Admin</option>
                                                        </select>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <label className="flex items-center gap-2"><input type="checkbox" checked={newAdminForm.can_manage_blogs} onChange={e => setNewAdminForm(f => ({ ...f, can_manage_blogs: e.target.checked }))} /> Blogs</label>
                                                        <label className="flex items-center gap-2"><input type="checkbox" checked={newAdminForm.can_manage_experiments} onChange={e => setNewAdminForm(f => ({ ...f, can_manage_experiments: e.target.checked }))} /> Experiments</label>
                                                    </div>
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="outline" onClick={() => setShowAddAdmin(false)}>Cancel</Button>
                                                        <Button onClick={async () => {
                                                            if (!user) return;
                                                            try {
                                                                const r = await fetch(`${API_BASE_URL}/api/admin-users`, {
                                                                    method: 'POST',
                                                                    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                                                                    body: JSON.stringify(newAdminForm)
                                                                });
                                                                const d = await r.json();
                                                                if (d.message === 'success') {
                                                                    toast.showToast('✅ Co-founder added', 'success');
                                                                    setShowAddAdmin(false);
                                                                    setNewAdminForm({ name: '', email: '', password: '', role: 'member', can_manage_blogs: false, can_manage_experiments: false });
                                                                    fetchAdminUsers();
                                                                } else {
                                                                    toast.showToast('Error: ' + d.error, 'error');
                                                                }
                                                            } catch (e) { console.error(e); toast.showToast('Server error', 'error'); }
                                                        }} className="bg-primary text-white">Add</Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* Custom Managers — header first, then each manager below Co-Founder Permissions */}
                {isMainAdmin && focusSection === 'all' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
                        <Card className="border border-indigo-500/30 bg-indigo-950/10">
                            <CardHeader>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div>
                                        <CardTitle className="flex items-center gap-2 text-indigo-400">
                                            <Layers className="w-5 h-5" /> Custom Managers
                                        </CardTitle>
                                        <CardDescription>
                                            Create independent manager modules (Financial Manager, Marketing Manager, HR Manager, etc.).
                                            Each manager has its own page, items, and permissions.
                                        </CardDescription>
                                    </div>
                                    <Button onClick={() => navigate('/admin/create-manager')} className="bg-indigo-600 hover:bg-indigo-500 text-white shrink-0">
                                        <Plus className="w-4 h-4 mr-2" /> Add New Manager
                                    </Button>
                                </div>
                            </CardHeader>
                            {managers.length === 0 && (
                                <CardContent>
                                    <p className="text-center py-6 text-muted-foreground italic text-sm">No managers created yet. Use Add New Manager to start.</p>
                                </CardContent>
                            )}
                        </Card>
                    </motion.div>
                )}

                {focusSection === 'all' && user && managers.map(manager => (
                    <CustomManagerSection
                        key={manager.id}
                        manager={manager}
                        user={user}
                        onDeleted={() => {
                            fetchManagers(user);
                            if ((user.role || '').toUpperCase() === 'MAIN_ADMIN') fetchManagerPermissions(user);
                        }}
                    />
                ))}

                {/* Blog Management */}
                {canManageBlogs && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <Card className="border border-blue-500/30 bg-blue-950/10">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2 text-blue-400">
                                            <Globe className="w-5 h-5" />
                                            Blog Manager
                                            {isWebsiteManager && <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30 font-normal">Website Manager</span>}
                                        </CardTitle>
                                        <CardDescription>Create, edit and delete posts for the "Stay Updated" section</CardDescription>
                                    </div>
                                    <Button onClick={openNewBlog} className="bg-blue-600 hover:bg-blue-500 text-white">
                                        <Plus className="w-4 h-4 mr-2" />New Post
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {/* Blog Form */}
                                {showBlogForm && (
                                    <div className="mb-6 p-5 rounded-xl border border-blue-500/30 bg-card/80 space-y-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-bold text-lg text-primary">{editingBlog ? 'Edit Post' : 'New Blog Post'}</h3>
                                            <button onClick={() => setShowBlogForm(false)} className="text-muted-foreground hover:text-white"><X className="w-5 h-5" /></button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="md:col-span-2">
                                                <label className="text-xs text-muted-foreground mb-1 block">Title *</label>
                                                <input value={blogForm.title} onChange={e => setBlogForm(f => ({ ...f, title: e.target.value }))}
                                                    placeholder="Post title..." className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="text-xs text-muted-foreground mb-1 block">Short Description *</label>
                                                <input value={blogForm.description} onChange={e => setBlogForm(f => ({ ...f, description: e.target.value }))}
                                                    placeholder="Brief summary shown on the blogs page..." className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary" />
                                            </div>
                                            <div>
                                                <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                                                <input value={blogForm.category} onChange={e => setBlogForm(f => ({ ...f, category: e.target.value }))}
                                                    placeholder="e.g. V2V Insights, Tech News..." className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary" />
                                            </div>
                                            <div>
                                                <label className="text-xs text-muted-foreground mb-1 block">Author</label>
                                                <input value={blogForm.author} onChange={e => setBlogForm(f => ({ ...f, author: e.target.value }))}
                                                    placeholder="Author name..." className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="text-xs text-muted-foreground mb-1 block">Image Upload</label>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (!file) return;
                                                        const reader = new FileReader();
                                                        reader.onload = () => setBlogForm(f => ({ ...f, image: String(reader.result ?? '') }));
                                                        reader.readAsDataURL(file);
                                                    }}
                                                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary file:mr-3 file:rounded file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white file:cursor-pointer"
                                                />
                                                {blogForm.image && <img src={blogForm.image} alt="Blog preview" className="mt-3 max-h-48 max-w-md rounded-lg border border-border object-contain bg-slate-950/40 p-1" />}
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="text-xs text-muted-foreground mb-1 block">Full Content (HTML supported)</label>
                                                <textarea value={blogForm.content} onChange={e => setBlogForm(f => ({ ...f, content: e.target.value }))}
                                                    placeholder="<p>Write your full article here...</p>" rows={8}
                                                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary font-mono resize-y" />
                                            </div>
                                        </div>

                                        {blogMsg && <p className={`text-sm font-medium ${blogMsg.startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}>{blogMsg}</p>}

                                        <div className="flex gap-3 justify-end pt-2">
                                            <Button variant="outline" onClick={() => setShowBlogForm(false)}>Cancel</Button>
                                            <Button onClick={saveBlog} disabled={blogSaving} className="bg-blue-600 hover:bg-blue-500 text-white">
                                                {blogSaving ? 'Saving...' : (editingBlog ? 'Update Post' : 'Publish Post')}
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Blog List */}
                                {blogs.length === 0 ? (
                                    <div className="text-center py-10 text-muted-foreground">
                                        <p className="mb-2 text-4xl">📝</p>
                                        <p>No blog posts yet. Click "New Post" to publish your first article!</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {blogs.map(b => (
                                            <div key={b.id} className="flex items-start gap-4 p-4 rounded-xl border border-border/50 bg-card/50 hover:border-blue-500/40 transition-all group">
                                                {b.image && <img src={b.image} alt={b.title} className="w-16 h-16 rounded-lg object-cover shrink-0 hidden sm:block" />}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">{b.category}</span>
                                                        <span className="text-xs text-muted-foreground">{new Date(b.published_at).toLocaleDateString()}</span>
                                                        <span className="text-xs text-muted-foreground">by {b.author}</span>
                                                    </div>
                                                    <p className="font-semibold text-sm truncate">{b.title}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{b.description}</p>
                                                </div>
                                                <div className="flex gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => openEditBlog(b)} className="p-2 rounded-lg hover:bg-blue-500/20 text-blue-400 transition-colors"><Pencil className="w-4 h-4" /></button>
                                                    <button onClick={() => deleteBlog(b.id)} className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* Experiment/Project Management (Project Head & Main Admin) */}
                {canManageProjects && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                        <Card className="border border-purple-500/30 bg-purple-950/10">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2 text-purple-400">
                                            <FlaskConical className="w-5 h-5" />
                                            Experiments Manager
                                            {isProjectHead && <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30 font-normal">Project Head</span>}
                                        </CardTitle>
                                        <CardDescription>Manage ongoing research and development projects (Experiments section)</CardDescription>
                                    </div>
                                    <Button onClick={openNewProject} className="bg-purple-600 hover:bg-purple-500 text-white">
                                        <Plus className="w-4 h-4 mr-2" />Add Project
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {/* Project Form */}
                                {showProjectForm && (
                                    <div className="mb-6 p-5 rounded-xl border border-purple-500/30 bg-card/80 space-y-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-bold text-lg text-primary">{editingProject ? 'Edit Project' : 'New Project'}</h3>
                                            <button onClick={() => setShowProjectForm(false)} className="text-muted-foreground hover:text-white"><X className="w-5 h-5" /></button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs text-muted-foreground mb-1 block">Project Name *</label>
                                                <input value={projectForm.name} onChange={e => setProjectForm(f => ({ ...f, name: e.target.value }))}
                                                    placeholder="Public name..." className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary" />
                                            </div>
                                            <div>
                                                <label className="text-xs text-muted-foreground mb-1 block">Technical Name/Version</label>
                                                <input value={projectForm.technicalName} onChange={e => setProjectForm(f => ({ ...f, technicalName: e.target.value }))}
                                                    placeholder="e.g. EdgeCompute v1.0..." className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="text-xs text-muted-foreground mb-1 block">Description *</label>
                                                <textarea value={projectForm.description} onChange={e => setProjectForm(f => ({ ...f, description: e.target.value }))}
                                                    placeholder="Detailed project overview..." rows={3}
                                                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary resize-y" />
                                            </div>
                                            <div>
                                                <label className="text-xs text-muted-foreground mb-1 block">Status</label>
                                                <select value={projectForm.status} onChange={e => setProjectForm(f => ({ ...f, status: e.target.value }))}
                                                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary">
                                                    <option value="In Progress">In Progress</option>
                                                    <option value="Testing">Testing</option>
                                                    <option value="Completed">Completed</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-xs text-muted-foreground mb-1 block">Completion % (0-100)</label>
                                                <input type="number" value={projectForm.completion} onChange={e => setProjectForm(f => ({ ...f, completion: parseInt(e.target.value) || 0 }))}
                                                    min="0" max="100" className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="text-xs text-muted-foreground mb-1 block">Cover Image Upload</label>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (!file) return;
                                                        const reader = new FileReader();
                                                        reader.onload = () => setProjectForm(f => ({ ...f, image: String(reader.result ?? '') }));
                                                        reader.readAsDataURL(file);
                                                    }}
                                                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary file:mr-3 file:rounded file:border-0 file:bg-purple-600 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white file:cursor-pointer"
                                                />
                                                {projectForm.image && <img src={projectForm.image} alt="Project preview" className="mt-3 max-h-48 max-w-md rounded-lg border border-border object-contain bg-slate-950/40 p-1" />}
                                            </div>
                                        </div>

                                        {projectMsg && <p className={`text-sm font-medium ${projectMsg.startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}>{projectMsg}</p>}

                                        <div className="flex gap-3 justify-end pt-2">
                                            <Button variant="outline" onClick={() => setShowProjectForm(false)}>Cancel</Button>
                                            <Button onClick={saveProject} disabled={projectSaving} className="bg-purple-600 hover:bg-purple-500 text-white">
                                                {projectSaving ? 'Saving...' : (editingProject ? 'Update Project' : 'Add Project')}
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Projects List */}
                                {projects.length === 0 ? (
                                    <div className="text-center py-10 text-muted-foreground">
                                        <p className="mb-2 text-4xl">🧪</p>
                                        <p>No projects listed yet. Start by adding a new experiment.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {projects.map(p => (
                                            <div key={p.id} className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-card/50 hover:border-purple-500/40 transition-all group">
                                                <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                                                    <Cpu className="w-6 h-6 text-purple-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${p.status === 'Completed' ? 'bg-green-500/20 text-green-400' : p.status === 'Testing' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                                            {p.status}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground">{p.completion}% Done</span>
                                                    </div>
                                                    <p className="font-semibold text-sm truncate">{p.name}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{p.technicalName}</p>
                                                    {p.created_by && (
                                                        <p className="text-[10px] text-purple-400/80 mt-1 truncate">Created by {p.created_by}</p>
                                                    )}
                                                </div>
                                                <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => openEditProject(p)} className="p-2 rounded-lg hover:bg-purple-500/20 text-purple-400 transition-colors"><Pencil className="w-4 h-4" /></button>
                                                    <button onClick={() => deleteProject(p.id)} className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* Request Access Card for Co-Founders */}
                {!isMainAdmin && user && (
                    <ManagerAccessRequestCard user={user} />
                )}

                {/* Pending Access Requests (Main Admin Only) */}
                {isMainAdmin && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <Card className="border-orange-500/30 bg-orange-950/10">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2 text-orange-400">
                                            <Shield className="w-5 h-5" />
                                            Pending Access Requests
                                            <span className="text-xs bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded-full border border-orange-500/30 font-normal">
                                                {pendingUsers.length + managerAccessRequests.length}
                                            </span>
                                        </CardTitle>
                                        <CardDescription>
                                            Review co-founder manager access requests and new admin registration requests.
                                        </CardDescription>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => { fetchPendingUsers(); fetchManagerAccessRequests(); }} className="text-orange-400 hover:text-orange-300 hover:bg-orange-500/10">
                                        <RefreshCw className="w-4 h-4 mr-2" />Refresh
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div>
                                    <h4 className="text-sm font-semibold text-orange-300 mb-3">Manager Access Requests</h4>
                                    {managerAccessRequests.length === 0 ? (
                                        <p className="text-center py-4 text-muted-foreground/60 italic text-sm border border-orange-500/10 rounded-lg">
                                            No pending manager access requests.
                                        </p>
                                    ) : (
                                        <div className="space-y-3">
                                            {managerAccessRequests.map(req => (
                                                <div key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-orange-500/20 bg-card/50">
                                                    <div>
                                                        <p className="font-semibold">{req.requester_name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {req.requester_email} • Requesting <strong className="text-orange-300">{accessRequestLabel(req)}</strong>
                                                        </p>
                                                        <p className="text-xs text-muted-foreground mt-0.5">
                                                            {new Date(req.requested_at).toLocaleDateString()}
                                                            {req.message ? ` • "${req.message}"` : ''}
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-2 shrink-0">
                                                        <Button size="sm" variant="outline" onClick={() => rejectManagerAccess(req.id)} className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300 h-8">
                                                            <X className="w-4 h-4 mr-1" />Reject
                                                        </Button>
                                                        <Button size="sm" onClick={() => approveManagerAccess(req.id)} className="bg-orange-600 hover:bg-orange-500 text-white h-8">
                                                            <Check className="w-4 h-4 mr-1" />Approve
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h4 className="text-sm font-semibold text-orange-300 mb-3">New Admin Registrations</h4>
                                    {pendingUsers.length === 0 ? (
                                        <p className="text-center py-4 text-muted-foreground/60 italic text-sm border border-orange-500/10 rounded-lg">
                                            No pending registration requests.
                                        </p>
                                    ) : (
                                        <div className="space-y-3">
                                            {pendingUsers.map(p => (
                                                <div key={p.id} className="flex items-center justify-between p-4 rounded-xl border border-orange-500/20 bg-card/50">
                                                    <div>
                                                        <p className="font-semibold">{p.name}</p>
                                                        <p className="text-xs text-muted-foreground">{p.email} • Requested {new Date(p.requested_at).toLocaleDateString()}</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button size="sm" variant="outline" onClick={() => rejectUser(p.id)} className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300 h-8">
                                                            <X className="w-4 h-4 mr-1" />Reject
                                                        </Button>
                                                        <div className="flex items-center gap-1">
                                                            <select 
                                                                className="bg-background border border-orange-500/30 rounded px-2 py-1 text-xs focus:outline-none"
                                                                id={`role-${p.id}`}
                                                                defaultValue="member"
                                                            >
                                                                <option value="member">Member</option>
                                                                <option value="project_head">Experiment Manager</option>
                                                                <option value="website_manager">Blog Manager</option>
                                                                <option value="main_admin">Main Admin</option>
                                                            </select>
                                                            <Button size="sm" onClick={() => {
                                                                const role = (document.getElementById(`role-${p.id}`) as HTMLSelectElement).value;
                                                                approveUser(p.id, role);
                                                            }} className="bg-orange-600 hover:bg-orange-500 text-white h-8">
                                                                Approve
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {pendingUsers.length === 0 && managerAccessRequests.length === 0 && (
                                    <div className="text-center py-2 text-muted-foreground/60 italic text-sm">
                                        No pending access requests at the moment.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
                {/* Homepage Content Management (Our Capabilities & Sections) */}
                {(focusSection === 'all' || focusSection === 'capabilities' || focusSection === 'our-team') && (
                    <HomepageContentManager user={user} defaultOpenSection={focusSection === 'our-team' ? 'our_team' : null} />
                )}

                {/* FAQ Management */}
                {(focusSection === 'all' || focusSection === 'faqs') && (
                    <FAQManager user={user} />
                )}

                {/* Footer Services Management */}
                {(focusSection === 'all' || focusSection === 'services') && (
                    <ServicesManager user={user} />
                )}

                {/* Contact Messages */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <MessageSquare className="w-5 h-5" />
                                        Contact Messages
                                        {messages.length > 0 && <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">{messages.length}</span>}
                                    </CardTitle>
                                    <CardDescription>Messages received from the website contact form.</CardDescription>
                                </div>
                                <Button variant="ghost" size="sm" onClick={fetchMessages} disabled={refreshing}>
                                    <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />Refresh
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {messages.length === 0 ? (
                                <div className="text-center py-12"><User className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" /><p className="text-muted-foreground">No messages yet.</p></div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Time</TableHead>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Message</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {messages.map((msg) => (
                                                <TableRow key={msg.id}>
                                                    <TableCell className="whitespace-nowrap">{new Date(msg.created_at).toLocaleDateString()}</TableCell>
                                                    <TableCell className="whitespace-nowrap">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</TableCell>
                                                    <TableCell className="font-medium">{msg.name}</TableCell>
                                                    <TableCell className="text-muted-foreground">{msg.email}</TableCell>
                                                    <TableCell className="max-w-xs truncate" title={msg.message}>{msg.message}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

            </div>
        </div>
    );
};

export default AdminDashboard;
