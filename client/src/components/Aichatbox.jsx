import { useEffect, useRef, useState } from "react";
import {
  ArrowPathIcon,
  PaperAirplaneIcon,
  SparklesIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

// Static demo copy. Nothing here talks to an AI service — each canned reply
// matches what the storefront can already do today.

const SUGGESTIONS = [
  "Where is my order?",
  "What's your return policy?",
  "Help me choose a size",
  "Do you offer Cash on Delivery?",
];

const REPLIES = {
  order:
    "You can track every order from My orders in your account menu. Open an order to see its current status — processing, shipped, out for delivery or delivered — along with the items and payment details.\n\nIf something looks off, share the order ID and our support team can help.",
  returns:
    "Yes — delivered orders can be returned. Open My orders, pick the delivered order and choose the items and quantities you'd like to send back, then submit a return request.\n\nOnce the request is approved we'll arrange a pickup and refund the approved amount to your original payment method. Partial returns are supported too.",
  size:
    "Happy to help you find a fit! Every product page has a size guide with measurements for that piece.\n\nAs a rule of thumb: if you're between sizes, size up for a relaxed fit and size down for a slimmer fit. Customer fit notes in the reviews are handy too.",
  cod:
    "Yes, Cash on Delivery is available at checkout. The order is confirmed once the delivery partner collects the payment.\n\nYou can also pay online by card through our secure Stripe checkout.",
  shipping:
    "Delivery is free on orders over ₹1000. You'll see the estimated delivery window for your address at checkout, and you can follow progress from My orders.",
  payment:
    "We accept card payments through our secure Stripe checkout, as well as Cash on Delivery. The amount is only collected once your order is confirmed.",
  fallback:
    "I'm the demo version of Stylo's assistant, so I can only answer a few sample questions right now.\n\nTry asking about order tracking, returns, sizing, delivery or Cash on Delivery — or reach our team from the Contact page.",
};

// Order matters: more specific intents are matched first.
const getDemoReply = (text) => {
  const t = text.toLowerCase();
  if (/\bcod\b|cash on delivery/.test(t)) return REPLIES.cod;
  if (/return|refund|exchange/.test(t)) return REPLIES.returns;
  if (/size|sizing|fit|measurement/.test(t)) return REPLIES.size;
  if (/track|where.*order|order.*status|my order|order id/.test(t))
    return REPLIES.order;
  if (/deliver|shipping|ship/.test(t)) return REPLIES.shipping;
  if (/pay|payment|card|stripe/.test(t)) return REPLIES.payment;
  return REPLIES.fallback;
};

const formatTime = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

let messageId = 0;
const nextId = () => ++messageId;

const createGreeting = () => ({
  id: nextId(),
  role: "assistant",
  text: "Hi there 👋 I'm styloandco's AI shopping assistant. Ask me about your order, sizing, returns, delivery or payments — what can I help you with?",
  time: formatTime(),
});

const AssistantAvatar = () => (
  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm">
    <SparklesIcon aria-hidden="true" className="size-4" />
  </div>
);

const TypingDots = () => (
  <div className="flex items-start gap-2.5">
    <AssistantAvatar />
    <div className="rounded-2xl rounded-tl-sm border border-gray-200 bg-white px-4 py-3.5 shadow-sm">
      <span className="flex items-center gap-1" aria-label="Assistant is typing">
        <span className="size-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]" />
        <span className="size-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]" />
        <span className="size-1.5 animate-bounce rounded-full bg-gray-400" />
      </span>
    </div>
  </div>
);

const Aichatbox = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(() => [createGreeting()]);
  const [draft, setDraft] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const inputRef = useRef(null);
  const scrollRef = useRef(null);
  const replyTimer = useRef(null);

  // Focus the composer when the panel opens
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(timer);
  }, [open]);

  // Close with Escape while the panel is open
  useEffect(() => {
    if (!open) return;
    const handleEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open]);

  // Keep the latest message in view
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isTyping, open]);

  // Drop any pending mock reply on unmount
  useEffect(() => () => clearTimeout(replyTimer.current), []);

  const sendMessage = (rawText) => {
    const text = rawText.trim();
    if (!text || isTyping) return;

    setMessages((prev) => [
      ...prev,
      { id: nextId(), role: "user", text, time: formatTime() },
    ]);
    setDraft("");
    setIsTyping(true);

    replyTimer.current = setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: "assistant",
          text: getDemoReply(text),
          time: formatTime(),
        },
      ]);
      setIsTyping(false);
    }, 1100);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage(draft);
  };

  const resetChat = () => {
    clearTimeout(replyTimer.current);
    setIsTyping(false);
    setDraft("");
    setMessages([createGreeting()]);
    inputRef.current?.focus();
  };

  const showSuggestions = messages.length === 1;

  return (
    <>
      {open && (
        <div
          id="ai-chat-panel"
          role="dialog"
          aria-labelledby="ai-chat-title"
          className="fixed inset-x-4 bottom-24 z-30 flex h-[min(72vh,560px)] animate-chat-pop flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-gray-900/20 motion-reduce:animate-none sm:inset-x-auto sm:right-6 sm:w-[380px]"
        >
          {/* Header */}
          <div className="relative overflow-hidden bg-linear-to-br from-indigo-600 via-indigo-600 to-violet-600 px-4 py-4 text-white">
            <div
              aria-hidden="true"
              className="absolute -top-10 -right-8 size-28 rounded-full bg-white/10"
            />
            <div
              aria-hidden="true"
              className="absolute -bottom-12 -left-6 size-24 rounded-full bg-white/5"
            />
            <div className="relative flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25">
                <SparklesIcon aria-hidden="true" className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2
                    id="ai-chat-title"
                    className="truncate text-sm font-semibold"
                  >
                    styloandco Assistant
                  </h2>
                  <span className="rounded-full bg-white/15 px-1.5 py-0.5 text-[10px] font-medium tracking-wide uppercase">
                    Demo
                  </span>
                </div>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-indigo-100">
                  <span className="size-1.5 rounded-full bg-emerald-300" />
                  AI shopping helper · online
                </p>
              </div>
              <button
                type="button"
                onClick={resetChat}
                title="Start a new chat"
                className="rounded-full p-1.5 text-indigo-100 transition hover:bg-white/15 hover:text-white"
              >
                <span className="sr-only">Start a new chat</span>
                <ArrowPathIcon aria-hidden="true" className="size-5" />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                title="Close assistant"
                className="rounded-full p-1.5 text-indigo-100 transition hover:bg-white/15 hover:text-white"
              >
                <span className="sr-only">Close assistant</span>
                <XMarkIcon aria-hidden="true" className="size-5" />
              </button>
            </div>
          </div>

          {/* Conversation */}
          <div
            ref={scrollRef}
            role="log"
            aria-live="polite"
            className="flex-1 space-y-3 overflow-y-auto bg-gray-50 px-4 py-4"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex animate-chat-rise motion-reduce:animate-none ${
                  message.role === "user"
                    ? "justify-end"
                    : "items-start gap-2.5"
                }`}
              >
                {message.role === "assistant" && <AssistantAvatar />}
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line shadow-sm ${
                    message.role === "user"
                      ? "rounded-br-sm bg-indigo-600 text-white"
                      : "rounded-tl-sm border border-gray-200 bg-white text-gray-700"
                  }`}
                >
                  {message.text}
                  <p
                    className={`mt-1 text-[10px] ${
                      message.role === "user"
                        ? "text-right text-indigo-200"
                        : "text-gray-400"
                    }`}
                  >
                    {message.time}
                  </p>
                </div>
              </div>
            ))}

            {showSuggestions && (
              <div className="animate-chat-rise pl-9 motion-reduce:animate-none">
                <p className="text-[10px] font-medium tracking-wide text-gray-400 uppercase">
                  Try asking
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => sendMessage(suggestion)}
                      className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isTyping && <TypingDots />}
          </div>

          {/* Composer */}
          <div className="border-t border-gray-200 bg-white p-3">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Ask about orders, sizing, returns…"
                aria-label="Message the styloandco assistant"
                className="h-10 min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
              <button
                type="submit"
                disabled={!draft.trim() || isTyping}
                className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="sr-only">Send message</span>
                <PaperAirplaneIcon aria-hidden="true" className="size-5" />
              </button>
            </form>
            <p className="mt-2 text-center text-[10px] leading-relaxed text-gray-400">
              Demo mode — replies are simulated and not connected to an AI
              service yet.
            </p>
          </div>
        </div>
      )}

      {/* Launcher */}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="ai-chat-panel"
        className="fixed right-4 bottom-5 z-30 flex items-center gap-2 rounded-full bg-indigo-600 py-3 pr-5 pl-4 text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:right-6"
      >
        {open ? (
          <XMarkIcon aria-hidden="true" className="size-5" />
        ) : (
          <SparklesIcon aria-hidden="true" className="size-5" />
        )}
        <span className="text-sm font-semibold">
          {open ? "Close" : "Ask styloandco"}
        </span>
      </button>
    </>
  );
};

export default Aichatbox;
