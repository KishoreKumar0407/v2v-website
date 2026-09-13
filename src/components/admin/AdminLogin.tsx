import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { API_BASE_URL, parseApiResponse } from "@/lib/apiConfig";
import { motion } from 'framer-motion';
import { ShieldCheck, UserPlus, KeyRound, ArrowLeft } from 'lucide-react';

const AdminLogin = () => {
    // Auth State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Mode State: 'login', 'register', 'forgot-request', 'forgot-verify'
    const [mode, setMode] = useState<'login' | 'register' | 'forgot-request' | 'forgot-verify'>('login');

    // Forgot Password State
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const navigate = useNavigate();

    const resetState = () => {
        setError(null);
        setSuccess(null);
        setPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setOtp('');
    };

    const handleLoginRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        const isProdBrowser = typeof window !== 'undefined' && !window.location.origin.includes('localhost') && !window.location.origin.includes('127.0.0.1');
        const targetBaseUrl = isProdBrowser ? '' : (API_BASE_URL || 'http://localhost:3001');
        const endpoint = mode === 'register' ? `${targetBaseUrl}/api/register` : `${targetBaseUrl}/api/login`;

        try {
            let response: Response | null = null;
            let lastError: Error | null = null;

            for (let attempt = 1; attempt <= 3; attempt++) {
                try {
                    response = await fetch(endpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name, email, password }),
                    });
                    if (response) break;
                } catch (e) {
                    lastError = e instanceof Error ? e : new Error(String(e));
                    if (attempt < 3) {
                        setError(`Server is waking up... retrying attempt ${attempt}/3`);
                        await new Promise((r) => setTimeout(r, 3000));
                    }
                }
            }

            if (!response) {
                throw new Error(lastError?.message || 'Server connection failed.');
            }

            const result = await parseApiResponse<{ error?: string; data?: unknown }>(response);

            if (!response.ok) throw new Error(result.error || 'Authentication failed');

            if (mode === 'register') {
                setMode('login');
                setSuccess("Account created! Please login.");
            } else {
                localStorage.setItem('admin_user', JSON.stringify(result.data));
                const resData = result.data as { session_token?: string } | undefined;
                if (resData?.session_token) {
                    localStorage.setItem('admin_session', resData.session_token);
                }
                navigate('/admin-dashboard');
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
                setError(`Server is starting up on Render or unreachable. Please wait 15 seconds and try again. (Target: ${endpoint})`);
            } else {
                setError(`${msg} (Target: ${endpoint})`);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPasswordRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/api/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const result = await parseApiResponse<{ error?: string }>(response);
            if (!response.ok) throw new Error(result.error);

            setSuccess("OTP sent! Check server console.");
            setMode('forgot-verify');
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/api/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp, newPassword }),
            });
            const result = await parseApiResponse<{ error?: string }>(response);
            if (!response.ok) throw new Error(result.error);

            setSuccess("Password updated! Please login.");
            setMode('login');
            setPassword('');
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#020817] relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />

            <div className="absolute top-8 left-8 z-10">
                <Button variant="ghost" onClick={() => navigate('/')} className="text-muted-foreground hover:text-white group">
                    <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    Back to Home
                </Button>
            </div>

            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-[420px] p-4 relative z-10"
            >
                <Card className="border-white/10 bg-slate-900/50 backdrop-blur-xl shadow-2xl">
                    <CardHeader className="text-center pb-2">
                        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
                            {mode === 'login' && <ShieldCheck className="w-8 h-8 text-primary" />}
                            {mode === 'register' && <UserPlus className="w-8 h-8 text-primary" />}
                            {(mode === 'forgot-request' || mode === 'forgot-verify') && <KeyRound className="w-8 h-8 text-primary" />}
                        </div>
                        <CardTitle className="text-2xl font-bold tracking-tight">
                            {mode === 'login' && "Admin Portal"}
                            {mode === 'register' && "Apply for Access"}
                            {mode === 'forgot-request' && "Reset Access"}
                            {mode === 'forgot-verify' && "New Password"}
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">
                            {mode === 'login' && "Secure access to V2V Tech management"}
                            {mode === 'register' && "Submit your details for admin approval"}
                            {mode === 'forgot-request' && "We'll send an OTP to your authorized email"}
                            {mode === 'forgot-verify' && "Create a secure new password"}
                        </CardDescription>
                    </CardHeader>
                <CardContent>
                    {/* LOGIN / REGISTER FORM */}
                    {(mode === 'login' || mode === 'register') && (
                        <form onSubmit={handleLoginRegister} className="space-y-4">
                            {mode === 'register' && (
                                <Input
                                    id="register-name"
                                    name="name"
                                    autoComplete="name"
                                    type="text" placeholder="Full Name" value={name}
                                    onChange={(e) => setName(e.target.value)} required
                                />
                            )}
                            <Input
                                id="login-email"
                                name="email"
                                autoComplete="email"
                                type="email" placeholder="Email" value={email}
                                onChange={(e) => setEmail(e.target.value)} required
                            />
                            <Input
                                id="login-password"
                                name="password"
                                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                                type="password" placeholder="Password" value={password}
                                onChange={(e) => setPassword(e.target.value)} required
                            />

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? "Processing..." : (mode === 'register' ? "Create Account" : "Login")}
                            </Button>

                            <div className="space-y-2 text-center text-sm">
                                <button type="button"
                                    onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); resetState(); }}
                                    className="text-primary hover:underline block w-full">
                                    {mode === 'login' ? "Create an Account" : "Back to Login"}
                                </button>
                                {mode === 'login' && (
                                    <button type="button"
                                        onClick={() => { setMode('forgot-request'); resetState(); }}
                                        className="text-muted-foreground hover:text-primary underline block w-full">
                                        Forgot Password?
                                    </button>
                                )}
                            </div>
                        </form>
                    )}

                    {/* FORGOT PASSWORD REQUEST */}
                    {mode === 'forgot-request' && (
                        <form onSubmit={handleForgotPasswordRequest} className="space-y-4">
                            <Input
                                id="forgot-email"
                                name="email"
                                autoComplete="email"
                                type="email" placeholder="Enter valid admin email" value={email}
                                onChange={(e) => setEmail(e.target.value)} required
                            />
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? "Sending OTP..." : "Send OTP"}
                            </Button>
                            <button type="button" onClick={() => setMode('login')} className="text-sm text-center w-full block hover:underline">
                                Cancel
                            </button>
                        </form>
                    )}

                    {/* FORGOT PASSWORD VERIFY */}
                    {mode === 'forgot-verify' && (
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <Input
                                id="otp-input"
                                name="otp"
                                autoComplete="one-time-code"
                                type="text" placeholder="Enter OTP" value={otp}
                                onChange={(e) => setOtp(e.target.value)} required
                            />
                            <Input
                                id="new-password"
                                name="newPassword"
                                autoComplete="new-password"
                                type="password" placeholder="New Password" value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)} required
                            />
                            <Input
                                id="confirm-password"
                                name="confirmPassword"
                                autoComplete="new-password"
                                type="password" placeholder="Confirm Password" value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)} required
                            />
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? "Updating..." : "Update Password"}
                            </Button>
                            <button type="button" onClick={() => setMode('login')} className="text-sm text-center w-full block hover:underline">
                                Cancel
                            </button>
                        </form>
                    )}

                        {/* MESSAGES */}
                        {error && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400 text-center">
                                {error}
                            </motion.div>
                        )}
                        {success && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm text-green-400 text-center">
                                {success}
                            </motion.div>
                        )}
                    </CardContent>
                </Card>
                <p className="text-center mt-8 text-xs text-muted-foreground">
                    &copy; {new Date().getFullYear()} V2V Tech. Authorized Access Only.
                </p>
            </motion.div>
        </div>
    );
};

export default AdminLogin;
