import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, RefreshCw, Send, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { API_BASE_URL, getAuthHeaders } from '@/lib/apiConfig';

interface AdminUser {
    id: number;
    name: string;
    email: string;
    role: string;
}

interface AvailableRequest {
    request_type: 'blog' | 'experiment' | 'custom';
    manager_id?: number;
    label: string;
}

interface AccessRequest {
    id: number;
    request_type: 'blog' | 'experiment' | 'custom';
    manager_id?: number | null;
    manager_name?: string;
    message?: string;
    status: 'pending' | 'approved' | 'rejected';
    requested_at: string;
    reviewed_by?: string;
    rejection_reason?: string;
}

const requestLabel = (req: AccessRequest) => {
    if (req.request_type === 'blog') return 'Blog Manager';
    if (req.request_type === 'experiment') return 'Experiment Manager';
    return req.manager_name || 'Custom Manager';
};

export default function ManagerAccessRequestCard({ user }: { user: AdminUser }) {
    const toast = useToast();
    const [available, setAvailable] = useState<AvailableRequest[]>([]);
    const [myRequests, setMyRequests] = useState<AccessRequest[]>([]);
    const [selected, setSelected] = useState('');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);

    const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [availR, mineR] = await Promise.all([
                fetch(`${API_BASE_URL}/api/manager-access-requests/available`, { headers }),
                fetch(`${API_BASE_URL}/api/manager-access-requests/mine`, { headers }),
            ]);
            const availD = await availR.json();
            const mineD = await mineR.json();
            if (availD.data) setAvailable(availD.data);
            if (mineD.data) setMyRequests(mineD.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [user.email, user.role]);

    useEffect(() => {
        load();
    }, [load]);

    const submitRequest = async () => {
        if (!selected) {
            toast.showToast('Please select a manager to request', 'error');
            return;
        }
        const item = available.find(a => {
            const key = a.request_type === 'custom' ? `custom:${a.manager_id}` : a.request_type;
            return key === selected;
        });
        if (!item) return;

        setSubmitting(true);
        try {
            const r = await fetch(`${API_BASE_URL}/api/manager-access-requests`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    request_type: item.request_type,
                    manager_id: item.manager_id,
                    message: message.trim(),
                }),
            });
            const d = await r.json();
            if (!r.ok) throw new Error(d.error || 'Request failed');
            toast.showToast(`✅ Request sent for ${item.label}`, 'success');
            setSelected('');
            setMessage('');
            await load();
        } catch (e) {
            toast.showToast(`❌ ${e instanceof Error ? e.message : 'Request failed'}`, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const pendingCount = myRequests.filter(r => r.status === 'pending').length;

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-orange-500/30 bg-orange-950/10">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-orange-400">
                                <Shield className="w-5 h-5" />
                                Request Manager Access
                                {pendingCount > 0 && (
                                    <span className="text-xs bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded-full border border-orange-500/30 font-normal">
                                        {pendingCount} pending
                                    </span>
                                )}
                            </CardTitle>
                            <CardDescription>
                                Request access to Blog Manager, Experiment Manager, or custom managers. Main Admin will review and approve.
                            </CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" onClick={load} className="text-orange-400 hover:text-orange-300 hover:bg-orange-500/10">
                            <RefreshCw className="w-4 h-4 mr-2" />Refresh
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-5">
                    {loading ? (
                        <p className="text-center py-4 text-muted-foreground text-sm">Loading...</p>
                    ) : (
                        <>
                            {available.length === 0 ? (
                                <p className="text-center py-4 text-muted-foreground/60 italic text-sm">
                                    You already have access to all available managers, or your requests are pending review.
                                </p>
                            ) : (
                                <div className="p-4 rounded-xl border border-orange-500/20 bg-card/50 space-y-4">
                                    <div>
                                        <label className="text-xs text-muted-foreground mb-1 block">Select manager access *</label>
                                        <select
                                            value={selected}
                                            onChange={e => setSelected(e.target.value)}
                                            className="w-full bg-background border border-orange-500/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                                        >
                                            <option value="">Choose a manager...</option>
                                            {available.map(item => {
                                                const key = item.request_type === 'custom' ? `custom:${item.manager_id}` : item.request_type;
                                                return (
                                                    <option key={key} value={key}>{item.label}</option>
                                                );
                                            })}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground mb-1 block">Message (optional)</label>
                                        <textarea
                                            value={message}
                                            onChange={e => setMessage(e.target.value)}
                                            placeholder="Why do you need this access?"
                                            rows={2}
                                            className="w-full bg-background border border-orange-500/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400 resize-none"
                                        />
                                    </div>
                                    <Button
                                        onClick={submitRequest}
                                        disabled={submitting || !selected}
                                        className="bg-orange-600 hover:bg-orange-500 text-white"
                                    >
                                        <Send className="w-4 h-4 mr-2" />
                                        {submitting ? 'Sending...' : 'Submit Request'}
                                    </Button>
                                </div>
                            )}

                            {myRequests.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-semibold text-orange-300/90">Your requests</h4>
                                    {myRequests.slice(0, 5).map(req => (
                                        <div key={req.id} className="flex items-center justify-between p-3 rounded-lg border border-orange-500/15 bg-card/30 text-sm">
                                            <div>
                                                <p className="font-medium">{requestLabel(req)}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(req.requested_at).toLocaleDateString()}
                                                    {req.message ? ` • ${req.message}` : ''}
                                                </p>
                                                {req.status === 'rejected' && req.rejection_reason && (
                                                    <p className="text-xs text-red-400 mt-1">Reason: {req.rejection_reason}</p>
                                                )}
                                            </div>
                                            <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${
                                                req.status === 'pending'
                                                    ? 'border-orange-500/30 text-orange-300 bg-orange-500/10'
                                                    : req.status === 'approved'
                                                        ? 'border-green-500/30 text-green-300 bg-green-500/10'
                                                        : 'border-red-500/30 text-red-300 bg-red-500/10'
                                            }`}>
                                                {req.status === 'pending' && <Clock className="w-3 h-3" />}
                                                {req.status === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                                                {req.status === 'rejected' && <XCircle className="w-3 h-3" />}
                                                {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}
