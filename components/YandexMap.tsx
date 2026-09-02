'use client';

import { useEffect, useRef } from 'react';

export type YandexMapPlant = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  status: 'ACTIVE' | 'INACTIVE';
};

export type YandexMapHeadOffice = {
  name: string;
  latitude: number;
  longitude: number;
};

type YandexMapProps = {
  plants?: YandexMapPlant[];
  headOffice?: YandexMapHeadOffice | null;
};

export default function YandexMap({ plants = [], headOffice = null }: YandexMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      try {
        // Ждём загрузки API Яндекс.Карт
        let attempts = 0;

        while (!(window as any).ymaps3 && attempts < 100) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          attempts++;
        }

        const ymaps3 = (window as any).ymaps3;

        if (!ymaps3) {
          console.error('Яндекс.Карты не загрузились');
          return;
        }

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

        const activePlants = plants.filter(
          (plant) =>
            plant.status === 'ACTIVE' &&
            Number.isFinite(plant.latitude) &&
            Number.isFinite(plant.longitude)
        );

        const hasHeadOffice =
          !!headOffice &&
          Number.isFinite(headOffice.latitude) &&
          Number.isFinite(headOffice.longitude);

        // Все точки, которые должны попасть в поле зрения карты — заводы и,
        // если есть, головной офис (иначе при большом разбросе заводов офис
        // мог оказаться за пределами видимой области).
        const boundsPoints = [
          ...activePlants.map((p) => ({ longitude: p.longitude, latitude: p.latitude })),
          ...(hasHeadOffice ? [{ longitude: headOffice!.longitude, latitude: headOffice!.latitude }] : []),
        ];

        // Если есть точки — центрируем карту по ним. Если нет — Москва.
        let center: [number, number] = [37.6176, 55.7558];
        let zoom = 9;

        if (boundsPoints.length === 1) {
          center = [
            boundsPoints[0].longitude,
            boundsPoints[0].latitude,
          ];
          zoom = 11;
        }

        if (boundsPoints.length > 1) {
          const lngs = boundsPoints.map((p) => p.longitude);
          const lats = boundsPoints.map((p) => p.latitude);

          const minLng = Math.min(...lngs);
          const maxLng = Math.max(...lngs);
          const minLat = Math.min(...lats);
          const maxLat = Math.max(...lats);

          center = [
            (minLng + maxLng) / 2,
            (minLat + maxLat) / 2,
          ];

          const maxDistance = Math.max(
            maxLng - minLng,
            maxLat - minLat
          );

          if (maxDistance > 1) {
            zoom = 8;
          } else if (maxDistance > 0.5) {
            zoom = 9;
          } else if (maxDistance > 0.2) {
            zoom = 10;
          } else {
            zoom = 11;
          }
        }

        const map = new YMap(mapRef.current, {
          location: {
            center,
            zoom,
          },
        });

        map.addChild(new YMapDefaultSchemeLayer());
        map.addChild(new YMapDefaultFeaturesLayer());

        /*
         * Заводы.
         *
         * Показываем только:
         * - название завода
         * - статус визуально
         *
         * Телефон, адрес и другие контактные данные
         * на карте НЕ показываем.
         */
        activePlants.forEach((plant) => {
          const markerElement = document.createElement('div');

          markerElement.style.width = '18px';
          markerElement.style.height = '18px';
          markerElement.style.borderRadius = '50%';
          markerElement.style.backgroundColor = '#16a34a';
          markerElement.style.border = '3px solid white';
          markerElement.style.boxShadow =
            '0 2px 8px rgba(0,0,0,0.35)';
          markerElement.style.transform =
            'translate(-50%, -50%)';
          markerElement.style.cursor = 'pointer';

          const marker = new YMapMarker(
            {
              coordinates: [
                plant.longitude,
                plant.latitude,
              ],
            },
            markerElement
          );

          /*
           * Название появляется только при наведении.
           * Никаких телефонов/адресов.
           */
          const label = document.createElement('div');

          label.textContent = plant.name;

          label.style.position = 'absolute';
          label.style.left = '50%';
          label.style.bottom = '24px';
          label.style.transform = 'translateX(-50%)';
          label.style.background = '#172033';
          label.style.color = '#fff';
          label.style.padding = '5px 8px';
          label.style.borderRadius = '7px';
          label.style.fontSize = '12px';
          label.style.whiteSpace = 'nowrap';
          label.style.pointerEvents = 'none';
          label.style.opacity = '0';
          label.style.transition = 'opacity 0.15s';

          markerElement.style.position = 'relative';
          markerElement.appendChild(label);

          markerElement.addEventListener('mouseenter', () => {
            label.style.opacity = '1';
          });

          markerElement.addEventListener('mouseleave', () => {
            label.style.opacity = '0';
          });

          map.addChild(marker);
        });

        /*
         * Головной офис.
         *
         * Визуально отличается от заводов (крупнее, акцентный цвет) и
         * подписан всегда, а не только при наведении — это единственная
         * такая точка на карте.
         */
        if (hasHeadOffice) {
          const officeElement = document.createElement('div');
          officeElement.style.position = 'relative';
          officeElement.style.width = '22px';
          officeElement.style.height = '22px';
          officeElement.style.borderRadius = '50%';
          officeElement.style.backgroundColor = '#f97316';
          officeElement.style.border = '3px solid white';
          officeElement.style.boxShadow = '0 2px 10px rgba(0,0,0,0.4)';
          officeElement.style.transform = 'translate(-50%, -50%)';

          const officeLabel = document.createElement('div');
          officeLabel.textContent = headOffice!.name;
          officeLabel.style.position = 'absolute';
          officeLabel.style.left = '50%';
          officeLabel.style.bottom = '28px';
          officeLabel.style.transform = 'translateX(-50%)';
          officeLabel.style.background = '#f97316';
          officeLabel.style.color = '#fff';
          officeLabel.style.padding = '5px 9px';
          officeLabel.style.borderRadius = '7px';
          officeLabel.style.fontSize = '12px';
          officeLabel.style.fontWeight = '600';
          officeLabel.style.whiteSpace = 'nowrap';
          officeLabel.style.pointerEvents = 'none';

          officeElement.appendChild(officeLabel);

          const officeMarker = new YMapMarker(
            { coordinates: [headOffice!.longitude, headOffice!.latitude] },
            officeElement,
          );

          map.addChild(officeMarker);
        }

        mapInstanceRef.current = map;

        console.log(
          `Яндекс.Карта загружена. Заводов: ${activePlants.length}${hasHeadOffice ? ' + головной офис' : ''}`
        );
      } catch (error) {
        console.error(
          'Ошибка инициализации Яндекс.Карты:',
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
    };
  }, [plants, headOffice]);

  return (
    <div
      ref={mapRef}
      className="h-[450px] w-full"
    />
  );
}
