'use client';

import { useState, useTransition } from 'react';
import { updateClient, resetClientPassword } from '@/app/actions/admin';

type ClientData = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
};

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export function ClientForm({ client }: { client: ClientData }) {
  return (
    <div className="space-y-6">
      <ProfileCard client={client} />
      <PasswordCard clientId={client.id} />
    </div>
  );
}

function ProfileCard({ client }: { client: ClientData }) {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => {
        setError(null);
        setSaved(false);
        startTransition(async () => {
          const result = await updateClient(client.id, formData);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          setSaved(true);
        });
      }}
      className="card max-w-xl space-y-4"
    >
      <h2 className="font-semibold text-navy-800">Данные клиента</h2>
      <div>
        <label className="field-label">Имя</label>
        <input name="name" required defaultValue={client.name} className="field-input" />
      </div>
      <div>
        <label className="field-label">Email</label>
        <input name="email" type="email" required defaultValue={client.email} className="field-input" />
      </div>
      <div>
        <label className="field-label">Телефон</label>
        <input name="phone" defaultValue={client.phone ?? ''} className="field-input" />
      </div>
      {error && <p className="field-error">{error}</p>}
      {saved && <p className="text-sm font-medium text-green-600">Сохранено</p>}
      <button type="submit" disabled={isPending} className="btn-primary">
        {isPending ? 'Сохраняем…' : 'Сохранить'}
      </button>
    </form>
  );
}

function PasswordCard({ clientId }: { clientId: string }) {
  const [password, setPassword] = useState(() => generatePassword());
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="card max-w-xl space-y-3">
      <h2 className="font-semibold text-navy-800">Сброс пароля</h2>
      <p className="text-sm text-navy-500">
        Если клиент потерял доступ к аккаунту — задайте новый пароль здесь и сообщите ему лично.
      </p>
      <div className="flex gap-2">
        <input
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setDone(false);
          }}
          className="field-input min-w-0 flex-1 font-mono text-sm"
        />
        <button
          type="button"
          onClick={() => {
            setPassword(generatePassword());
            setDone(false);
          }}
          className="btn-secondary shrink-0 !px-3 text-xs"
        >
          Сгенерировать
        </button>
      </div>
      {error && <p className="field-error">{error}</p>}
      {done ? (
        <p className="text-sm font-medium text-green-600">
          Пароль обновлён — сообщите его клиенту, повторно он нигде не показывается.
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
              const result = await resetClientPassword(clientId, fd);
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
  );
}
