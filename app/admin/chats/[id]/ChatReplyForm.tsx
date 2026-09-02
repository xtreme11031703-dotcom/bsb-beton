'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { sendAdminReply } from '@/app/actions/admin';

export function ChatReplyForm({ threadId }: { threadId: string }) {
  const [text, setText] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function send() {
    const value = text.trim();
    if (!value) return;
    startTransition(async () => {
      await sendAdminReply(threadId, value);
      setText('');
      router.refresh();
    });
  }

  return (
    <div className="mt-4 flex gap-2 border-t border-surface-border pt-4">
      <input
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            send();
          }
        }}
        placeholder="Ваш ответ…"
        className="field-input min-w-0 flex-1"
      />
      <button
        type="button"
        onClick={send}
        disabled={isPending || !text.trim()}
        className="btn-primary shrink-0 !px-4 !py-2.5 text-sm"
      >
        Отправить
      </button>
    </div>
  );
}
