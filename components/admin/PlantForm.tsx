'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { upsertPlant, deactivatePlant } from '@/app/actions/admin';
import { PRODUCT_CATEGORY_LABELS, ALL_PRODUCT_CATEGORIES } from '@/lib/catalog';
import YandexAddressMap from '@/components/YandexAddressMap';

type PlantData = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  radiusKm: number;
  status: 'ACTIVE' | 'INACTIVE';
  categories: string[];
} | null;

export function PlantForm({ plant }: { plant: PlantData }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Раньше координаты завода вводились только вручную, двумя number-полями
  // "Широта"/"Долгота" — то есть чтобы добавить реальный завод, нужно было
  // где-то отдельно узнать его координаты и аккуратно не перепутать местами
  // широту с долготой. Теперь это то же поле адреса с картой, что и на форме
  // заказа (components/YandexAddressMap): можно ввести адрес и нажать
  // «Найти» (если сервис геокодирования Яндекса доступен), а можно просто
  // перетащить точку на карте на нужное место — это работает даже если
  // геокодер недоступен, достаточно найти место на карте глазами. Числовые
  // поля ниже остаются как ручной fallback и синхронизированы с картой в
  // обе стороны.
  const [address, setAddress] = useState(plant?.address ?? '');
  const [latitude, setLatitude] = useState(plant?.latitude ?? 55.7558);
  const [longitude, setLongitude] = useState(plant?.longitude ?? 37.6176);

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
        <label className="field-label">Адрес и точка на карте</label>
        <input type="hidden" name="address" value={address} />
        <YandexAddressMap
          address={address}
          latitude={latitude}
          longitude={longitude}
          onAddressChange={setAddress}
          onChange={(lat, lng) => {
            setLatitude(lat);
            setLongitude(lng);
          }}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="field-label">Широта</label>
          <input
            name="latitude"
            type="number"
            step="0.0001"
            required
            value={latitude}
            onChange={(e) => setLatitude(Number(e.target.value))}
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
            value={longitude}
            onChange={(e) => setLongitude(Number(e.target.value))}
            className="field-input"
          />
        </div>
      </div>
      <p className="text-xs text-navy-400">
        Числовые поля широты/долготы выше — это то же место, что и точка на карте: можно
        поправить любое из них, второе подстроится само.
      </p>
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
        <p className="field-label">Доступные категории</p>
        <div className="grid grid-cols-2 gap-2">
          {ALL_PRODUCT_CATEGORIES.map((value) => (
            <label key={value} className="flex items-center gap-2 text-sm text-navy-700">
              <input
                type="checkbox"
                name="categories"
                value={value}
                defaultChecked={plant?.categories?.includes(value) ?? true}
                className="h-4 w-4 rounded border-surface-border"
              />
              {PRODUCT_CATEGORY_LABELS[value]}
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
