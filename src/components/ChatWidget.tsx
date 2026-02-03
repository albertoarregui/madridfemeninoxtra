import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { MessageCircle, X, Send, Bot, User, Sparkles, Trophy, BarChart2 } from 'lucide-react';

const SUGGESTED_QUESTIONS = [
    { icon: <Trophy className="w-4 h-4" />, text: "¿Quién es la máxima goleadora?" },
    { icon: <BarChart2 className="w-4 h-4" />, text: "Estadísticas de Caroline Weir" },
    { icon: <Sparkles className="w-4 h-4" />, text: "Resultados del último partido" },
];

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const { messages, append, status } = useChat({
        api: '/api/chat',
        streamProtocol: 'text',
    } as any) as any;

    const [input, setInput] = useState('');
    const isLoading = status === 'streaming' || status === 'submitted';

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        append({ role: 'user', content: input });
        setInput('');
    };
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Estilos basados en global.css
    // primary-color: #ffde59 (Amarillo)
    // dark-bg: #2b2b2b
    // dark-bg-secondary: #1f1f1f

    return (
        <div className="fixed bottom-4 right-4 z-50 font-sans">
            {/* Botón flotante para abrir/cerrar */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-[#2b2b2b] hover:bg-[#1f1f1f] text-[#ffde59] p-4 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 border border-[#ffde59]/30 flex items-center gap-2 group"
                >
                    <div className="relative">
                        <Bot className="w-6 h-6 text-[#ffde59]" />
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#2b2b2b] animate-pulse"></span>
                    </div>
                    <span className="font-bold pr-1 hidden sm:inline text-white">Pregúntame</span>
                </button>
            )}

            {/* Ventana del Chat */}
            {isOpen && (
                <div className="bg-[#1f1f1f]/95 backdrop-blur-md rounded-2xl shadow-2xl w-[350px] sm:w-[400px] h-[500px] sm:h-[600px] flex flex-col border border-[#ffde59]/20 animate-in slide-in-from-bottom-10 fade-in duration-300">

                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#2b2b2b] rounded-t-2xl">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[#ffde59]/10 rounded-lg border border-[#ffde59]/20">
                                <Bot className="w-5 h-5 text-[#ffde59]" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-sm">Pregúntame</h3>
                                <p className="text-xs text-gray-400 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                    En línea con Gemini
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-gray-400 hover:text-[#ffde59] transition-colors p-1 rounded-md"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Área de Mensajes */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#1f1f1f]">
                        {messages.length === 0 && (
                            <div className="text-center py-8">
                                <div className="inline-flex items-center justify-center p-3 bg-white/5 rounded-full mb-3">
                                    <Sparkles className="w-6 h-6 text-[#ffde59]" />
                                </div>
                                <h4 className="text-white font-medium mb-1">¡Hola! ¿En qué puedo ayudarte?</h4>
                                <p className="text-gray-400 text-sm mb-6">Pregúntame sobre estadísticas, jugadoras o partidos.</p>

                                <div className="flex flex-col gap-2">
                                    {SUGGESTED_QUESTIONS.map((q, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                const fakeEvent = { target: { value: q.text } } as any;
                                                handleInputChange(fakeEvent);
                                                // Trigger submission shortly after setting input is tricky with React state, 
                                                // so we'll just call append directly
                                                append({ role: 'user', content: q.text });
                                                setIsOpen(true); // Ensure open
                                            }}
                                            className="text-left text-sm bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#ffde59]/30 text-gray-300 p-3 rounded-xl transition-all flex items-center gap-3 group"
                                        >
                                            <span className="p-1.5 bg-white/5 rounded-md text-[#ffde59] group-hover:text-white transition-colors">{q.icon}</span>
                                            {q.text}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {messages.map((m: any) => (
                            <div
                                key={m.id}
                                className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${m.role === 'user' ? 'bg-[#ffde59]' : 'bg-[#2b2b2b] border border-white/10'
                                    }`}>
                                    {m.role === 'user' ? <User className="w-4 h-4 text-[#1f1f1f]" /> : <Bot className="w-4 h-4 text-[#ffde59]" />}
                                </div>
                                <div
                                    className={`max-w-[80%] rounded-2xl p-3 text-sm leading-relaxed shadow-sm ${m.role === 'user'
                                        ? 'bg-[#ffde59] text-black rounded-tr-none font-medium'
                                        : 'bg-[#2b2b2b] text-gray-100 border border-white/10 rounded-tl-none'
                                        }`}
                                >
                                    {m.content}
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#2b2b2b] border border-white/10 flex items-center justify-center flex-shrink-0">
                                    <Bot className="w-4 h-4 text-[#ffde59]" />
                                </div>
                                <div className="bg-[#2b2b2b] border border-white/10 rounded-2xl rounded-tl-none p-3 flex items-center gap-1 h-10 w-16">
                                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Footer Input */}
                    <div className="p-3 border-t border-white/10 bg-[#2b2b2b]">
                        <form onSubmit={handleSubmit} className="chat-form relative flex items-center">
                            <input
                                className="w-full bg-[#1f1f1f] border border-white/10 text-white text-sm rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:border-[#ffde59] focus:ring-1 focus:ring-[#ffde59] transition-all placeholder:text-gray-600"
                                value={input}
                                onChange={handleInputChange}
                                placeholder="Escribe tu mensaje..."
                                disabled={isLoading}
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !input.trim()}
                                className="absolute right-2 p-2 bg-[#ffde59] text-black rounded-lg hover:bg-[#e6c845] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                        <div className="text-center mt-2 text-[10px] text-gray-500">
                            IA experimental. Puede cometer errores.
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
}
