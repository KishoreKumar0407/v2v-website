import { useEffect, useState, ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, Plus, Pencil, Trash2, X, AlertCircle, ExternalLink, Image as ImageIcon, Upload } from 'lucide-react';
import { API_BASE_URL, getAuthHeaders } from "@/lib/apiConfig";
import { useToast } from "@/components/ui/toast";

import { processImageFile } from "@/lib/imageUtils";

interface Service {
  id: number;
  name: string;
  href: string;
  image?: string;
  display_order: number;
  created_at?: string;
}

interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface ServicesManagerProps {
  user: AdminUser | null;
}

const emptyService = {
  name: '',
  href: '',
  image: '',
  display_order: 0
};

export default function ServicesManager({ user }: ServicesManagerProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceForm, setServiceForm] = useState(emptyService);
  const [errorMsg, setErrorMsg] = useState('');
  const toast = useToast();

  const getHeaders = (): Record<string, string> => {
    if (!user) return {};
    return {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    };
  };

  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/footer-services`);
      const data = await res.json();
      if (data.data) {
        setServices(data.data);
      }
    } catch (error) {
      console.error("Error fetching services:", error);
      toast.showToast("Failed to fetch services", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const openNewService = () => {
    // Find highest display_order and default to +1
    const maxOrder = services.length > 0 ? Math.max(...services.map(s => s.display_order)) : 0;
    setServiceForm({
      name: '',
      href: '',
      image: '',
      display_order: maxOrder + 1
    });
    setEditingService(null);
    setShowForm(true);
    setErrorMsg('');
  };

  const openEditService = (service: Service) => {
    setServiceForm({
      name: service.name,
      href: service.href,
      image: service.image || '',
      display_order: service.display_order
    });
    setEditingService(service);
    setShowForm(true);
    setErrorMsg('');
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Image file size must be less than 10MB.');
      return;
    }

    try {
      setErrorMsg('');
      const compressedDataUrl = await processImageFile(file);
      setServiceForm(f => ({ ...f, image: compressedDataUrl }));
    } catch (err) {
      console.error("Failed to process image file:", err);
      setErrorMsg('Could not process image file.');
    } finally {
      e.target.value = '';
    }
  };

  const saveService = async () => {
    let cleanName = (serviceForm.name || '').trim();
    let cleanHref = (serviceForm.href || '').trim();

    if (!cleanName || !cleanHref) {
      setErrorMsg('Both name and href link are required.');
      return;
    }

    if (!cleanHref.startsWith('/') && !cleanHref.startsWith('http://') && !cleanHref.startsWith('https://') && !cleanHref.startsWith('#')) {
      cleanHref = '/' + cleanHref;
    }

    const payload = {
      ...serviceForm,
      name: cleanName,
      href: cleanHref,
      image: (serviceForm.image || '').trim()
    };

    try {
      setSaving(true);
      setErrorMsg('');
      
      const url = editingService 
        ? `${API_BASE_URL}/api/footer-services/${editingService.id}` 
        : `${API_BASE_URL}/api/footer-services`;
      
      const method = editingService ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok && data.message === 'success') {
        toast.showToast(editingService ? '✅ Service updated!' : '✅ Service added!', 'success');
        fetchServices();
        setShowForm(false);
        setServiceForm(emptyService);
      } else {
        setErrorMsg(data.error || 'Failed to save service.');
        toast.showToast(data.error || 'Failed to save service', 'error');
      }
    } catch (error) {
      console.error("Error saving service:", error);
      setErrorMsg('Server connection error.');
      toast.showToast('Server connection error', 'error');
    } finally {
      setSaving(false);
    }
  };

  const deleteService = async (id: number) => {
    if (!confirm('Are you sure you want to delete this service link?')) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/footer-services/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });

      const data = await res.json();

      if (res.ok && data.message === 'success') {
        toast.showToast('✅ Service deleted successfully!', 'success');
        fetchServices();
      } else {
        toast.showToast(data.error || 'Failed to delete service', 'error');
      }
    } catch (error) {
      console.error("Error deleting service:", error);
      toast.showToast('Failed to delete service', 'error');
    }
  };

  if (!user) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay: 0.12 }}
    >
      <Card className="border border-blue-500/30 bg-blue-950/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-blue-400">
                <Briefcase className="w-5 h-5" />
                Footer Services Manager
              </CardTitle>
              <CardDescription>
                Add, update, or remove service links and images displayed in the website footer
              </CardDescription>
            </div>
            <Button onClick={openNewService} className="bg-blue-600 hover:bg-blue-500 text-white border-none">
              <Plus className="w-4 h-4 mr-2" />New Service Link
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Add/Edit Form */}
          {showForm && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 p-5 rounded-xl border border-blue-500/30 bg-card/90 space-y-4 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg text-blue-400">
                  {editingService ? 'Edit Footer Service' : 'New Footer Service'}
                </h3>
                <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Service Name *</label>
                  <input 
                    value={serviceForm.name} 
                    onChange={e => setServiceForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Problem Identification" 
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500" 
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Link Path/URL (href) *</label>
                  <input 
                    value={serviceForm.href} 
                    onChange={e => setServiceForm(f => ({ ...f, href: e.target.value }))}
                    placeholder="e.g. /problem-identification" 
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500" 
                  />
                </div>

                {/* Service Image Upload Option */}
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs text-muted-foreground block font-medium flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                    Service Icon / Image (Optional - Shown on Front Page)
                  </label>
                  
                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    {/* Upload File Button */}
                    <label className="cursor-pointer inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-blue-300 text-xs px-3 py-2 rounded-lg border border-slate-700 transition-colors">
                      <Upload className="w-4 h-4" />
                      <span>Upload Image File</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageUpload} 
                        className="hidden" 
                      />
                    </label>

                    <span className="text-xs text-muted-foreground">or image URL:</span>

                    {/* Image URL Input */}
                    <input 
                      value={serviceForm.image} 
                      onChange={e => setServiceForm(f => ({ ...f, image: e.target.value }))}
                      placeholder="https://example.com/icon.png or /services/icon.png" 
                      className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 w-full sm:w-auto" 
                    />

                    {serviceForm.image && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setServiceForm(f => ({ ...f, image: '' }))}
                        className="text-red-400 hover:text-red-300 text-xs p-1 h-auto"
                      >
                        Remove
                      </Button>
                    )}
                  </div>

                  {/* Image Preview */}
                  {serviceForm.image && (
                    <div className="flex items-center gap-3 pt-1">
                      <span className="text-xs text-muted-foreground">Preview:</span>
                      <div className="w-10 h-10 rounded-lg border border-blue-500/40 bg-slate-900 p-1 flex items-center justify-center overflow-hidden">
                        <img 
                          src={serviceForm.image} 
                          alt="Service Preview" 
                          className="max-w-full max-h-full object-contain" 
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs text-muted-foreground mb-1 block">Display Order (Lower values appear first)</label>
                  <input 
                    type="number"
                    value={serviceForm.display_order} 
                    onChange={e => setServiceForm(f => ({ ...f, display_order: parseInt(e.target.value, 10) || 0 }))}
                    placeholder="0" 
                    className="w-32 bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500" 
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
                  onClick={saveService} 
                  disabled={saving} 
                  className="bg-blue-600 hover:bg-blue-500 text-white"
                >
                  {saving ? 'Saving...' : (editingService ? 'Update Service' : 'Save Service')}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Service Link List */}
          {loading ? (
            <div className="text-center py-6 text-muted-foreground">Loading services...</div>
          ) : services.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <p className="mb-2 text-4xl">💼</p>
              <p>No service links available. Click "New Service Link" to add one!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {services.map(svc => (
                <div 
                  key={svc.id} 
                  className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card/50 hover:border-blue-500/40 transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {svc.image ? (
                      <div className="w-10 h-10 rounded-lg border border-blue-500/30 bg-slate-900/80 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                        <img src={svc.image} alt={svc.name} className="max-w-full max-h-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-lg border border-border bg-slate-900/50 p-2 flex items-center justify-center shrink-0 text-muted-foreground">
                        <Briefcase className="w-5 h-5 text-blue-400/60" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30">
                          Order: {svc.display_order}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono bg-slate-800/80 px-2 py-0.5 rounded">
                          href: {svc.href}
                        </span>
                      </div>
                      <p className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                        {svc.name}
                        <a href={svc.href} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-white transition-colors" title="Visit Link">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => openEditService(svc)} 
                      className="p-2 rounded-lg hover:bg-blue-500/20 text-blue-400 transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => deleteService(svc.id)} 
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
