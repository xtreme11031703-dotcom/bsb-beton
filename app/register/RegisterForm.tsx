'use client';

import { useState, useTransition } from 'react';
import { registerClient } from '@/app/actions/auth';

export function RegisterForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = await registerClient(formData);
          if (result && !result.ok) setError(result.error);
        });
      }}
      className="space-y-4"
    >
      <div>
        <label className="field-label" htmlFor="name">
          Имя
        </label>
        <input id="name" name="name" required className="field-input" placeholder="Иван Иванов" />
      </div>
      <div>
        <label className="field-label" htmlFor="phone">
          Телефон
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          required
          className="field-input"
          placeholder="+7 900 000-00-00"
        />
      </div>
      <div>
        <label className="field-label" htmlFor="email">
          Email
        </label>
        <input id="email" name="email" type="email" required className="field-input" placeholder="you@example.com" />
      </div>
      <div>
        <label className="field-label" htmlFor="password">
          Пароль
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          className="field-input"
        />
      </div>
      {error && <p className="field-error">{error}</p>}
      <button type="submit" disabled={isPending} className="btn-primary w-full">
        {isPending ? 'Создаём аккаунт…' : 'Зарегистрироваться'}
      </button>
    </form>
  );
}
