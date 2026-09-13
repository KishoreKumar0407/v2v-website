import { motion } from 'framer-motion';
import { Scale, CheckCircle2, AlertCircle, Bookmark } from 'lucide-react';

export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-background px-4 py-16 md:px-8">
            <div className="mx-auto max-w-4xl">
                {/* Header */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16 space-y-4"
                >
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-amber-400">
                            <Scale className="w-8 h-8" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-bold md:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-400">
                        Terms of Service
                    </h1>
                    <p className="text-muted-foreground max-w-2xl mx-auto text-base">
                        Effective date: August 29, 2026. Please read these terms carefully before accessing V2V portals.
                    </p>
                </motion.div>

                {/* Content */}
                <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-12 bg-card/25 border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl backdrop-blur-md"
                >
                    {/* Section 1 */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold flex items-center gap-3 text-amber-400">
                            <Bookmark className="w-5 h-5" /> 1. Acceptance of Terms
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            By visiting our landing pages, accessing R&D experiment metrics, or utilizing dynamic client manager fields, you represent that you accept and agree to comply with these terms of service.
                        </p>
                    </div>

                    {/* Section 2 */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold flex items-center gap-3 text-amber-400">
                            <CheckCircle2 className="w-5 h-5" /> 2. License & Intellectual Property
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            All proprietary source files, database schemas, system architectures, and interface modules are intellectual properties of Vision2Value (V2V) Technologies. You may not copy, replicate, or decompile V2V modules without explicit strategic authorization.
                        </p>
                    </div>

                    {/* Section 3 */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold flex items-center gap-3 text-amber-400">
                            <AlertCircle className="w-5 h-5" /> 3. Limitation of Liability
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            V2V Technologies provides sandbox prototyping, client managers, and system dashboards "as-is". We disclaim any liability for temporary project status delays or R&D experiment metric variance.
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
