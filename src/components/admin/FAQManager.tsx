import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HelpCircle, Plus, Pencil, Trash2, X, AlertCircle } from 'lucide-react';
import { API_BASE_URL, getAuthHeaders } from "@/lib/apiConfig";
import { useToast } from "@/components/ui/toast";

interface FAQ {
  id: number;
  question: string;
  answer: string;
  display_order: number;
  created_at?: string;
}

interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface FAQManagerProps {
  user: AdminUser | null;
}

const emptyFAQ = {
  question: '',
  answer: '',
  display_order: 0
};

export default function FAQManager({ user }: FAQManagerProps) {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [faqForm, setFaqForm] = useState(emptyFAQ);
  const [errorMsg, setErrorMsg] = useState('');
  const toast = useToast();

  const getHeaders = (): Record<string, string> => {
    if (!user) return {};
    return {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    };
  };

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/faqs`);
      const data = await res.json();
      if (data.data) {
        setFaqs(data.data);
      }
    } catch (error) {
      console.error("Error fetching FAQs:", error);
      toast.showToast("Failed to fetch FAQs", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const openNewFaq = () => {
    // Find highest display_order and default to +1
    const maxOrder = faqs.length > 0 ? Math.max(...faqs.map(f => f.display_order)) : 0;
    setFaqForm({
      question: '',
      answer: '',
      display_order: maxOrder + 1
    });
    setEditingFaq(null);
    setShowForm(true);
    setErrorMsg('');
  };

  const openEditFaq = (faq: FAQ) => {
    setFaqForm({
      question: faq.question,
      answer: faq.answer,
      display_order: faq.display_order
    });
    setEditingFaq(faq);
    setShowForm(true);
    setErrorMsg('');
  };

  const saveFaq = async () => {
    if (!faqForm.question.trim() || !faqForm.answer.trim()) {
      setErrorMsg('Both question and answer are required.');
      return;
    }

    try {
      setSaving(true);
      setErrorMsg('');
      
      const url = editingFaq 
        ? `${API_BASE_URL}/api/faqs/${editingFaq.id}` 
        : `${API_BASE_URL}/api/faqs`;
      
      const method = editingFaq ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(faqForm)
      });

      const data = await res.json();

      if (res.ok && data.message === 'success') {
        toast.showToast(editingFaq ? '✅ FAQ updated!' : '✅ FAQ added!', 'success');
        fetchFaqs();
        setShowForm(false);
        setFaqForm(emptyFAQ);
      } else {
        setErrorMsg(data.error || 'Failed to save FAQ.');
        toast.showToast(data.error || 'Failed to save FAQ', 'error');
      }
    } catch (error) {
      console.error("Error saving FAQ:", error);
      setErrorMsg('Server connection error.');
      toast.showToast('Server connection error', 'error');
    } finally {
      setSaving(false);
    }
  };

  const deleteFaq = async (id: number) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/faqs/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });

      const data = await res.json();

      if (res.ok && data.message === 'success') {
        toast.showToast('✅ FAQ deleted successfully!', 'success');
        fetchFaqs();
      } else {
        toast.showToast(data.error || 'Failed to delete FAQ', 'error');
      }
    } catch (error) {
      console.error("Error deleting FAQ:", error);
      toast.showToast('Failed to delete FAQ', 'error');
    }
  };

  if (!user) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay: 0.12 }}
    >
      <Card className="border border-emerald-500/30 bg-emerald-950/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-emerald-400">
                <HelpCircle className="w-5 h-5" />
                FAQ Manager
              </CardTitle>
              <CardDescription>
                Add, update, or remove frequently asked questions shown on the homepage
              </CardDescription>
            </div>
            <Button onClick={openNewFaq} className="bg-emerald-600 hover:bg-emerald-500 text-white border-none">
              <Plus className="w-4 h-4 mr-2" />New FAQ
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* FAQ Add/Edit Form */}
          {showForm && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 p-5 rounded-xl border border-emerald-500/30 bg-card/90 space-y-4 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg text-emerald-400">
                  {editingFaq ? 'Edit FAQ' : 'New FAQ'}
                </h3>
                <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Question *</label>
                  <input 
                    value={faqForm.question} 
                    onChange={e => setFaqForm(f => ({ ...f, question: e.target.value }))}
                    placeholder="Enter the question..." 
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-emerald-500" 
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Answer *</label>
                  <textarea 
                    value={faqForm.answer} 
                    onChange={e => setFaqForm(f => ({ ...f, answer: e.target.value }))}
                    placeholder="Enter the answer..." 
                    rows={4}
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-emerald-500 resize-y" 
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Display Order (Lower values appear first)</label>
                  <input 
                    type="number"
                    value={faqForm.display_order} 
                    onChange={e => setFaqForm(f => ({ ...f, display_order: parseInt(e.target.value, 10) || 0 }))}
                    placeholder="0" 
                    className="w-32 bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-emerald-500" 
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 text-red-400 text-sm font-medium">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-2">
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button 
                  onClick={saveFaq} 
                  disabled={saving} 
                  className="bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  {saving ? 'Saving...' : (editingFaq ? 'Update FAQ' : 'Save FAQ')}
                </Button>
              </div>
            </motion.div>
          )}

          {/* FAQ List */}
          {loading ? (
            <div className="text-center py-6 text-muted-foreground">Loading FAQs...</div>
          ) : faqs.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <p className="mb-2 text-4xl">❓</p>
              <p>No FAQs available. Click "New FAQ" to add one!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {faqs.map(faq => (
                <div 
                  key={faq.id} 
                  className="flex items-start gap-4 p-4 rounded-xl border border-border/50 bg-card/50 hover:border-emerald-500/40 transition-all group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        Order: {faq.display_order}
                      </span>
                    </div>
                    <p className="font-semibold text-sm text-foreground">{faq.question}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-3 md:line-clamp-none">{faq.answer}</p>
                  </div>
                  <div className="flex gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => openEditFaq(faq)} 
                      className="p-2 rounded-lg hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => deleteFaq(faq.id)} 
                      className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
