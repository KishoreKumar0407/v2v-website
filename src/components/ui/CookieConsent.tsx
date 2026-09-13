import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "./button";

const CookieConsent = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Always show the cookie consent on mount, regardless of previous choices
        const timer = setTimeout(() => setIsVisible(true), 500);
        return () => clearTimeout(timer);
    }, []);

    const acceptCookies = () => {
        localStorage.setItem("cookieConsent_v2", "true");
        setIsVisible(false);
    };

    const rejectCookies = () => {
        localStorage.setItem("cookieConsent_v2", "false");
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="fixed bottom-4 left-4 right-4 md:bottom-6 md:right-6 md:left-auto md:max-w-md z-[9999]"
                >
                    <div className="bg-background/80 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-2xl flex flex-col gap-4">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-primary/20 rounded-full shrink-0">
                                <Cookie className="w-6 h-6 text-primary" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-semibold text-lg">We use cookies</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. By clicking "Accept", you consent to our use of cookies. Read our{" "}
                                    <Link to="/privacy-policy" className="text-primary hover:underline font-medium">
                                        Privacy Policy
                                    </Link>
                                    .
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row md:justify-end gap-3 pt-2">
                            <Button onClick={acceptCookies} className="w-full md:w-auto font-medium">
                                Accept Cookies
                            </Button>
                            <Button variant="outline" onClick={rejectCookies} className="w-full md:w-auto font-medium">
                                Reject
                            </Button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CookieConsent;
