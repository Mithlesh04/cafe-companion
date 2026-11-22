"use client";

import { Mic, MicOff, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { post } from "@/lib/client/api";
import type { CartLine, ChatMessage, Order, Preferences } from "@/lib/types";
import { ModeBadge } from "./ui";

interface Props {
  cart: CartLine[];
  prefs: Preferences;
  customerName: string;
  onCart: (c: CartLine[]) => void;
  onOrder: (o: Order) => void;
}

const SUGGESTIONS = ["Two oat lattes and a croissant", "Something caffeine-free", "How long is the wait?", "What do you recommend?"];

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function getRecognizer(): SpeechRecognitionLike | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

export function Chat({ cart, prefs, customerName, onCart, onOrder }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hi. I am the Café Companion. Tell me what you feel like, or ask me to pick something for you." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"gemini" | "demo" | undefined>();
  const [listening, setListening] = useState(false);
  const [voiceOk, setVoiceOk] = useState(false);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVoiceOk(Boolean(getRecognizer()));
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || busy) return;
    setInput("");
    const history = messages.slice(-12);
    setMessages((m) => [...m, { role: "user", content: message }]);
    setBusy(true);
    try {
      const res = await post<{ reply: string; cart: CartLine[]; order?: Order; mode: "gemini" | "demo" }>("/api/chat", {
        message,
        history,
        cart,
        prefs,
        customerName: customerName || undefined,
      });
      setMode(res.mode);
      onCart(res.cart);
      if (res.order) onOrder(res.order);
      setMessages((m) => [...m, { role: "assistant", content: res.reply }]);
    } catch (err) {
      setMessages((m) => [...m, { role: "assistant", content: `Sorry, something went wrong: ${(err as Error).message}` }]);
    } finally {
      setBusy(false);
    }
  };

  const toggleVoice = () => {
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }
    const rec = getRecognizer();
    if (!rec) return;
    rec.lang = navigator.language || "en-IN";
    rec.interimResults = false;
    rec.continuous = false;
    rec.onresult = (e) => {
      const transcript = Array.from({ length: e.results.length }, (_, i) => e.results[i][0].transcript).join(" ");
      setInput(transcript);
      void send(transcript);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  };

  return (
    <div className="flex h-[70vh] min-h-[480px] flex-col">
      <div className="flex items-center justify-between pb-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-mocha">Conversation</p>
        <ModeBadge mode={mode} />
      </div>
      <div role="log" aria-live="polite" aria-relevant="additions" className="flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.map((m, i) => (
          <div key={i} className={`rise flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] px-4 py-2.5 text-sm leading-relaxed ${m.role === "user" ? "bubble-user" : "bubble-bot"}`}>{m.content}</div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="bubble-bot px-4 py-3 typing" aria-label="Companion is typing">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button key={s} type="button" className="chip" onClick={() => send(s)} disabled={busy}>
            {s}
          </button>
        ))}
      </div>

      <form
        className="mt-3 flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
      >
        {voiceOk && (
          <button
            type="button"
            onClick={toggleVoice}
            aria-pressed={listening}
            aria-label={listening ? "Stop listening" : "Speak your order"}
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border transition ${listening ? "border-terracotta bg-terracotta text-white animate-pulse" : "border-espresso/15 bg-white text-espresso hover:bg-cream-2"}`}
          >
            {listening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
        )}
        <label className="flex-1">
          <span className="sr-only">Message</span>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={600}
            placeholder={listening ? "Listening..." : "Type your order or a question"}
            className="h-11 w-full rounded-full border border-espresso/15 bg-white px-4 text-sm"
            autoComplete="off"
          />
        </label>
        <button type="submit" disabled={busy || !input.trim()} aria-label="Send" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-espresso text-cream disabled:opacity-40">
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
