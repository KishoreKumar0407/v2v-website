import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import { Loader2, MessageCircle, Send, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import { sendChatQuestion } from "@/lib/chatApi";
import { cn } from "@/lib/utils";

type Message = {
    id: number;
    role: "assistant" | "user";
    content: string;
};

const suggestedQuestions = [
    "What is V2V Tech?",
    "What services does V2V provide?",
    "Tell me about V2V's projects",
    "Tell me about the team",
];

const renderFormattedMessage = (content: string): ReactNode =>
    content.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
        part.startsWith("**") && part.endsWith("**") ? (
            <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>
        ) : (
            part
        )
    );

const Chatbot = () => {
    const { pathname } = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [question, setQuestion] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 1,
            role: "assistant",
            content: "Hello! Welcome to V2V Tech. How can I help you learn about V2V?",
        },
    ]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    const isPrivateRoute = pathname.startsWith("/admin") || pathname.startsWith("/managers");
    if (isPrivateRoute) return null;

    const submitQuestion = async (event?: FormEvent) => {
        event?.preventDefault();
        const trimmedQuestion = question.trim();
        if (!trimmedQuestion || isLoading) return;

        setQuestion("");
        setMessages((current) => [
            ...current,
            { id: Date.now(), role: "user", content: trimmedQuestion },
        ]);
        setIsLoading(true);

        try {
            const answer = await sendChatQuestion(trimmedQuestion);
            setMessages((current) => [
                ...current,
                { id: Date.now() + 1, role: "assistant", content: answer },
            ]);
        } catch (error) {
            setMessages((current) => [
                ...current,
                {
                    id: Date.now() + 1,
                    role: "assistant",
                    content:
                        error instanceof Error
                            ? error.message
                            : "I could not reach the assistant right now. Please try again shortly.",
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {isOpen ? (
                <section
                    aria-label="V2V AI assistant"
                    className="fixed bottom-3 right-3 z-[10000] flex h-[min(640px,calc(100vh-1.5rem))] w-[min(310px,calc(100vw-1.5rem))] origin-bottom-right flex-col overflow-hidden rounded-2xl border border-primary/30 bg-slate-950/95 shadow-2xl shadow-primary/20 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 sm:bottom-4 sm:right-4 sm:h-[min(720px,calc(100vh-2rem))] sm:w-[min(340px,calc(100vw-2rem))]"
                >
                    <header className="flex items-center justify-between border-b border-white/10 bg-primary/10 px-3 py-2.5 sm:px-4 sm:py-3">
                        <div className="flex items-center gap-2.5 sm:gap-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/20 p-1.5 sm:h-9 sm:w-9">
                                <img src="/v2v-logo.png" alt="V2V" className="h-full w-full object-contain" />
                            </span>
                            <div>
                                <p className="text-sm font-semibold text-white">V2V Assistant</p>
                                <p className="text-xs text-white/50">Ask about our work and services</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            aria-label="Close assistant"
                            className="rounded-lg p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </header>

                    <div className="flex-1 space-y-3 overflow-y-auto p-3 sm:p-4" aria-live="polite">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
                            >
                                <p
                                    className={cn(
                                        "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                                        message.role === "user"
                                            ? "rounded-br-md bg-primary text-primary-foreground"
                                            : "rounded-bl-md border border-white/10 bg-white/10 text-white/85"
                                    )}
                                >
                                    {message.role === "assistant" ? renderFormattedMessage(message.content) : message.content}
                                </p>
                            </div>
                        ))}
                        {messages.length === 1 && (
                            <div className="flex flex-wrap gap-2 pt-1">
                                {suggestedQuestions.map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        type="button"
                                        onClick={() => setQuestion(suggestion)}
                                        className="rounded-full border border-primary/30 px-3 py-1.5 text-left text-xs text-primary transition-colors hover:bg-primary/10"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        )}
                        {isLoading && (
                            <div className="flex items-center gap-2 text-xs text-white/50">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Thinking...
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={submitQuestion} className="border-t border-white/10 p-2.5 sm:p-3">
                        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-1.5 focus-within:border-primary/60">
                            <input
                                value={question}
                                onChange={(event) => setQuestion(event.target.value)}
                                placeholder="Ask V2V anything..."
                                aria-label="Chat question"
                                disabled={isLoading}
                                className="min-w-0 flex-1 bg-transparent px-2 text-sm text-white outline-none placeholder:text-white/35"
                            />
                            <button
                                type="submit"
                                aria-label="Send question"
                                disabled={isLoading || !question.trim()}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <Send className="h-4 w-4" />
                            </button>
                        </div>
                    </form>
                </section>
            ) : (
                <button
                    type="button"
                    onClick={() => setIsOpen(true)}
                    aria-label="Open V2V assistant"
                    className="fixed bottom-3 right-3 z-[10000] flex h-12 w-12 items-center justify-center rounded-full bg-primary/85 text-primary-foreground shadow-lg shadow-primary/30 transition-all duration-300 hover:scale-105 hover:bg-primary hover:shadow-[0_0_28px_rgba(155,135,245,0.75)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:bottom-4 sm:right-4 sm:h-14 sm:w-14"
                >
                    <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
            )}
        </>
    );
};

export default Chatbot;
