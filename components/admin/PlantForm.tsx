'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { upsertPlant, deactivatePlant } from '@/app/actions/admin';
import { MATERIAL_LABELS } from '@/lib/utils';

type PlantData = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  radiusKm: number;
  status: 'ACTIVE' | 'INACTIVE';
  materials: string[];
} | null;

export function PlantForm({ plant }: { plant: PlantData }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = await upsertPlant(plant?.id ?? null, formData);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          router.push('/admin/plants');
        });
      }}
      className="card max-w-xl space-y-4"
    >
      <div>
        <label className="field-label">Название</label>
        <input name="name" required defaultValue={plant?.name} className="field-input" />
      </div>
      <div>
        <label className="field-label">Адрес</label>
        <input name="address" required defaultValue={plant?.address} className="field-input" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="field-label">Широта</label>
          <input
            name="latitude"
            type="number"
            step="0.0001"
            required
            defaultValue={plant?.latitude ?? 55.7558}
            className="field-input"
          />
        </div>
        <div>
          <label className="field-label">Долгота</label>
          <input
            name="longitude"
            type="number"
            step="0.0001"
            required
            defaultValue={plant?.longitude ?? 37.6176}
            className="field-input"
          />
        </div>
      </div>
      <div>
        <label className="field-label">Телефон</label>
        <input name="phone" required defaultValue={plant?.phone} className="field-input" />
      </div>
      <div>
        <label className="field-label">Радиус работы, км</label>
        <input
          name="radiusKm"
          type="number"
          min={1}
          required
          defaultValue={plant?.radiusKm ?? 50}
          className="field-input"
        />
      </div>
      <div>
        <label className="field-label">Статус</label>
        <select name="status" defaultValue={plant?.status ?? 'ACTIVE'} className="field-input">
          <option value="ACTIVE">Активен</option>
          <option value="INACTIVE">Неактивен</option>
        </select>
      </div>
      <div>
        <p className="field-label">Доступные материалы</p>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(MATERIAL_LABELS).map(([value, label]) => (
            <label key={value} className="flex items-center gap-2 text-sm text-navy-700">
              <input
                type="checkbox"
                name="materials"
                value={value}
                defaultChecked={plant?.materials?.includes(value) ?? value === 'CONCRETE'}
                className="h-4 w-4 rounded border-surface-border"
              />
              {label}
            </label>
          ))}
        </div>
      </div>
      {error && <p className="field-error">{error}</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={isPending} className="btn-primary">
          {isPending ? 'Сохраняем…' : 'Сохранить'}
        </button>
        {plant && (
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await deactivatePlant(plant.id);
                router.push('/admin/plants');
              })
            }
            className="btn-secondary"
          >
            Деактивировать
          </button>
        )}
      </div>
    </form>
  );
}
