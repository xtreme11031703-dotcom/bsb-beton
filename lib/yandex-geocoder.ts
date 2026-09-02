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
// адреса в координаты и обратно. Он отдельный продукт от JS API карты: ключ,
// выпущенный только под "JavaScript API", может не иметь доступа к нему
// (Яндекс в этом случае отвечает 403) — см. throwOn403 ниже. Нужно, чтобы в
// кабинете разработчика Яндекса (developer.tech.yandex.ru) у ключа был
// подключён продукт "HTTP Геокодер" (можно тот же ключ, если оформлен как
// "JavaScript API и HTTP Геокодер", либо отдельный ключ — тогда укажите его
// в YANDEX_GEOCODER_API_KEY).
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

  const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${encodeURIComponent(GEOCODER_API_KEY)}&geocode=${encodeURIComponent(geocodeParam)}&format=json&lang=ru_RU&results=1`;

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
      'Яндекс отклонил запрос к Геокодеру (403) — у API-ключа не подключён продукт "HTTP Геокодер" в кабинете разработчика Яндекса (developer.tech.yandex.ru). Ключ только для JS-карты для этого не подходит.',
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
