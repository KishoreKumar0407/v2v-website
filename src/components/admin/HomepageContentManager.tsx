import { useEffect, useState, useRef, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Home, Pencil, Plus, Save, Trash2, Upload, X, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { API_BASE_URL, getAuthHeaders } from '@/lib/apiConfig';
import { useToast } from '@/components/ui/toast';
import { processImageFile } from '@/lib/imageUtils';

import { HOMEPAGE_DEFAULTS } from '@/data/homepageDefaults';

type Hero = { title: string; description: string };
type Capabilities = { eyebrow: string; title: string; description: string; items: { title: string; description: string }[] };
type DetailedServices = { eyebrow: string; title: string; description: string; items: { id: string; title: string; content: string; image: string }[] };
type TrackRecord = { title: string; description: string; stats: { value: number; label: string; suffix: string }[] };
type Testimonials = { eyebrow: string; title: string; description: string; items: { name: string; role: string; content: string; rating: number }[] };
type FooterContact = { address: string; email: string; phone: string };
type OurTeamMember = { name: string; role: string; bio: string; image: string; linkedin: string; email?: string };
type OurTeam = { eyebrow: string; title: string; description: string; items: OurTeamMember[] };
type Content = { hero: Hero; capabilities: Capabilities; detailed_services: DetailedServices; track_record: TrackRecord; footer_contact: FooterContact; testimonials: Testimonials; our_team: OurTeam };

const DEFAULT_OUR_TEAM = HOMEPAGE_DEFAULTS.our_team as unknown as OurTeam;

interface Props { user: { role: string; email: string; name: string } | null; }

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

function ServiceImageUploadInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await processImageFile(file);
      onChange(compressed);
    } catch (err) {
      console.error('Failed to process image:', err);
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-2 pt-1">
      <label className="text-xs text-muted-foreground block font-medium flex items-center gap-1.5">
        <ImageIcon className="w-3.5 h-3.5 text-violet-400" />
        Service Image
      </label>
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="bg-slate-800 hover:bg-slate-700 text-violet-300 border border-slate-700 text-xs flex items-center gap-1.5 h-9 shrink-0"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Image File</span>
        </Button>
        <span className="text-xs text-muted-foreground">or URL:</span>
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
          placeholder="/services/image.png or https://"
        />
        {value && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange('')} className="text-red-400 hover:text-red-300 text-xs p-1 h-auto">
            Remove
          </Button>
        )}
      </div>
      {value && (
        <div className="flex items-center gap-2 pt-1">
          <span className="text-xs text-muted-foreground">Preview:</span>
          <div className="h-12 w-20 rounded border border-border bg-slate-950 p-0.5 flex items-center justify-center overflow-hidden">
            <img src={value} alt="Preview" className="max-h-full max-w-full object-contain" onError={e => { (e.target as HTMLElement).style.display = 'none'; }} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function HomepageContentManager({ user, defaultOpenSection }: Props & { defaultOpenSection?: string | null }) {
  const toast = useToast();
  const [content, setContent] = useState<Content>((HOMEPAGE_DEFAULTS as unknown) as Content);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(defaultOpenSection || null);

  useEffect(() => {
    if (!user) return;
    fetch(`${API_BASE_URL}/api/homepage-content`)
      .then(r => r.json())
      .then(d => { if (d.data) setContent({ ...HOMEPAGE_DEFAULTS, ...d.data }); })
      .catch(() => toast.showToast('Failed to load homepage content', 'error'))
      .finally(() => setLoading(false));
  }, [user]);

  const save = async (key: keyof Content) => {
    if (!user) return;
    setSaving(key);
    try {
      const r = await fetch(`${API_BASE_URL}/api/homepage-content/${key}`, {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content[key] }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Save failed');
      toast.showToast(`${key.replace(/_/g, ' ')} updated successfully`, 'success');
      setOpen(null);
    } catch (e) {
      toast.showToast(e instanceof Error ? e.message : 'Save failed', 'error');
    } finally { setSaving(null); }
  };

  if (!user) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
      <Card className="border border-violet-500/30 bg-violet-950/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-violet-400"><Home className="w-5 h-5" /> Homepage Content Manager</CardTitle>
          <CardDescription>Update the editable homepage sections. Changes are available to the public website after saving.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? <div className="text-center py-6 text-muted-foreground">Loading homepage content...</div> : <>
            <SectionCard title="Hero" open={open === 'hero'} onOpen={() => setOpen(open === 'hero' ? null : 'hero')} onSave={() => save('hero')} saving={saving === 'hero'}>
              <Field label="Headline"><input value={content.hero.title} onChange={e => setContent(c => ({ ...c, hero: { ...c.hero, title: e.target.value } }))} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" /></Field>
              <Field label="Description"><textarea value={content.hero.description} onChange={e => setContent(c => ({ ...c, hero: { ...c.hero, description: e.target.value } }))} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm min-h-28" /></Field>
            </SectionCard>

            <SectionCard title="Our Capabilities" open={open === 'capabilities'} onOpen={() => setOpen(open === 'capabilities' ? null : 'capabilities')} onSave={() => save('capabilities')} saving={saving === 'capabilities'}>
              <TextFields value={content.capabilities} onChange={v => setContent(c => ({ ...c, capabilities: v }))} />
              <div className="space-y-3">
                {content.capabilities.items.map((item, i) => <div key={i} className="rounded-xl border border-border/50 p-4 space-y-2"><div className="flex justify-between"><b>Capability {i + 1}</b><button onClick={() => setContent(c => ({ ...c, capabilities: { ...c.capabilities, items: c.capabilities.items.filter((_, x) => x !== i) } }))} className="text-red-400"><Trash2 className="w-4 h-4" /></button></div><input value={item.title} onChange={e => setContent(c => updateCapability(c, i, { title: e.target.value }))} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" placeholder="Title" /><textarea value={item.description} onChange={e => setContent(c => updateCapability(c, i, { description: e.target.value }))} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm min-h-20" placeholder="Description" /></div>)}
                <Button variant="outline" onClick={() => setContent(c => ({ ...c, capabilities: { ...c.capabilities, items: [...c.capabilities.items, { title: '', description: '' }] } }))}><Plus className="w-4 h-4 mr-2" />Add Capability</Button>
              </div>
            </SectionCard>

            <SectionCard title="Our Detailed Services" open={open === 'detailed_services'} onOpen={() => setOpen(open === 'detailed_services' ? null : 'detailed_services')} onSave={() => save('detailed_services')} saving={saving === 'detailed_services'}>
              <TextFields value={content.detailed_services} onChange={v => setContent(c => ({ ...c, detailed_services: v }))} />
              <div className="space-y-3">
                {content.detailed_services.items.map((item, i) => (
                  <div key={i} className="rounded-xl border border-border/50 p-4 space-y-3 bg-card/30">
                    <div className="flex justify-between items-center">
                      <b className="text-violet-300">Service {i + 1} (Order {i + 1})</b>
                      <button onClick={() => setContent(c => ({ ...c, detailed_services: { ...c.detailed_services, items: c.detailed_services.items.filter((_, x) => x !== i) } }))} className="text-red-400 hover:text-red-300">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid md:grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">Anchor ID (href slug)</label>
                        <input value={item.id} onChange={e => setContent(c => updateService(c, i, { id: e.target.value }))} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" placeholder="Anchor ID (e.g. problem-identification)" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">Service Title</label>
                        <input value={item.title} onChange={e => setContent(c => updateService(c, i, { title: e.target.value }))} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" placeholder="Title" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Content Description</label>
                      <textarea value={item.content} onChange={e => setContent(c => updateService(c, i, { content: e.target.value }))} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm min-h-24" placeholder="Content" />
                    </div>
                    <ServiceImageUploadInput value={item.image} onChange={img => setContent(c => updateService(c, i, { image: img }))} />
                  </div>
                ))}
                <Button variant="outline" onClick={() => setContent(c => ({ ...c, detailed_services: { ...c.detailed_services, items: [...c.detailed_services.items, { id: '', title: '', content: '', image: '' }] } }))}><Plus className="w-4 h-4 mr-2" />Add Service</Button>
              </div>
            </SectionCard>

            <SectionCard title="Proven Track Record" open={open === 'track_record'} onOpen={() => setOpen(open === 'track_record' ? null : 'track_record')} onSave={() => save('track_record')} saving={saving === 'track_record'}>
              <TextFields value={content.track_record} onChange={v => setContent(c => ({ ...c, track_record: v }))} />
              <div className="space-y-3">{content.track_record.stats.map((stat, i) => <div key={i} className="grid grid-cols-1 sm:grid-cols-3 gap-2 rounded-xl border border-border/50 p-3"><input type="number" value={stat.value} onChange={e => setContent(c => ({ ...c, track_record: { ...c.track_record, stats: c.track_record.stats.map((x, n) => n === i ? { ...x, value: Number(e.target.value) } : x) } }))} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" placeholder="Value" /><input value={stat.label} onChange={e => setContent(c => ({ ...c, track_record: { ...c.track_record, stats: c.track_record.stats.map((x, n) => n === i ? { ...x, label: e.target.value } : x) } }))} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" placeholder="Label" /><input value={stat.suffix} onChange={e => setContent(c => ({ ...c, track_record: { ...c.track_record, stats: c.track_record.stats.map((x, n) => n === i ? { ...x, suffix: e.target.value } : x) } }))} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" placeholder="Suffix" /></div>)}</div>
            </SectionCard>

            <SectionCard title="Footer Contact" open={open === 'footer_contact'} onOpen={() => setOpen(open === 'footer_contact' ? null : 'footer_contact')} onSave={() => save('footer_contact')} saving={saving === 'footer_contact'}>
              <Field label="Address"><input value={content.footer_contact.address} onChange={e => setContent(c => ({ ...c, footer_contact: { ...c.footer_contact, address: e.target.value } }))} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" /></Field>
              <Field label="Email"><input type="email" value={content.footer_contact.email} onChange={e => setContent(c => ({ ...c, footer_contact: { ...c.footer_contact, email: e.target.value } }))} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" /></Field>
              <Field label="Phone"><input value={content.footer_contact.phone} onChange={e => setContent(c => ({ ...c, footer_contact: { ...c.footer_contact, phone: e.target.value } }))} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" /></Field>
            </SectionCard>

            <SectionCard title="Testimonials" open={open === 'testimonials'} onOpen={() => setOpen(open === 'testimonials' ? null : 'testimonials')} onSave={() => save('testimonials')} saving={saving === 'testimonials'}>
              <TextFields value={content.testimonials} onChange={v => setContent(c => ({ ...c, testimonials: v }))} />
              <div className="space-y-3">{content.testimonials.items.map((item, i) => <div key={i} className="rounded-xl border border-border/50 p-4 space-y-2"><div className="flex justify-between"><b>Testimonial {i + 1}</b><button onClick={() => setContent(c => ({ ...c, testimonials: { ...c.testimonials, items: c.testimonials.items.filter((_, x) => x !== i) } }))} className="text-red-400"><Trash2 className="w-4 h-4" /></button></div><div className="grid md:grid-cols-2 gap-2"><input value={item.name} onChange={e => setContent(c => updateTestimonial(c, i, { name: e.target.value }))} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" placeholder="Name" /><input value={item.role} onChange={e => setContent(c => updateTestimonial(c, i, { role: e.target.value }))} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" placeholder="Role" /></div><textarea value={item.content} onChange={e => setContent(c => updateTestimonial(c, i, { content: e.target.value }))} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm min-h-24" placeholder="Testimonial" /><input type="number" min={1} max={5} value={item.rating} onChange={e => setContent(c => updateTestimonial(c, i, { rating: Number(e.target.value) }))} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" placeholder="Rating" /></div>)}<Button variant="outline" onClick={() => setContent(c => ({ ...c, testimonials: { ...c.testimonials, items: [...c.testimonials.items, { name: '', role: '', content: '', rating: 5 }] } }))}><Plus className="w-4 h-4 mr-2" />Add Testimonial</Button></div>
            </SectionCard>

            <SectionCard title="Our Team" open={open === 'our_team'} onOpen={() => setOpen(open === 'our_team' ? null : 'our_team')} onSave={() => save('our_team')} saving={saving === 'our_team'}>
              <TextFields value={content.our_team || DEFAULT_OUR_TEAM} onChange={v => setContent(c => ({ ...c, our_team: { ...(c.our_team || DEFAULT_OUR_TEAM), ...v } }))} />
              <div className="space-y-4 pt-2">
                {(content.our_team?.items || DEFAULT_OUR_TEAM.items).map((item, i) => (
                  <div key={i} className="rounded-xl border border-border/50 p-4 space-y-3 bg-card/30">
                    <div className="flex justify-between items-center">
                      <b className="text-violet-300">Team Member {i + 1} ({item.name || 'Unnamed'})</b>
                      <button
                        type="button"
                        onClick={() => setContent(c => ({ ...c, our_team: { ...(c.our_team || DEFAULT_OUR_TEAM), items: (c.our_team?.items || DEFAULT_OUR_TEAM.items).filter((_, x) => x !== i) } }))}
                        className="text-red-400 hover:text-red-300 flex items-center gap-1 text-xs"
                      >
                        <Trash2 className="w-4 h-4" /> Remove
                      </button>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">Name</label>
                        <input value={item.name} onChange={e => setContent(c => updateTeamMember(c, i, { name: e.target.value }))} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" placeholder="Full Name" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">Role / Position</label>
                        <input value={item.role} onChange={e => setContent(c => updateTeamMember(c, i, { role: e.target.value }))} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" placeholder="Role / Position" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Bio / Description</label>
                      <textarea value={item.bio} onChange={e => setContent(c => updateTeamMember(c, i, { bio: e.target.value }))} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm min-h-20" placeholder="Brief bio" />
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">LinkedIn Profile URL</label>
                        <input value={item.linkedin} onChange={e => setContent(c => updateTeamMember(c, i, { linkedin: e.target.value }))} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" placeholder="https://www.linkedin.com/in/..." />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">Email (Optional, for admin photo sync)</label>
                        <input value={item.email || ''} onChange={e => setContent(c => updateTeamMember(c, i, { email: e.target.value }))} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" placeholder="email@v2vtech.com" />
                      </div>
                    </div>
                    <ServiceImageUploadInput value={item.image} onChange={v => setContent(c => updateTeamMember(c, i, { image: v }))} />
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={() => setContent(c => ({ ...c, our_team: { ...(c.our_team || DEFAULT_OUR_TEAM), items: [...(c.our_team?.items || DEFAULT_OUR_TEAM.items), { name: '', role: '', bio: '', image: '/team/default.jpg', linkedin: '', email: '' }] } }))}>
                  <Plus className="w-4 h-4 mr-2" /> Add Team Member
                </Button>
              </div>
            </SectionCard>
          </>}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function SectionCard({ title, open, onOpen, onSave, saving, children }: { title: string; open: boolean; onOpen: () => void; onSave: () => void; saving: boolean; children: ReactNode }) {
  return <div className="rounded-xl border border-border/50 bg-card/40 overflow-hidden"><div className="flex items-center justify-between p-4"><button onClick={onOpen} className="font-semibold text-left flex items-center gap-2"><Pencil className="w-4 h-4 text-violet-400" />{title}</button>{open && <Button onClick={onSave} disabled={saving} className="bg-violet-600 hover:bg-violet-500">{saving ? 'Saving...' : <><Save className="w-4 h-4 mr-2" />Save</>}</Button>}</div>{open && <div className="border-t border-border/50 p-4 space-y-4">{children}</div>}</div>;
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="block"><span className="text-xs text-muted-foreground mb-1 block">{label}</span>{children}</label>; }

function TextFields<T extends { eyebrow?: string; title: string; description: string }>({ value, onChange }: { value: T; onChange: (v: T) => void }) {
  return <div className="space-y-3"><Field label="Eyebrow">{'eyebrow' in value && <input value={String(value.eyebrow ?? '')} onChange={e => onChange({ ...value, eyebrow: e.target.value })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" />}</Field><Field label="Title"><input value={value.title} onChange={e => onChange({ ...value, title: e.target.value })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" /></Field><Field label="Description"><textarea value={value.description} onChange={e => onChange({ ...value, description: e.target.value })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm min-h-20" /></Field></div>;
}

function updateCapability(c: Content, i: number, patch: Partial<Capabilities['items'][number]>): Content { const next = clone(c); next.capabilities.items[i] = { ...next.capabilities.items[i], ...patch }; return next; }
function updateService(c: Content, i: number, patch: Partial<DetailedServices['items'][number]>): Content { const next = clone(c); next.detailed_services.items[i] = { ...next.detailed_services.items[i], ...patch }; return next; }
function updateTestimonial(c: Content, i: number, patch: Partial<Testimonials['items'][number]>): Content { const next = clone(c); next.testimonials.items[i] = { ...next.testimonials.items[i], ...patch }; return next; }
function updateTeamMember(c: Content, i: number, patch: Partial<OurTeamMember>): Content {
  const next = clone(c);
  if (!next.our_team) next.our_team = clone(DEFAULT_OUR_TEAM);
  next.our_team.items[i] = { ...next.our_team.items[i], ...patch };
  return next;
}
