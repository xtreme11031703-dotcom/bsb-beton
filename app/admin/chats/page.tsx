import Link from 'next/link';
import { listChatThreads } from '@/app/actions/admin';
import { chatDisplayName } from '@/lib/chat';

export default async function AdminChatsPage() {
  const threads = await listChatThreads();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-navy-800">Чат с сайта</h1>

      {threads.length === 0 ? (
        <div className="card text-center text-sm text-navy-400">Пока никто не писал.</div>
      ) : (
        <div className="space-y-2">
          {threads.map((thread) => {
            const last = thread.messages[0];
            const displayName = chatDisplayName(thread);
            return (
              <Link
                key={thread.id}
                href={`/admin/chats/${thread.id}`}
                className={`card card-hover flex items-center justify-between gap-4 ${
                  thread.adminUnread ? 'border-accent-500' : ''
                } ${thread.status === 'CLOSED' ? 'opacity-60' : ''}`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {thread.adminUnread && <span className="h-2 w-2 shrink-0 rounded-full bg-accent-500" />}
                    <span className="truncate font-semibold text-navy-800">{displayName}</span>
                    {thread.status === 'CLOSED' && (
                      <span className="shrink-0 text-xs text-navy-400">закрыт</span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-sm text-navy-500">{last ? last.text : '—'}</p>
                </div>
                <span className="shrink-0 text-xs text-navy-400">
                  {new Date(thread.lastMessageAt).toLocaleString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
