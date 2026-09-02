import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getChatThread, setChatThreadStatus } from '@/app/actions/admin';
import { ChatReplyForm } from './ChatReplyForm';
import { AdminChatPoller } from './AdminChatPoller';

export default async function AdminChatDetailPage({ params }: { params: { id: string } }) {
  const thread = await getChatThread(params.id);
  if (!thread) notFound();

  const displayName = thread.visitorName || thread.client?.name || 'Гость с сайта';

  async function toggleStatus() {
    'use server';
    await setChatThreadStatus(params.id, thread!.status === 'OPEN' ? 'CLOSED' : 'OPEN');
  }

  return (
    <div>
      <Link href="/admin/chats" className="text-sm text-navy-500 hover:underline">
        ← Все диалоги
      </Link>

      <div className="card mt-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="font-semibold text-navy-800">{displayName}</h1>
            <p className="text-xs text-navy-400">
              Код для ответа из Telegram: <span className="font-mono font-semibold">{thread.shortCode}</span>
            </p>
          </div>
          <form action={toggleStatus}>
            <button
              type="submit"
              className="rounded-lg border border-surface-border px-3 py-1.5 text-xs font-medium text-navy-600 hover:bg-surface-muted"
            >
              {thread.status === 'OPEN' ? 'Закрыть диалог' : 'Открыть снова'}
            </button>
          </form>
        </div>

        <div className="mt-4 max-h-[28rem] space-y-2 overflow-y-auto">
          {thread.messages.length === 0 && <p className="text-sm text-navy-400">Сообщений пока нет.</p>}
          {thread.messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[75%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                m.sender === 'ADMIN' ? 'ml-auto bg-navy-800 text-white' : 'bg-surface-muted text-navy-800'
              }`}
            >
              {m.text}
            </div>
          ))}
        </div>

        <ChatReplyForm threadId={thread.id} />
      </div>

      <AdminChatPoller />
    </div>
  );
}
