import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Globe, FlaskConical, Plus, HelpCircle, Briefcase, Home, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { API_BASE_URL, getAuthHeaders } from '@/lib/apiConfig';
import { ManagerDefinition } from './managerTypes';
import { ManagerIcon } from './managerIcons';

interface AdminUser {
    role: string;
    email: string;
    name: string;
    can_manage_blogs?: boolean;
    can_manage_experiments?: boolean;
    blog_manager?: boolean;
    experiment_manager?: boolean;
}

interface Props {
    user: AdminUser;
}

const isTruthy = (v: unknown) => v === true || v === 1 || v === '1';

/**
 * Shared manager navigation — Blog Manager, Experiment Manager, and each
 * dynamically created manager appear as separate peer navigation items.
 */
export default function AdminManagerNav({ user }: Props) {
    const location = useLocation();
    const [managers, setManagers] = useState<ManagerDefinition[]>([]);

    const isMainAdmin = (user.role || '').toUpperCase() === 'MAIN_ADMIN';
    const canBlog = isMainAdmin || isTruthy(user.can_manage_blogs) || isTruthy(user.blog_manager);
    const canExperiment = isMainAdmin || isTruthy(user.can_manage_experiments) || isTruthy(user.experiment_manager);

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/managers`, {
            headers: getAuthHeaders(),
        })
            .then(r => r.json())
            .then(d => { if (d.data) setManagers(d.data); })
            .catch(() => {});
    }, [user.role, user.email]);

    const isActive = (path: string) => {
        if (path === '/admin-dashboard') return location.pathname === '/admin-dashboard';
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    const linkClass = (path: string) =>
        `flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
            isActive(path)
                ? 'bg-primary/20 text-primary border border-primary/30 shadow-sm'
                : 'text-muted-foreground hover:text-white hover:bg-white/5 border border-transparent'
        }`;

    return (
        <nav className="mb-6 p-3 rounded-xl border border-border/40 bg-slate-900/60 backdrop-blur-sm">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold px-2 mb-2">Managers</p>
            <div className="flex flex-wrap gap-2 items-center">
                <Link to="/admin-dashboard" className={linkClass('/admin-dashboard')}>
                    <LayoutDashboard className="w-4 h-4 shrink-0" /> Dashboard
                </Link>

                <Link to="/admin/our-team-manager" className={linkClass('/admin/our-team-manager')}>
                    <Users className="w-4 h-4 shrink-0" /> Our Team & Homepage Manager
                </Link>

                <Link to="/admin/faq-manager" className={linkClass('/admin/faq-manager')}>
                    <HelpCircle className="w-4 h-4 shrink-0" /> FAQ Manager
                </Link>

                <Link to="/admin/services-manager" className={linkClass('/admin/services-manager')}>
                    <Briefcase className="w-4 h-4 shrink-0" /> Service Manager
                </Link>

                {canBlog && (
                    <Link to="/admin/blog-manager" className={linkClass('/admin/blog-manager')}>
                        <Globe className="w-4 h-4 shrink-0" /> Blog Manager
                    </Link>
                )}

                {canExperiment && (
                    <Link to="/admin/experiment-manager" className={linkClass('/admin/experiment-manager')}>
                        <FlaskConical className="w-4 h-4 shrink-0" /> Experiment Manager
                    </Link>
                )}

                {managers.map(m => (
                    <Link key={m.id} to={`/managers/${m.slug}`} className={linkClass(`/managers/${m.slug}`)}>
                        <ManagerIcon name={m.icon} className="w-4 h-4 shrink-0" /> {m.name}
                    </Link>
                ))}

                {isMainAdmin && (
                    <Link to="/admin/create-manager" className={linkClass('/admin/create-manager')}>
                        <Plus className="w-4 h-4 shrink-0" /> Add New Manager
                    </Link>
                )}
            </div>
        </nav>
    );
}
