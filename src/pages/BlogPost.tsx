import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, User, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { API_BASE_URL } from '@/lib/apiConfig';

interface Blog {
    id: number;
    title: string;
    description: string;
    content: string;
    image?: string;
    category?: string;
    author?: string;
    published_at: string;
}

export default function BlogPost() {
    const { id } = useParams<{ id: string }>();
    const [blog, setBlog] = useState<Blog | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBlogPost = async () => {
            try {
                const r = await fetch(`${API_BASE_URL}/api/public-blogs/${id}`);
                if (!r.ok) {
                    if (r.status === 404) throw new Error('Article not found');
                    throw new Error('Failed to load article');
                }
                const d = await r.json();
                if (d.data) setBlog(d.data);
            } catch (e: any) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };
        fetchBlogPost();
    }, [id]);

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return dateStr;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
            </div>
        );
    }

    if (error || !blog) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background px-4">
                <div className="max-w-md text-center rounded-3xl border border-border/50 bg-card p-10 shadow-2xl">
                    <h2 className="text-2xl font-bold text-red-400 mb-4">Error</h2>
                    <p className="text-muted-foreground mb-6">{error || 'Article not found.'}</p>
                    <Link to="/blogs">
                        <Button className="bg-blue-600 hover:bg-blue-500 text-white">
                            Back to Articles
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background px-4 py-16 md:px-8">
            <div className="mx-auto max-w-4xl">
                {/* Back Button */}
                <Link to="/blogs">
                    <Button variant="ghost" className="mb-8 pl-0 hover:bg-transparent hover:text-blue-400 text-muted-foreground transition-colors">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Articles
                    </Button>
                </Link>

                <motion.article
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                >
                    {/* Category & Title */}
                    <div className="space-y-4">
                        <span className="inline-block bg-blue-600/90 text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full border border-blue-500/30">
                            {blog.category || 'V2V Insights'}
                        </span>
                        <h1 className="text-3xl md:text-5xl font-bold leading-tight tracking-tight text-foreground">
                            {blog.title}
                        </h1>
                        <p className="text-xl text-muted-foreground leading-relaxed italic">
                            {blog.description}
                        </p>
                    </div>

                    {/* Meta Details */}
                    <div className="flex flex-wrap items-center gap-6 border-y border-border/50 py-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                                <User className="w-4 h-4" />
                            </div>
                            <span>By <strong className="text-foreground">{blog.author || 'V2V Tech'}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(blog.published_at)}</span>
                        </div>
                    </div>

                    {/* Cover Image */}
                    <div className="interactive-image relative h-[25rem] w-full overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-950/20 shadow-xl">
                        {blog.image ? (
                            <img
                                src={blog.image}
                                alt={blog.title}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-blue-950/10">
                                <BookOpen className="w-20 h-20 text-blue-500/20" />
                            </div>
                        )}
                    </div>

                    {/* Content Section */}
                    <div
                        className="prose prose-invert max-w-none pt-4 text-muted-foreground leading-relaxed text-base md:text-lg space-y-6"
                        dangerouslySetInnerHTML={{ __html: blog.content || '' }}
                    />
                </motion.article>
            </div>
        </div>
    );
}
