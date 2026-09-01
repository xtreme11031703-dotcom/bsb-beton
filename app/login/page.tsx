import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { LoginForm } from './LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto flex max-w-md flex-col px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-bold text-navy-800">Вход</h1>
        <p className="mt-1 text-sm text-navy-500">
          Войдите, чтобы оформить заказ или продолжить работу.
        </p>
        <div className="card mt-6">
          <LoginForm />
        </div>
        <p className="mt-6 text-sm text-navy-500">
          Ещё нет аккаунта?{' '}
          <Link href="/register" className="font-medium text-navy-700 underline">
            Зарегистрироваться
          </Link>
        </p>
        <div className="mt-8 rounded-xl border border-dashed border-surface-border p-4 text-xs text-navy-400">
          <p className="font-medium text-navy-500">Тестовые аккаунты (demo)</p>
          <p className="mt-1">Админ: admin@bsb.test / Admin123!</p>
          <p>Завод: plant1@bsb.test / Plant123!</p>
          <p>Клиент: client@bsb.test / Client123!</p>
        </div>
      </main>
    </div>
  );
}
