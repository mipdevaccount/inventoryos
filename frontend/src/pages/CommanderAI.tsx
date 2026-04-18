import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bot, Send, User, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { getProducts, getVendors, getRequests, getPurchaseHistory, askCommanderAI } from '../lib/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const CommanderAI = () => {
    const [messages, setMessages] = useState<Message[]>([{
        id: 'welcome',
        role: 'assistant',
        content: "Hello! I am Commander AI. I have full read access to your current database including products, vendors, and procurement requests. What would you like me to analyze for you today?",
        timestamp: new Date()
    }]);
    const [inputQuery, setInputQuery] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Context queries
    const { data: products } = useQuery({ queryKey: ['products'], queryFn: () => getProducts() });
    const { data: vendors } = useQuery({ queryKey: ['vendors'], queryFn: () => getVendors() });
    const { data: requests } = useQuery({ queryKey: ['requests'], queryFn: () => getRequests() });
    const { data: purchaseHistory } = useQuery({ queryKey: ['purchaseHistory'], queryFn: () => getPurchaseHistory() });

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputQuery.trim()) return;

        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: inputQuery, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInputQuery('');
        setIsTyping(true);

        try {
            const contextBase = {
                products: products || [],
                vendors: vendors || [],
                activeRequests: requests || [],
                historicalPurchases: purchaseHistory || []
            };

            const response = await askCommanderAI(userMsg.content, contextBase);
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.answer || "I received a blank response from the analytical engine.",
                timestamp: new Date()
            }]);
        } catch (error: any) {
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `**CRITICAL ERROR:** ${error.message}`,
                timestamp: new Date()
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] -mt-4 lg:mt-0 max-w-5xl mx-auto bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-3xl border border-white/20 shadow-xl overflow-hidden relative">
            {/* Header */}
            <div className="p-6 border-b border-border/50 shrink-0 flex items-center justify-between bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-900/20 dark:to-purple-900/20">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 relative overflow-hidden">
                        <Sparkles size={24} className="text-white relative z-10" />
                        <div className="absolute inset-0 bg-white/10 blur-xl animate-pulse" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Commander AI</h1>
                        <p className="text-sm font-medium text-muted-foreground">Strategic Procurement Intelligence</p>
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'assistant' && (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex flex-shrink-0 items-center justify-center shadow-md">
                                <Bot size={16} className="text-white" />
                            </div>
                        )}
                        <div className={`max-w-[85%] rounded-2xl px-6 py-5 shadow-sm ${
                            msg.role === 'user' 
                            ? 'bg-primary text-primary-foreground rounded-tr-none' 
                            : 'bg-white dark:bg-slate-800 border border-border/50 rounded-tl-none prose dark:prose-invert prose-sm max-w-none'
                        }`}>
                            {msg.role === 'user' ? (
                                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                            ) : (
                                <ReactMarkdown 
                                    remarkPlugins={[[remarkGfm]]} 
                                    className="markdown-body text-sm leading-relaxed space-y-4"
                                >
                                    {msg.content}
                                </ReactMarkdown>
                            )}
                        </div>
                        {msg.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-secondary flex flex-shrink-0 items-center justify-center shadow-inner">
                                <User size={16} className="text-muted-foreground" />
                            </div>
                        )}
                    </div>
                ))}
                {isTyping && (
                    <div className="flex gap-4 justify-start animate-fade-in">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex flex-shrink-0 items-center justify-center shadow-md">
                            <Bot size={16} className="text-white" />
                        </div>
                        <div className="bg-white dark:bg-slate-800 border border-border/50 rounded-2xl rounded-tl-none px-5 py-4 shadow-sm flex items-center gap-2">
                            <Loader2 size={16} className="animate-spin text-indigo-500" />
                            <span className="text-sm text-muted-foreground font-medium">Analyzing database vectors...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="p-4 bg-secondary/30 shrink-0 border-t border-border/50 backdrop-blur-md">
                <div className="relative flex items-center max-w-4xl mx-auto">
                    <input
                        type="text"
                        value={inputQuery}
                        onChange={(e) => setInputQuery(e.target.value)}
                        placeholder="Ask anything about vendors, purchase orders, or pricing history..."
                        className="w-full pl-6 pr-14 py-4 rounded-full border border-border/50 bg-white/80 dark:bg-slate-900/80 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
                        disabled={isTyping}
                    />
                    <button
                        type="submit"
                        disabled={!inputQuery.trim() || isTyping}
                        className="absolute right-2 p-2.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center"
                    >
                        <Send size={18} />
                    </button>
                </div>
                <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground/60 font-medium pb-2">
                    <AlertCircle size={12} />
                    <span>AI can make mistakes. Verify critical procurement calculations manually.</span>
                </div>
            </form>
        </div>
    );
};

export default CommanderAI;
