import { BrowserRouter as Router, Routes, Route, useLocation, Navigate, useParams } from "react-router-dom";
import { useEffect } from "react";
import Home from "./pages/Home";
import AdminLogin from "./components/admin/AdminLogin";
import AdminDashboard from "./components/admin/AdminDashboard";
import ManagerManagementAdmin from "./components/admin/ManagerManagementAdmin";
import ManagerPage from "./components/admin/ManagerPage";
import About from "./pages/About";
import Team from "./pages/Team";
import ProblemIdentification from "./pages/ProblemIdentification";
import RDSolutions from "./pages/RDSolutions";
import TechTransfer from "./pages/TechTransfer";
import IndustryCollaboration from "./pages/IndustryCollaboration";
import Consulting from "./pages/Consulting";
import Blogs from "./pages/Blogs";
import BlogPost from "./pages/BlogPost";
import Experiments from "./pages/Experiments";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import { ToastProvider } from "./components/ui/toast";
import CookieConsent from "./components/ui/CookieConsent";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";
import Chatbot from "./components/Chatbot/Chatbot";

const SCROLL_HASH_OFFSET = 32;

const scrollToHashTarget = (hash: string) => {
  const id = hash.replace(/^#/, "");
  if (!id) return;

  const attemptScroll = (retries = 8) => {
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - SCROLL_HASH_OFFSET;
      window.scrollTo({ top, behavior: "smooth" });
      return;
    }
    if (retries > 0) {
      setTimeout(() => attemptScroll(retries - 1), 100);
    }
  };

  requestAnimationFrame(() => attemptScroll());
};

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      scrollToHashTarget(hash);
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return null;
};

const AccessDeniedPage = ({ title = "403 Forbidden Access", message = "Access Denied: You do not have permission to access this resource." }: { title?: string; message?: string }) => (
  <div className="min-h-screen flex items-center justify-center bg-[#020817] text-foreground px-4">
    <div className="max-w-md w-full text-center rounded-3xl border border-red-500/30 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl">
      <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/30 text-red-400 font-bold text-2xl">
        403
      </div>
      <h1 className="text-2xl font-bold mb-2 text-red-400">{title}</h1>
      <p className="text-muted-foreground text-sm mb-6">{message}</p>
      <a href="/admin-dashboard" className="inline-block bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors border border-white/10">
        Return to Dashboard
      </a>
    </div>
  </div>
);

const ProtectedRoute = ({ requiredPermission, children }: { requiredPermission: 'blog_manager' | 'experiment_manager'; children: React.ReactNode }) => {
  const storedUser = localStorage.getItem('admin_user');
  if (!storedUser) {
    return <Navigate to="/admin-login" replace />;
  }
  let user: { role?: string; can_manage_blogs?: boolean | number; can_manage_experiments?: boolean | number; blog_manager?: boolean | number; experiment_manager?: boolean | number };
  try {
    user = JSON.parse(storedUser);
  } catch {
    localStorage.removeItem('admin_user');
    return <Navigate to="/admin-login" replace />;
  }
  const isMainAdmin = (user.role || '').toUpperCase() === 'MAIN_ADMIN';

  if (requiredPermission === 'blog_manager') {
    const hasBlogPerm = isMainAdmin || user.can_manage_blogs === true || user.can_manage_blogs === 1 || user.blog_manager === true || user.blog_manager === 1;
    if (!hasBlogPerm) {
      return <AccessDeniedPage title="403 Forbidden: Blog Manager" message="Access Denied: You do not have Blog Manager permission." />;
    }
  } else if (requiredPermission === 'experiment_manager') {
    const hasExpPerm = isMainAdmin || user.can_manage_experiments === true || user.can_manage_experiments === 1 || user.experiment_manager === true || user.experiment_manager === 1;
    if (!hasExpPerm) {
      return <AccessDeniedPage title="403 Forbidden: Experiment Manager" message="Access Denied: You do not have Experiment Manager permission." />;
    }
  }

  return <>{children}</>;
};

const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="min-h-screen flex items-center justify-center bg-background text-foreground px-4">
    <div className="max-w-2xl text-center rounded-3xl border border-border/50 bg-card/80 p-10 shadow-2xl backdrop-blur-xl">
      <h1 className="text-4xl font-bold mb-4">{title}</h1>
      <p className="text-muted-foreground">This page is not yet available in the current build.</p>
    </div>
  </div>
);

const ManagerSlugRedirect = () => {
  const { slug } = useParams<{ slug: string }>();
  return <Navigate to={`/managers/${slug}`} replace />;
};

const App = () => {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin-dashboard" element={
          <ToastProvider>
            <AdminDashboard focusSection="all" />
          </ToastProvider>
        } />
        <Route path="/admin/our-team-manager" element={
          <ToastProvider>
            <AdminDashboard focusSection="our-team" />
          </ToastProvider>
        } />
        <Route path="/admin/capabilities-manager" element={
          <ToastProvider>
            <AdminDashboard focusSection="capabilities" />
          </ToastProvider>
        } />
        <Route path="/admin/homepage-manager" element={
          <ToastProvider>
            <AdminDashboard focusSection="capabilities" />
          </ToastProvider>
        } />
        <Route path="/admin/faq-manager" element={
          <ToastProvider>
            <AdminDashboard focusSection="faqs" />
          </ToastProvider>
        } />
        <Route path="/admin/services-manager" element={
          <ToastProvider>
            <AdminDashboard focusSection="services" />
          </ToastProvider>
        } />
        <Route path="/admin/blog-manager" element={
          <ProtectedRoute requiredPermission="blog_manager">
            <ToastProvider>
              <AdminDashboard focusSection="blogs" />
            </ToastProvider>
          </ProtectedRoute>
        } />
        <Route path="/admin/experiment-manager" element={
          <ProtectedRoute requiredPermission="experiment_manager">
            <ToastProvider>
              <AdminDashboard focusSection="experiments" />
            </ToastProvider>
          </ProtectedRoute>
        } />
        <Route path="/admin/create-manager" element={
          <ToastProvider>
            <ManagerManagementAdmin />
          </ToastProvider>
        } />
        <Route path="/admin/managers/:slug" element={<ManagerSlugRedirect />} />
        <Route path="/managers/:slug" element={
          <ToastProvider>
            <ManagerPage />
          </ToastProvider>
        } />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/about" element={<About />} />
        <Route path="/blogs" element={<Blogs />} />
        <Route path="/blogs/:id" element={<BlogPost />} />
        <Route path="/experiments" element={<Experiments />} />
        <Route path="/team" element={<Team />} />
        <Route path="/problem-identification" element={<ProblemIdentification />} />
        <Route path="/rd-solutions" element={<RDSolutions />} />
        <Route path="/technology-transfer" element={<TechTransfer />} />
        <Route path="/industry-collaboration" element={<IndustryCollaboration />} />
        <Route path="/consulting" element={<Consulting />} />
        <Route path="*" element={<Home />} />
      </Routes>
      <Chatbot />
      <CookieConsent />
      <SpeedInsights />
      <Analytics />
    </Router>
  );
};

export default App;
