// Серверное геокодирование через HTTP Geocoder API Яндекса.
//
// Раньше геокодирование (поиск адреса на форме заказа) шло через клиентский
// `ymaps3.search({text})` из JS API v3. По документации самого Яндекса у
// этого метода "данные сильно урезаны по сравнению с отдельным API поиска" —
// то есть это упрощённый поиск объектов на карте, а не полноценный геокодер,
// и он не гарантирует ни точных координат по произвольному адресу, ни
// стабильного формата ответа. Отсюда и жалоба "кнопка «Найти» не работает,
// адрес не стыкуется" — метод либо ничего не находил, либо находил не то.
//
// HTTP Geocoder API — официальный, документированный способ превратить текст
// адреса в координаты и обратно. Это отдельный продукт от JS API карты: ключу
// нужен подключённый продукт "API Геокодера" в кабинете разработчика
// (developer.tech.yandex.ru) — можно тот же ключ, что и для карты, либо
// отдельный (тогда укажите его в YANDEX_GEOCODER_API_KEY). На практике 403
// "Invalid api key" здесь бывает по двум разным причинам, которые выглядят
// одинаково снаружи:
//   1) продукту "API Геокодера" у ключа правда не хватает прав;
//   2) ключ выпущен через текущий кабинет (продукт "API Геокодера" в общем
//      каталоге с чекбоксами), а запрос идёт на устаревший путь /1.x/ —
//      актуальный путь /v1/ (см. ниже и request.html в доках Яндекса).
// Если снова увидите "Invalid api key" при рабочем ключе — сначала проверьте
// версию пути в URL, а не права ключа.
const GEOCODER_API_KEY = process.env.YANDEX_GEOCODER_API_KEY || process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY;

export type GeocodeResult = {
  latitude: number;
  longitude: number;
  /** Нормализованный адрес, как его вернул Яндекс — может отличаться от
   * введённого текста (дополнен городом/областью и т.п.). */
  address: string;
  /** exact | number | near | range | street | other — см. документацию
   * Яндекса; используется только для диагностики, сейчас ни на что не влияет. */
  precision: string;
};

async function callGeocoder(geocodeParam: string, revalidateSeconds?: number): Promise<GeocodeResult | null> {
  if (!GEOCODER_API_KEY) {
    throw new Error(
      'Не задан YANDEX_GEOCODER_API_KEY (или NEXT_PUBLIC_YANDEX_MAPS_API_KEY) в переменных окружения сервера',
    );
  }

  const url = `https://geocode-maps.yandex.ru/v1/?apikey=${encodeURIComponent(GEOCODER_API_KEY)}&geocode=${encodeURIComponent(geocodeParam)}&format=json&lang=ru_RU&results=1`;

  // Адрес, который набирает пользователь при оформлении заказа, должен
  // геокодиться всегда заново (no-store). А вот статические адреса вроде
  // головного офиса на витринных страницах не меняются от запроса к запросу —
  // для них вызывающий код передаёт revalidateSeconds, чтобы не расходовать
  // квоту Яндекса на каждый заход на главную.
  const response = await fetch(
    url,
    revalidateSeconds ? { next: { revalidate: revalidateSeconds } } : { cache: 'no-store' },
  );

  if (response.status === 403) {
    throw new Error(
      'Яндекс отклонил запрос к Геокодеру (403, обычно "Invalid api key"). Проверьте по порядку: 1) у ключа в кабинете разработчика подключён продукт "API Геокодера"; 2) в настройках ключа нет ограничения по HTTP Referer, блокирующего серверные запросы (такое ограничение — только для браузерных JS-запросов); 3) запрос идёт на актуальный путь geocode-maps.yandex.ru/v1/, а не устаревший /1.x/.',
    );
  }

  if (!response.ok) {
    throw new Error(`Геокодер Яндекса вернул ошибку ${response.status}`);
  }

  const data = await response.json();
  const member = data?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject;
  if (!member) return null;

  const pos: string | undefined = member?.Point?.pos;
  if (!pos) return null;

  // Точка приходит строкой "долгота широта" (через пробел) — именно в таком
  // порядке, это не опечатка.
  const [lonStr, latStr] = pos.split(' ');
  const longitude = Number(lonStr);
  const latitude = Number(latStr);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  const meta = member?.metaDataProperty?.GeocoderMetaData;
  const address: string =
    meta?.Address?.formatted || meta?.text || [member?.name, member?.description].filter(Boolean).join(', ') || geocodeParam;

  return { latitude, longitude, address, precision: meta?.precision || 'unknown' };
}

/**
 * Прямое геокодирование: текст адреса → координаты + нормализованный адрес.
 * revalidateSeconds — если адрес статический (например, головной офис на
 * витринных страницах), передайте срок кеширования в секундах, чтобы не
 * дёргать Яндекс на каждый заход; по умолчанию запрос всегда свежий — так и
 * должно быть для адреса, который вводит пользователь в форме заказа.
 */
export async function geocodeAddress(query: string, revalidateSeconds?: number): Promise<GeocodeResult | null> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return null;
  return callGeocoder(trimmed, revalidateSeconds);
}

/**
 * Обратное геокодирование: координаты → текст адреса. Яндекс в этом режиме
 * ожидает "долгота,широта" через запятую без пробела — порядок аргументов
 * функции (latitude, longitude) специально оставлен привычным для остального
 * кода, порядок для Яндекса собирается внутри.
 */
export async function reverseGeocode(latitude: number, longitude: number): Promise<GeocodeResult | null> {
  return callGeocoder(`${longitude},${latitude}`);
}
