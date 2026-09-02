'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateSiteSettings } from '@/app/actions/site-settings';
import type { SiteSettingsData } from '@/lib/site-settings';

type FaqRow = { question: string; answer: string };

export function SiteSettingsForm({ initial }: { initial: SiteSettingsData }) {
  const [faq, setFaq] = useState<FaqRow[]>(initial.faq);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function updateFaqRow(index: number, field: keyof FaqRow, value: string) {
    setSuccess(false);
    setFaq((rows) => rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  }

  function addFaqRow() {
    setSuccess(false);
    setFaq((rows) => [...rows, { question: '', answer: '' }]);
  }

  function removeFaqRow(index: number) {
    setSuccess(false);
    setFaq((rows) => rows.filter((_, i) => i !== index));
  }

  return (
    <form
      action={(formData) => {
        setError(null);
        setSuccess(false);
        formData.set('faq', JSON.stringify(faq));
        startTransition(async () => {
          const result = await updateSiteSettings(formData);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          setSuccess(true);
          router.refresh();
        });
      }}
      className="space-y-6 pb-10"
    >
      <div className="card space-y-4">
        <h2 className="font-semibold text-navy-800">Контакты и часы работы</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label">Телефон (как отображается на сайте)</label>
            <input
              name="phone"
              required
              defaultValue={initial.phone}
              placeholder="+7 495 085-66-06"
              className="field-input"
            />
          </div>
          <div>
            <label className="field-label">Телефон для звонка (ссылка)</label>
            <input
              name="phoneHref"
              required
              defaultValue={initial.phoneHref}
              placeholder="tel:+74950856606"
              className="field-input font-mono text-sm"
            />
            <p className="mt-1 text-xs text-navy-400">Формат: tel:+74950856606, без пробелов и скобок.</p>
          </div>
          <div>
            <label className="field-label">Email</label>
            <input name="email" type="email" required defaultValue={initial.email} className="field-input" />
          </div>
          <div>
            <label className="field-label">Часы работы</label>
            <input
              name="workHours"
              required
              defaultValue={initial.workHours}
              placeholder="Ежедневно, 6:00–22:00"
              className="field-input"
            />
          </div>
        </div>
      </div>

      <div className="card space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-semibold text-navy-800">Вопросы и ответы</h2>
          <button
            type="button"
            onClick={addFaqRow}
            className="shrink-0 rounded-lg border border-surface-border px-3 py-1.5 text-sm font-medium text-navy-600 hover:bg-surface-muted"
          >
            + Добавить вопрос
          </button>
        </div>
        <p className="text-xs text-navy-400">
          Отображаются на странице «Вопрос-ответ». Первые несколько пунктов также использует
          автоматический бот в чате поддержки — их лучше не удалять, а редактировать текст ответа.
        </p>

        {faq.length === 0 && <p className="text-sm text-navy-400">Пока нет ни одного вопроса.</p>}

        <div className="space-y-4">
          {faq.map((row, i) => (
            <div key={i} className="rounded-xl border border-surface-border p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-navy-400">Вопрос {i + 1}</span>
                <button
                  type="button"
                  onClick={() => removeFaqRow(i)}
                  className="text-xs font-medium text-red-600 hover:underline"
                >
                  Удалить
                </button>
              </div>
              <input
                value={row.question}
                onChange={(e) => updateFaqRow(i, 'question', e.target.value)}
                placeholder="Вопрос"
                className="field-input mb-2"
              />
              <textarea
                value={row.answer}
                onChange={(e) => updateFaqRow(i, 'answer', e.target.value)}
                placeholder="Ответ"
                rows={2}
                className="field-input"
              />
            </div>
          ))}
        </div>
      </div>

      {error && <p className="field-error">{error}</p>}
      {success && !error && <p className="text-sm font-medium text-green-600">Сохранено.</p>}

      <button type="submit" disabled={isPending} className="btn-primary">
        {isPending ? 'Сохраняем…' : 'Сохранить'}
      </button>
    </form>
  );
}
