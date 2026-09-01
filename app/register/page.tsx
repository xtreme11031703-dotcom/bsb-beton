import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { RegisterForm } from './RegisterForm';

export default function RegisterPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto flex max-w-md flex-col px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-bold text-navy-800">Регистрация</h1>
        <p className="mt-1 text-sm text-navy-500">Создайте аккаунт клиента, чтобы оформлять заказы.</p>
        <div className="card mt-6">
          <RegisterForm />
        </div>
        <p className="mt-6 text-sm text-navy-500">
          Уже есть аккаунт?{' '}
          <Link href="/login" className="font-medium text-navy-700 underline">
            Войти
          </Link>
        </p>
      </main>
    </div>
  );
}
