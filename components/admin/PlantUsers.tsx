'use client';

import { useState, useTransition } from 'react';
import { createPlantUser, resetPlantUserPassword } from '@/app/actions/admin';

type PlantUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt: Date;
};

// Простой генератор пароля для нового логина завода — не обязателен
// (можно ввести и свой), но избавляет от необходимости придумывать пароль
// на месте. Не претендует на криптостойкость выше необходимого для
// внутреннего рабочего аккаунта.
function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export function PlantUsers({ plantId, users }: { plantId: string; users: PlantUser[] }) {
  return (
    <div className="card max-w-xl space-y-5">
      <div>
        <h2 className="font-semibold text-navy-800">Логины сотрудников завода</h2>
        <p className="mt-1 text-sm text-navy-500">
          Под этими логинами сотрудники завода заходят на <code>/plant</code> — видят заявки и
          принимают заказы. Регистрация на сайте создаёт только аккаунты клиентов, поэтому
          логин для завода заводится здесь.
        </p>
      </div>

      {users.length > 0 && (
        <ul className="space-y-2">
          {users.map((u) => (
            <PlantUserRow key={u.id} user={u} />
          ))}
        </ul>
      )}

      <NewPlantUserForm plantId={plantId} />
    </div>
  );
}

function PlantUserRow({ user }: { user: PlantUser }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <li className="rounded-xl border border-surface-border p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-navy-700">{user.name}</p>
          <p className="truncate text-xs text-navy-500">{user.email}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setOpen((v) => !v);
            setDone(false);
            setError(null);
            setPassword(generatePassword());
          }}
          className="btn-secondary shrink-0 !px-3 !py-1.5 text-xs"
        >
          Сбросить пароль
        </button>
      </div>

      {open && (
        <div className="mt-3 space-y-2 border-t border-surface-border pt-3">
          <div className="flex gap-2">
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field-input min-w-0 flex-1 font-mono text-sm"
            />
            <button
              type="button"
              onClick={() => setPassword(generatePassword())}
              className="btn-secondary shrink-0 !px-3 text-xs"
            >
              Сгенерировать
            </button>
          </div>
          {error && <p className="field-error">{error}</p>}
          {done ? (
            <p className="text-sm font-medium text-green-600">
              Новый пароль сохранён — сообщите его сотруднику, повторно он нигде не показывается.
            </p>
          ) : (
            <button
              type="button"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  setError(null);
                  const fd = new FormData();
                  fd.set('password', password);
                  const result = await resetPlantUserPassword(user.id, fd);
                  if (!result.ok) {
                    setError(result.error);
                    return;
                  }
                  setDone(true);
                })
              }
              className="btn-primary !px-4 !py-2 text-sm"
            >
              {isPending ? 'Сохраняем…' : 'Сохранить новый пароль'}
            </button>
          )}
        </div>
      )}
    </li>
  );
}

function NewPlantUserForm({ plantId }: { plantId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [password, setPassword] = useState(() => generatePassword());

  if (created) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm">
        <p className="font-medium text-green-700">Логин создан</p>
        <p className="mt-1 text-navy-600">
          Email: <span className="font-mono">{created.email}</span>
          <br />
          Пароль: <span className="font-mono">{created.password}</span>
        </p>
        <p className="mt-1 text-xs text-navy-400">
          Сохраните пароль сейчас и передайте сотруднику — второй раз он нигде не показывается
          (только сброс на новый).
        </p>
        <button
          type="button"
          onClick={() => setCreated(null)}
          className="btn-secondary mt-3 !px-3 !py-1.5 text-xs"
        >
          Добавить ещё логин
        </button>
      </div>
    );
  }

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = await createPlantUser(plantId, formData);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          setCreated({ email: String(formData.get('email')), password: String(formData.get('password')) });
        });
      }}
      className="space-y-3 border-t border-surface-border pt-4"
    >
      <p className="field-label">Новый логин</p>
      <input name="name" required placeholder="Имя сотрудника" className="field-input" />
      <input name="email" type="email" required placeholder="email для входа" className="field-input" />
      <input name="phone" placeholder="Телефон (необязательно)" className="field-input" />
      <div className="flex gap-2">
        <input
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="field-input min-w-0 flex-1 font-mono text-sm"
        />
        <button
          type="button"
          onClick={() => setPassword(generatePassword())}
          className="btn-secondary shrink-0 !px-3 text-xs"
        >
          Сгенерировать
        </button>
      </div>
      {error && <p className="field-error">{error}</p>}
      <button type="submit" disabled={isPending} className="btn-primary !px-4 !py-2 text-sm">
        {isPending ? 'Создаём…' : 'Создать логин'}
      </button>
    </form>
  );
}
