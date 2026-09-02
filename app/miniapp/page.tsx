'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { authenticateMiniApp } from '@/app/actions/telegram';
import { Logo } from '@/components/Logo';
import { TELEGRAM_BOT_USERNAME } from '@/lib/telegram';

// Точка входа в Telegram Mini App. Открывается внутри Telegram (кнопка меню бота
// или web_app-кнопка в сообщении), сама логинит пользователя по подписанным
// данным Telegram (initData) и перенаправляет в обычный личный кабинет сайта —
// отдельный интерфейс для Mini App не нужен, переиспользуем весь сайт.

type WebApp = {
  initData: string;
  ready: () => void;
  expand: () => void;
  themeParams?: { bg_color?: string };
};

declare global {
  interface Window {
    Telegram?: { WebApp?: WebApp };
  }
}

export default function MiniAppPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'not-telegram' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Скрипт грузится через next/script (см. onReady ниже) — здесь только
    // подстраховка на случай, если он уже был закэширован и onLoad не выстрелит.
    const timeout = setTimeout(() => tryAuth(), 1500);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function tryAuth() {
    const webApp = window.Telegram?.WebApp;
    if (!webApp?.initData) {
      setStatus('not-telegram');
      return;
    }

    webApp.ready();
    webApp.expand();

    const result = await authenticateMiniApp(webApp.initData);
    if (!result.ok) {
      setStatus('error');
      setError(result.error);
      return;
    }

    if (result.role === 'PLANT') router.replace('/plant');
    else if (result.role === 'ADMIN') router.replace('/admin');
    else router.replace('/order/new');
  }

  return (
    <>
      <Script src="https://telegram.org/js/telegram-web-app.js" strategy="afterInteractive" onLoad={tryAuth} />

      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-6 text-center">
        <Logo />

        {status === 'loading' && <p className="text-sm text-navy-400">Открываем приложение…</p>}

        {status === 'not-telegram' && (
          <div className="max-w-sm">
            <p className="text-sm text-navy-500">
              Эта страница открывается внутри Telegram — из бота{' '}
              {TELEGRAM_BOT_USERNAME ? (
                <a href={`https://t.me/${TELEGRAM_BOT_USERNAME}`} className="font-medium text-accent-600 underline">
                  @{TELEGRAM_BOT_USERNAME}
                </a>
              ) : (
                'БСБ'
              )}
              . Откройте бота и нажмите кнопку меню, чтобы попасть сюда.
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="max-w-sm">
            <p className="text-sm text-red-600">Не удалось войти: {error}</p>
            <button onClick={tryAuth} className="btn-secondary mt-3 !px-4 !py-2 text-sm">
              Попробовать снова
            </button>
          </div>
        )}
      </div>
    </>
  );
}
