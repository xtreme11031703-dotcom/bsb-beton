'use client';

import { useEffect, useRef } from 'react';

export type YandexMapPlant = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  status: 'ACTIVE' | 'INACTIVE';
};

type YandexMapProps = {
  plants?: YandexMapPlant[];
};

export default function YandexMap({ plants = [] }: YandexMapProps) {
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

        // Если есть заводы — центрируем карту по ним.
        // Если заводов нет — Москва.
        let center: [number, number] = [37.6176, 55.7558];
        let zoom = 9;

        if (activePlants.length === 1) {
          center = [
            activePlants[0].longitude,
            activePlants[0].latitude,
          ];
          zoom = 11;
        }

        if (activePlants.length > 1) {
          const lngs = activePlants.map((p) => p.longitude);
          const lats = activePlants.map((p) => p.latitude);

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

        mapInstanceRef.current = map;

        console.log(
          `Яндекс.Карта загружена. Заводов: ${activePlants.length}`
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
  }, [plants]);

  return (
    <div
      ref={mapRef}
      className="h-[450px] w-full"
    />
  );
}
