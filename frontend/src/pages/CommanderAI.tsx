import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bot, Send, User, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { getProducts, getVendors, getRequests, askCommanderAI } from '../lib/api';

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
                activeRequests: requests || []
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
                                <div className="text-sm space-y-4">
                                    {msg.content.split('\n\n').map((block, i) => {
                                        // Handle Headings
                                        if (block.startsWith('### ')) return <h3 key={i} className="text-lg font-bold text-foreground mt-4 mb-2">{block.replace('### ', '')}</h3>;
                                        if (block.startsWith('## ')) return <h2 key={i} className="text-xl font-bold text-foreground mt-5 mb-2">{block.replace('## ', '')}</h2>;
                                        if (block.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold text-foreground mt-6 mb-3">{block.replace('# ', '')}</h1>;

                                        // Handle Tables
                                        if (block.trim().startsWith('|')) {
                                            const rows = block.trim().split('\n');
                                            return (
                                                <div key={i} className="overflow-x-auto rounded-xl border border-border/50 my-4 shadow-sm">
                                                    <table className="w-full text-left border-collapse text-xs">
                                                        <tbody>
                                                            {rows.map((row, rowIndex) => {
                                                                if (row.includes('|---') || row.trim() === '') return null; // Skip separator row
                                                                const cells = row.split('|').filter(c => c.trim() !== '' || row.indexOf(c) > 0 && row.indexOf(c) < row.length - 1).map(c => c.trim());
                                                                // The above keeps empty cells if they are between pipes, but strips outer empty strings from the split.
                                                                const actualCells = row.split('|').slice(1, -1).map(c => c.trim());
                                                                if (actualCells.length === 0) return null;

                                                                const CellTag = rowIndex === 0 ? 'th' : 'td';
                                                                const cellClasses = rowIndex === 0 
                                                                    ? "p-3 font-semibold bg-slate-50 dark:bg-slate-900 border-b border-border/50 whitespace-nowrap text-slate-700 dark:text-slate-300"
                                                                    : "p-3 border-b border-border/10 text-slate-600 dark:text-slate-400";
                                                                
                                                                return (
                                                                    <tr key={rowIndex} className={rowIndex !== 0 ? "hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors" : ""}>
                                                                        {actualCells.map((cell, cellIndex) => (
                                                                            <CellTag key={cellIndex} className={cellClasses} dangerouslySetInnerHTML={{ __html: cell.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                                                                        ))}
                                                                    </tr>
                                                                )
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            );
                                        }

                                        // Handle Lists
                                        if (block.trim().startsWith('- ')) {
                                            const items = block.trim().split('\n');
                                            return (
                                                <ul key={i} className="list-disc pl-5 space-y-2 my-3 text-slate-700 dark:text-slate-300">
                                                    {items.map((item, itemIdx) => (
                                                        <li key={itemIdx} dangerouslySetInnerHTML={{ __html: item.replace(/^- /, '').replace(/\*\*(.*?)\*\*/g, '<strong className="text-foreground">$1</strong>') }} />
                                                    ))}
                                                </ul>
                                            );
                                        }

                                        // Regular Paragraphs
                                        let htmlContent = block
                                            .replace(/\*\*(.*?)\*\*/g, '<strong className="text-foreground">$1</strong>')
                                            .replace(/\*(.*?)\*/g, '<em className="text-slate-600 dark:text-slate-400">$1</em>')
                                            .replace(/`([^`]+)`/g, '<code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-indigo-600 dark:text-indigo-400 font-mono text-xs">$1</code>')
                                            .replace(/\n/g, '<br />');

                                        return <p key={i} className="leading-relaxed text-slate-700 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: htmlContent }} />;
                                    })}
                                </div>
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
