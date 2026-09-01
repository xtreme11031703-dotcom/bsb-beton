'use client';

import { useState, useTransition } from 'react';
import { login } from '@/app/actions/auth';

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = await login(formData);
          if (result && !result.ok) setError(result.error);
        });
      }}
      className="space-y-4"
    >
      <div>
        <label className="field-label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="field-input"
          placeholder="you@example.com"
        />
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
          autoComplete="current-password"
          className="field-input"
        />
      </div>
      {error && <p className="field-error">{error}</p>}
      <button type="submit" disabled={isPending} className="btn-primary w-full">
        {isPending ? 'Входим…' : 'Войти'}
      </button>
    </form>
  );
}
