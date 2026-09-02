'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { usePathname } from 'next/navigation';
import {
  getOrCreateThread,
  markThreadReadByVisitor,
  pollThread,
  sendVisitorMessage,
  type ChatMessageDTO,
} from '@/app/actions/chat';

// Живой чат-виджет — плавающая кнопка на всех страницах сайта (кроме
// админки и Mini App, там ему не место). "Живой" в рамках MVP означает
// поллинг, как и остальной реалтайм в проекте (см. OrderStatusPoller,
// PlantOrdersPoller) — без отдельной инфраструктуры вроде WebSocket.
export function ChatWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageDTO[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [text, setText] = useState('');
  const [isPending, startTransition] = useTransition();
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getOrCreateThread().then((data) => {
      setThreadId(data.threadId);
      setMessages(data.messages);
      setHasUnread(data.hasUnreadReply);
    });
  }, []);

  useEffect(() => {
    if (!threadId) return;
    const interval = setInterval(
      async () => {
        const data = await pollThread(threadId);
        if (data) {
          setMessages(data.messages);
          setHasUnread(data.hasUnreadReply);
        }
      },
      open ? 4000 : 20000,
    );
    return () => clearInterval(interval);
  }, [threadId, open]);

  useEffect(() => {
    if (open) listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, open]);

  useEffect(() => {
    if (open && threadId && hasUnread) {
      markThreadReadByVisitor(threadId);
      setHasUnread(false);
    }
  }, [open, threadId, hasUnread]);

  // Хуки должны отработать безусловно, поэтому решение "не рендерить"
  // виджет на этих разделах — после всех хуков.
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/miniapp')) return null;

  function handleSend() {
    const value = text.trim();
    if (!value || !threadId) return;
    setText('');
    setMessages((current) => [
      ...current,
      { id: `local-${Date.now()}`, sender: 'VISITOR', text: value, createdAt: new Date().toISOString() },
    ]);
    startTransition(async () => {
      await sendVisitorMessage(threadId, value);
      const data = await pollThread(threadId);
      if (data) setMessages(data.messages);
    });
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
      {open && (
        <div className="mb-3 flex h-[28rem] w-[22rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-surface-border bg-white shadow-lift">
          <div className="flex items-center justify-between bg-navy-800 px-4 py-3">
            <span className="text-sm font-semibold text-white">Онлайн-поддержка БСБ</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-white/70 hover:text-white"
              aria-label="Закрыть чат"
            >
              ✕
            </button>
          </div>

          <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto p-3">
            {messages.length === 0 && (
              <p className="mt-6 px-2 text-center text-sm text-navy-400">
                Здравствуйте! Задайте вопрос про бетон, доставку или заказ — ответим как можно скорее.
              </p>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                  m.sender === 'VISITOR' ? 'ml-auto bg-accent-500 text-white' : 'bg-surface-muted text-navy-800'
                }`}
              >
                {m.text}
              </div>
            ))}
          </div>

          <div className="flex gap-2 border-t border-surface-border p-3">
            <input
              value={text}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ваш вопрос…"
              className="field-input min-w-0 flex-1 !py-2 text-sm"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={isPending || !text.trim()}
              className="shrink-0 rounded-xl bg-accent-500 px-3.5 text-sm font-semibold text-white transition-colors hover:bg-accent-600 disabled:opacity-50"
              aria-label="Отправить"
            >
              →
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-navy-800 text-2xl text-white shadow-lift transition-transform hover:scale-105"
        aria-label="Чат с поддержкой"
      >
        {open ? '✕' : '💬'}
        {!open && hasUnread && (
          <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-red-500" />
        )}
      </button>
    </div>
  );
}
