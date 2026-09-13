import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

export default function Blogs() {
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    useEffect(() => {
        const fetchBlogs = async () => {
            try {
                const r = await fetch(`${API_BASE_URL}/api/public-blogs`);
                if (!r.ok) throw new Error('Failed to fetch blogs');
                const d = await r.json();
                if (d.data) setBlogs(d.data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchBlogs();
    }, []);

    const categories = ['All', ...Array.from(new Set(blogs.map(b => b.category || 'V2V Insights')))];

    const filteredBlogs = blogs.filter(b => {
        const matchesSearch = b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || (b.category || 'V2V Insights') === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return dateStr;
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
                        <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 text-blue-400">
                            <BookOpen className="w-8 h-8" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-bold md:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                        V2V Insights & Articles
                    </h1>
                    <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                        Stay informed with the latest research, tech transfer workflows, and system designs from our co-founders and engineers.
                    </p>
                </motion.div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-card/30 backdrop-blur-sm border border-border/50 p-4 rounded-2xl">
                    <div className="flex flex-wrap gap-2">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all duration-300 ${selectedCategory === cat
                                        ? 'bg-blue-600 text-white border border-blue-500 shadow-lg shadow-blue-600/20'
                                        : 'bg-background/50 text-muted-foreground hover:text-foreground border border-border/40'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                    <input
                        type="text"
                        placeholder="Search articles..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full md:w-80 bg-background/50 border border-border/40 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500/50"
                    />
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="flex justify-center items-center py-24">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
                    </div>
                ) : filteredBlogs.length === 0 ? (
                    <div className="text-center py-24 border border-dashed border-border/50 rounded-3xl bg-card/10">
                        <p className="text-muted-foreground text-lg">No articles found matching your criteria.</p>
                    </div>
                ) : (
                    /* Blogs Grid */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredBlogs.map((blog, idx) => (
                            <motion.div
                                key={blog.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                            >
                                <Card className="interactive-card group flex flex-col h-full overflow-hidden rounded-[2rem] border-white/10 bg-card/40 backdrop-blur-sm">
                                    <div className="interactive-image relative h-48 overflow-hidden bg-slate-950/20">
                                        {blog.image ? (
                                            <img
                                                src={blog.image}
                                                alt={blog.title}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-blue-950/20">
                                                <BookOpen className="w-12 h-12 text-blue-500/30" />
                                            </div>
                                        )}
                                        <span className="absolute top-4 left-4 bg-blue-600/90 text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full border border-blue-500/30">
                                            {blog.category || 'V2V Insights'}
                                        </span>
                                    </div>
                                    <CardHeader className="p-6 pb-2">
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {formatDate(blog.published_at)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <User className="w-3.5 h-3.5" />
                                                {blog.author || 'V2V Tech'}
                                            </span>
                                        </div>
                                        <CardTitle className="text-xl line-clamp-2 leading-snug group-hover:text-blue-400 transition-colors">
                                            {blog.title}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6 pt-2 flex flex-col flex-grow">
                                        <CardDescription className="text-sm text-muted-foreground/80 line-clamp-3 mb-6 flex-grow">
                                            {blog.description}
                                        </CardDescription>
                                        <Link to={`/blogs/${blog.id}`} className="w-full">
                                            <Button className="w-full bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/20 hover:border-transparent transition-all duration-300">
                                                Read Article <ArrowRight className="w-4 h-4 ml-2" />
                                            </Button>
                                        </Link>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
