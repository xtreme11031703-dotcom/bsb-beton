'use server';

import { geocodeAddress, reverseGeocode } from '@/lib/yandex-geocoder';

// Обёртки над lib/yandex-geocoder.ts в виде server actions — вызываются из
// клиентского YandexAddressMap. Публичные (без проверки сессии): геокодирование
// текста адреса не раскрывает ничего чувствительного, это ровно то же самое,
// что доступно в поисковой строке самих Яндекс.Карт.

export type GeocodeActionResult =
  | { ok: true; latitude: number; longitude: number; address: string }
  | { ok: false; error: string };

export async function searchAddressAction(query: string): Promise<GeocodeActionResult> {
  try {
    const result = await geocodeAddress(query);
    if (!result) return { ok: false, error: 'Адрес не найден' };
    return { ok: true, latitude: result.latitude, longitude: result.longitude, address: result.address };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Не удалось найти адрес' };
  }
}

export async function reverseGeocodeAction(latitude: number, longitude: number): Promise<GeocodeActionResult> {
  try {
    const result = await reverseGeocode(latitude, longitude);
    if (!result) return { ok: false, error: 'Не удалось определить адрес по точке на карте' };
    return { ok: true, latitude: result.latitude, longitude: result.longitude, address: result.address };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Не удалось определить адрес' };
  }
}
