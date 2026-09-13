import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import AdminManagerNav from './AdminManagerNav';

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
    children: ReactNode;
    requireMainAdmin?: boolean;
}

/** Wraps admin manager pages with shared navigation sidebar. */
export default function AdminManagerLayout({ children, requireMainAdmin }: Props) {
    const stored = localStorage.getItem('admin_user');
    if (!stored) return <Navigate to="/admin-login" replace />;

    let user: AdminUser;
    try {
        user = JSON.parse(stored);
    } catch {
        localStorage.removeItem('admin_user');
        return <Navigate to="/admin-login" replace />;
    }
    if (requireMainAdmin && (user.role || '').toUpperCase() !== 'MAIN_ADMIN') {
        return <Navigate to="/admin-dashboard" replace />;
    }

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <AdminManagerNav user={user} />
                {children}
            </div>
        </div>
    );
}
