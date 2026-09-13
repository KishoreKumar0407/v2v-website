import { motion } from 'framer-motion';
import { Shield, Lock, Eye, FileText } from 'lucide-react';

export default function PrivacyPolicy() {
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
                        <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-400">
                            <Shield className="w-8 h-8" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-bold md:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400">
                        Privacy Policy
                    </h1>
                    <p className="text-muted-foreground max-w-2xl mx-auto text-base">
                        Effective date: August 29, 2026. Learn how Vision2Value Technologies handles data privacy and security.
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
                        <h2 className="text-xl font-bold flex items-center gap-3 text-emerald-400">
                            <Lock className="w-5 h-5" /> 1. Data Collection & Usage
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            At Vision2Value, we prioritize your privacy. We only collect details that are essential for providing services, managing partnership outreach, or evaluating user access requests on our dashboard platform. This includes contact details (such as your name and email address) submitted voluntarily via contact forms.
                        </p>
                    </div>

                    {/* Section 2 */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold flex items-center gap-3 text-emerald-400">
                            <Eye className="w-5 h-5" /> 2. Information Sharing
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We do not sell, trade, or distribute your personal information to third parties. Data gathered through our research portals or client manager endpoints remains isolated and protected within our secure databases.
                        </p>
                    </div>

                    {/* Section 3 */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold flex items-center gap-3 text-emerald-400">
                            <FileText className="w-5 h-5" /> 3. Security Framework
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            V2V Technologies implements robust cryptographic hashing, protected session structures, and authorization filters to shield all administrative endpoints. Access logs are audited periodically to defend against unauthorized attempts or database security compromises.
                        </p>
                    </div>

                    {/* Section 4 */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold flex items-center gap-3 text-emerald-400">
                            <Shield className="w-5 h-5" /> 4. Contact Details
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            For any inquiries regarding our data handling procedures or to request the purging of your registration data from our system databases, please email us directly at{' '}
                            <a href="mailto:info.v2vtech@gmail.com" className="text-emerald-400 hover:underline">
                                info.v2vtech@gmail.com
                            </a>.
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
