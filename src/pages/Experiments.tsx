import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FlaskConical, Layers, PlayCircle, ShieldCheck, Cpu } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { API_BASE_URL } from '@/lib/apiConfig';

interface Project {
    id: number;
    name: string;
    technicalName?: string;
    description?: string;
    image?: string;
    status?: string;
    completion: number;
}

export default function Experiments() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const r = await fetch(`${API_BASE_URL}/api/public-projects`);
                if (!r.ok) throw new Error('Failed to fetch experiments');
                const d = await r.json();
                if (d.data) setProjects(d.data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, []);

    const getStatusStyle = (statusStr = '') => {
        const normalized = statusStr.toLowerCase();
        if (normalized === 'completed') {
            return {
                bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                icon: ShieldCheck
            };
        } else if (normalized === 'testing') {
            return {
                bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
                icon: FlaskConical
            };
        } else {
            return {
                bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                icon: PlayCircle
            };
        }
    };

    return (
        <div className="min-h-screen bg-background px-4 py-16 md:px-8">
            <div className="mx-auto max-w-7xl">
                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16 space-y-4"
                >
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20 text-purple-400">
                            <FlaskConical className="w-8 h-8" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-bold md:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                        V2V R&D Lab & Experiments
                    </h1>
                    <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                        Explore our active engineering sandbox, hardware mockups, and early-stage software prototypes as we build next-generation industrial systems.
                    </p>
                </motion.div>

                {/* Loading State */}
                {loading ? (
                    <div className="flex justify-center items-center py-24">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
                    </div>
                ) : projects.length === 0 ? (
                    <div className="text-center py-24 border border-dashed border-border/50 rounded-3xl bg-card/10">
                        <p className="text-muted-foreground text-lg">No active R&D experiments are currently listed.</p>
                    </div>
                ) : (
                    /* Experiments Grid */
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {projects.map((project, idx) => {
                            const statusStyle = getStatusStyle(project.status);
                            const StatusIcon = statusStyle.icon;

                            return (
                                <motion.div
                                    key={project.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                >
                                    <Card className="interactive-card group flex flex-col md:flex-row h-full overflow-hidden rounded-[2rem] border-white/10 bg-card/30 backdrop-blur-sm">
                                        {/* Image Section */}
                                        <div className="interactive-image relative w-full md:w-48 h-48 md:h-auto overflow-hidden bg-slate-950/20 shrink-0 border-r border-border/10">
                                            {project.image ? (
                                                <img
                                                    src={project.image}
                                                    alt={project.name}
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-purple-950/20">
                                                    <Cpu className="w-12 h-12 text-purple-500/30" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Card Contents */}
                                        <div className="flex flex-col flex-grow p-6 justify-between">
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between gap-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusStyle.bg}`}>
                                                        <StatusIcon className="w-3.5 h-3.5" />
                                                        {project.status || 'Active'}
                                                    </span>
                                                    {project.technicalName && (
                                                        <span className="text-[10px] text-muted-foreground font-mono bg-slate-950/40 px-2.5 py-1 rounded border border-border/30">
                                                            {project.technicalName}
                                                        </span>
                                                    )}
                                                </div>

                                                <CardHeader className="p-0">
                                                    <CardTitle className="text-xl leading-snug group-hover:text-purple-400 transition-colors">
                                                        {project.name}
                                                    </CardTitle>
                                                </CardHeader>

                                                <CardContent className="p-0">
                                                    <CardDescription className="text-sm text-muted-foreground/80 line-clamp-3">
                                                        {project.description || 'No description provided.'}
                                                    </CardDescription>
                                                </CardContent>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="mt-6 space-y-2">
                                                <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                                                    <span>Development Completion</span>
                                                    <span className="text-purple-400">{project.completion}%</span>
                                                </div>
                                                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-border/30">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${project.completion}%` }}
                                                        transition={{ duration: 1, ease: 'easeOut' }}
                                                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
