'use client';

import { useEffect, useRef, useState } from 'react';

type PlantOnMap = {
id: string;
name: string;
latitude: number;
longitude: number;
};

type YandexAddressMapProps = {
address: string;
latitude: number;
longitude: number;
onAddressChange: (address: string) => void;
onChange: (latitude: number, longitude: number) => void;
plants?: PlantOnMap[];
};

export default function YandexAddressMap({
address,
latitude,
longitude,
onAddressChange,
onChange,
plants = [],
}: YandexAddressMapProps) {
const mapRef = useRef<HTMLDivElement>(null);
const mapInstanceRef = useRef<any>(null);
const deliveryMarkerRef = useRef<any>(null);
const plantsMarkersRef = useRef<any[]>([]);
const onChangeRef = useRef(onChange);
const [searching, setSearching] = useState(false);
const [searchError, setSearchError] = useState<string | null>(null);

useEffect(() => {
onChangeRef.current = onChange;
}, [onChange]);

useEffect(() => {
let cancelled = false;
async function waitForYmaps() {
  for (let i = 0; i < 100; i++) {
    if ((window as any).ymaps3) {
      return (window as any).ymaps3;
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error('Яндекс Карты не загрузились');
}

async function initMap() {
  try {
    const ymaps3 = await waitForYmaps();

    await ymaps3.ready;

    if (cancelled || !mapRef.current) {
      return;
    }

    const {
      YMap,
      YMapDefaultSchemeLayer,
      YMapDefaultFeaturesLayer,
      YMapMarker,
    } = ymaps3;

    const center = [longitude, latitude];

    const map = new YMap(mapRef.current, {
      location: {
        center,
        zoom: 12,
      },
    });

    map.addChild(new YMapDefaultSchemeLayer());
    map.addChild(new YMapDefaultFeaturesLayer());

    /*
     * ТОЧКА ДОСТАВКИ
     *
     * Пользователь может перетаскивать её.
     */
    const deliveryElement = document.createElement('div');

    deliveryElement.style.width = '30px';
    deliveryElement.style.height = '30px';
    deliveryElement.style.borderRadius = '50%';
    deliveryElement.style.background = '#f97316';
    deliveryElement.style.border = '4px solid white';
    deliveryElement.style.boxShadow =
      '0 2px 10px rgba(0,0,0,.35)';
    deliveryElement.style.cursor = 'grab';
    deliveryElement.style.transform =
      'translate(-50%, -50%)';

    const deliveryMarker = new YMapMarker(
      {
        coordinates: center,
        draggable: true,
        mapFollowsOnDrag: true,
      },
      deliveryElement
    );

    map.addChild(deliveryMarker);

    /*
     * Заводы.
     *
     * Никаких телефонов, адресов и других контактных данных.
     */
    const plantMarkers: any[] = [];

    for (const plant of plants) {
      const plantElement = document.createElement('div');

      plantElement.style.width = '18px';
      plantElement.style.height = '18px';
      plantElement.style.borderRadius = '50%';
      plantElement.style.background = '#172554';
      plantElement.style.border = '3px solid white';
      plantElement.style.boxShadow =
        '0 2px 6px rgba(0,0,0,.3)';
      plantElement.style.transform =
        'translate(-50%, -50%)';
      plantElement.style.cursor = 'default';

      const plantMarker = new YMapMarker(
        {
          coordinates: [
            plant.longitude,
            plant.latitude,
          ],
        },
        plantElement
      );

      map.addChild(plantMarker);
      plantMarkers.push(plantMarker);
    }

    mapInstanceRef.current = map;
    deliveryMarkerRef.current = deliveryMarker;
    plantsMarkersRef.current = plantMarkers;

    /*
     * События карты.
     *
     * После окончания перетаскивания точки
     * пытаемся получить её актуальные координаты.
     */
    deliveryElement.addEventListener(
      'pointerdown',
      () => {
        deliveryElement.style.cursor = 'grabbing';
      }
    );

    deliveryElement.addEventListener(
      'pointerup',
      () => {
        deliveryElement.style.cursor = 'grab';

        const markerCoordinates =
          deliveryMarker.coordinates;

        if (
          Array.isArray(markerCoordinates) &&
          markerCoordinates.length >= 2
        ) {
          const [newLongitude, newLatitude] =
            markerCoordinates;

          onChangeRef.current(
            Number(newLatitude),
            Number(newLongitude)
          );
        }
      }
    );

    console.log('Карта доставки загружена');
  } catch (error) {
    console.error(
      'Ошибка инициализации карты:',
      error
    );
  }
}

initMap();

return () => {
  cancelled = true;

  if (mapInstanceRef.current) {
    mapInstanceRef.current.destroy();
    mapInstanceRef.current = null;
  }

  deliveryMarkerRef.current = null;
  plantsMarkersRef.current = [];
};

}, []);

/*

* Если координаты пришли извне —
* двигаем точку доставки.
  */
  useEffect(() => {
  if (!deliveryMarkerRef.current) {
  return;
  }

deliveryMarkerRef.current.update({

  coordinates: [longitude, latitude],
});

}, [latitude, longitude]);

/*

* Поиск адреса.
*
* ВАЖНО:
* используем ymaps3.search.
* Если ключ не имеет доступа к геокодированию,
* Яндекс может вернуть 403.
  */
  async function searchAddress() {
  const query = address.trim();

if (query.length < 3) {

  setSearchError('Введите адрес');
  return;
}

setSearching(true);
setSearchError(null);

try {
  const ymaps3 = (window as any).ymaps3;

  if (!ymaps3) {
    throw new Error(
      'Яндекс Карты ещё не загрузились'
    );
  }

  await ymaps3.ready;

  const result = await ymaps3.search({
    text: query,
    limit: 1,
  });

  if (!result || result.length === 0) {
    setSearchError('Адрес не найден');
    return;
  }

  const first = result[0];

  const coordinates =
    first?.geometry?.coordinates;

  if (
    !Array.isArray(coordinates) ||
    coordinates.length < 2
  ) {
    setSearchError(
      'Не удалось получить координаты адреса'
    );
    return;
  }

  const [
    newLongitude,
    newLatitude,
  ] = coordinates;

  /*
   * Обновляем адрес и координаты
   * в OrderWizard.
   */
  onChangeRef.current(
    Number(newLatitude),
    Number(newLongitude)
  );

  if (deliveryMarkerRef.current) {
    deliveryMarkerRef.current.update({
      coordinates: [
        newLongitude,
        newLatitude,
      ],
    });
  }

  if (mapInstanceRef.current) {
    mapInstanceRef.current.setLocation({
      center: [
        newLongitude,
        newLatitude,
      ],
      zoom: 16,
      duration: 500,
    });
  }

  const foundAddress =
    first?.properties?.name ||
    first?.properties?.description;

  if (foundAddress) {
    onAddressChange(foundAddress);
  }
} catch (error) {
  console.error(
    'Ошибка геокодера:',
    error
  );

  setSearchError(
    error instanceof Error
      ? error.message
      : 'Не удалось найти адрес'
  );
} finally {
  setSearching(false);
}
}

function handleKeyDown(
event: React.KeyboardEvent<HTMLInputElement>
) {
if (event.key === 'Enter') {
event.preventDefault();
searchAddress();
}
}

return ( <div className="space-y-3"> <div className="flex gap-2">
<input
type="text"
value={address}
onChange={(event) => {
onAddressChange(event.target.value);
setSearchError(null);
}}
onKeyDown={handleKeyDown}
placeholder="Москва, ул. Примерная, 10"
className="field-input min-w-0 flex-1"
/>
    <button
      type="button"
      onClick={searchAddress}
      disabled={searching}
      className="shrink-0 rounded-xl bg-accent-500 px-4 text-sm font-semibold text-white hover:bg-accent-600 disabled:opacity-50"
    >
      {searching ? 'Поиск…' : 'Найти'}
    </button>
  </div>

  {searchError && (
    <p className="text-sm text-red-500">
      {searchError}
    </p>
  )}

  <div className="overflow-hidden rounded-xl border border-surface-border">
    <div
      ref={mapRef}
      className="h-64 w-full"
    />
  </div>

  <p className="text-xs text-navy-400">
    Введите адрес и нажмите «Найти». Точку доставки
    также можно перемещать вручную.
  </p>
</div>
);
}
