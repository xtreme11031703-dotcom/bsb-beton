'use client';

import { useState, useTransition } from 'react';
import { generateTelegramLinkCode } from '@/app/actions/telegram';
import { TELEGRAM_BOT_USERNAME } from '@/lib/telegram';

type Props = {
  initialLinked: boolean;
  initialCode: string | null;
};

export function TelegramLinkCard({ initialLinked, initialCode }: Props) {
  const [linked, setLinked] = useState(initialLinked);
  const [code, setCode] = useState(initialCode);
  const [pending, startTransition] = useTransition();

  if (linked) {
    return (
      <div className="card flex items-center gap-3 bg-surface-muted">
        <span className="text-xl">✅</span>
        <div>
          <p className="font-semibold text-navy-700">Telegram подключён</p>
          <p className="text-sm text-navy-500">Уведомления о заказах будут приходить в бот.</p>
        </div>
      </div>
    );
  }

  const botLink = TELEGRAM_BOT_USERNAME ? `https://t.me/${TELEGRAM_BOT_USERNAME}` : null;

  return (
    <div className="card bg-surface-muted">
      <p className="font-semibold text-navy-700">Подключить уведомления в Telegram</p>
      <p className="mt-1 text-sm text-navy-500">
        Сгенерируйте код, откройте бота{botLink ? ' ' : ' (ссылку добавим после запуска) '}
        {botLink && (
          <a href={botLink} target="_blank" rel="noreferrer" className="font-medium text-accent-600 underline">
            {TELEGRAM_BOT_USERNAME}
          </a>
        )}
        {' '}и отправьте команду <code className="rounded bg-white px-1 py-0.5">/link {code ?? 'КОД'}</code>.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        {code && (
          <span className="rounded-lg border border-surface-border bg-white px-4 py-2 font-mono text-lg font-bold tracking-widest text-navy-800">
            {code}
          </span>
        )}
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await generateTelegramLinkCode();
              if ('code' in result) setCode(result.code);
            })
          }
          className="btn-secondary !px-4 !py-2 text-sm"
        >
          {code ? 'Сгенерировать новый код' : 'Получить код'}
        </button>
      </div>
    </div>
  );
}
