import React, { useState, useEffect, useRef, useCallback } from "react";
import { UserProfile, MatchResult, Bonus } from "../../types";
import { chatWithAI } from "../../services/geminiService";
import { FREE_LIMITS, getRemainingUsage, canUseFeature, incrementUsage } from "../../utils/features";
import UsageLimitBanner from "../Premium/UsageLimitBanner";

// ═══════════════════════════════════════════════════════════════════════
// TIPI
// ═══════════════════════════════════════════════════════════════════════
interface AIChatWidgetProps {
  profile?: UserProfile;
  results?: MatchResult[];
  bonuses: Bonus[];
  isPremium?: boolean;
  onUpgrade?: () => void;
}

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
}

// ═══════════════════════════════════════════════════════════════════════
// ICONE SVG - Percorsi centralizzati
// ═══════════════════════════════════════════════════════════════════════
const Icons = {
  bulb: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
  close: "M6 18L18 6M6 6l12 12",
  send: "M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z",
  chat: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z",
} as const;

// Componente Icon riutilizzabile
const Icon: React.FC<{ d: string; className?: string; filled?: boolean }> = ({ d, className = "h-6 w-6", filled }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox={filled ? "0 0 20 20" : "0 0 24 24"} fill={filled ? "currentColor" : "none"} stroke={filled ? "none" : "currentColor"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════
// COSTANTI
// ═══════════════════════════════════════════════════════════════════════
const WELCOME_MSG: Message = {
  id: "welcome",
  text: "Ciao! 👋 Sono il tuo assistente BonusMatch. Chiedimi pure qualsiasi cosa sui tuoi bonus!",
  sender: "ai",
};

const STYLES = {
  msgBase: "max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm",
  msgUser: "bg-blue-600 text-white rounded-tr-none",
  msgAI: "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-slate-700",
} as const;

// ═══════════════════════════════════════════════════════════════════════
// COMPONENTI INTERNI
// ═══════════════════════════════════════════════════════════════════════

/** Indicatore digitazione AI con animazione bounce */
const TypingIndicator: React.FC = () => (
  <div className="flex justify-start">
    <div className={`${STYLES.msgBase} ${STYLES.msgAI} flex gap-1 items-center h-10`}>
      {["-0.3s", "-0.15s", "0s"].map((delay, i) => (
        <div key={i} className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: delay }} />
      ))}
    </div>
  </div>
);

/** Singolo messaggio chat */
const ChatMessage: React.FC<{ msg: Message }> = ({ msg }) => (
  <div className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
    <div className={`${STYLES.msgBase} ${msg.sender === "user" ? STYLES.msgUser : STYLES.msgAI}`}>
      {msg.text}
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPALE
// ═══════════════════════════════════════════════════════════════════════
const AIChatWidget: React.FC<AIChatWidgetProps> = ({ profile, results, bonuses, isPremium = false, onUpgrade }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MSG]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [remainingMessages, setRemainingMessages] = useState(() => getRemainingUsage("ai_chat", FREE_LIMITS.maxAIChatPerDay));
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll ai nuovi messaggi
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  // Helper per creare messaggi
  const createMsg = useCallback((text: string, sender: "user" | "ai"): Message => ({
    id: Date.now().toString() + (sender === "ai" ? "1" : ""),
    text,
    sender,
  }), []);

  // Invio messaggio
  const handleSend = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    // Limite raggiunto per utenti free
    if (!isPremium && !canUseFeature("ai_chat", FREE_LIMITS.maxAIChatPerDay)) {
      setMessages(prev => [...prev, createMsg("⚠️ Hai raggiunto il limite giornaliero di messaggi gratuiti. Passa a Premium per chat illimitata!", "ai")]);
      return;
    }

    const userText = inputText;
    setMessages(prev => [...prev, createMsg(userText, "user")]);
    setInputText("");
    setIsTyping(true);

    // Incrementa utilizzo free
    if (!isPremium) {
      incrementUsage("ai_chat");
      setRemainingMessages(getRemainingUsage("ai_chat", FREE_LIMITS.maxAIChatPerDay));
    }

    // Chiamata AI
    try {
      const response = await chatWithAI(userText, profile, results, bonuses);
      setMessages(prev => [...prev, createMsg(response, "ai")]);
    } catch {
      setMessages(prev => [...prev, createMsg("Mi dispiace, si è verificato un errore di connessione. Riprova più tardi.", "ai")]);
    } finally {
      setIsTyping(false);
    }
  }, [inputText, isPremium, profile, results, bonuses, createMsg]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      
      {/* ═══ FINESTRA CHAT ═══ */}
      <div className={`pointer-events-auto bg-white dark:bg-slate-900 w-[350px] md:w-[400px] h-[500px] rounded-3xl shadow-2xl mb-4 overflow-hidden border border-slate-200 dark:border-slate-800 transition-all duration-300 transform origin-bottom-right flex flex-col ${isOpen ? "scale-100 opacity-100 translate-y-0" : "scale-90 opacity-0 translate-y-10 pointer-events-none"}`}>
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex justify-between items-center text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
              <Icon d={Icons.bulb} />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Bonus Match AI</h3>
              <p className="text-[10px] opacity-80 uppercase tracking-widest font-bold">Online</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors">
            <Icon d={Icons.close} />
          </button>
        </div>

        {/* Corpo messaggi */}
        <div className="flex-grow p-4 overflow-y-auto bg-slate-50 dark:bg-slate-950/50 space-y-4">
          {!isPremium && (
            <UsageLimitBanner remaining={remainingMessages} limit={FREE_LIMITS.maxAIChatPerDay} feature="domande" onUpgrade={onUpgrade || (() => {})} />
          )}
          
          {messages.map(msg => <ChatMessage key={msg.id} msg={msg} />)}
          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Input footer */}
        <form onSubmit={handleSend} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <div className="relative flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Chiedimi un bonus..."
              className="w-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white text-sm rounded-full py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
            />
            <button type="submit" disabled={!inputText.trim() || isTyping} className="absolute right-1 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              <Icon d={Icons.send} className="h-4 w-4 transform rotate-90" filled />
            </button>
          </div>
        </form>
      </div>

      {/* ═══ PULSANTE TOGGLE ═══ */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`pointer-events-auto h-16 w-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 transform hover:scale-110 active:scale-95 z-50 ${isOpen ? "bg-slate-800 rotate-90" : "bg-gradient-to-r from-blue-600 to-indigo-600 animate-pulse-slow"}`}
      >
        {isOpen ? (
          <Icon d={Icons.close} className="h-8 w-8 text-white" />
        ) : (
          <div className="relative">
            <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-white" />
            <Icon d={Icons.chat} className="h-8 w-8 text-white" />
          </div>
        )}
      </button>
    </div>
  );
};

export default AIChatWidget;
