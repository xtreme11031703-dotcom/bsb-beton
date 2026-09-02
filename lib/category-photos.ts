// Фотографии для витрины каталога/услуг и главной страницы — свободные
// стоковые снимки с Pexels (Pexels License: бесплатно для любого, включая
// коммерческое, использования, атрибуция не обязательна, но ссылка на автора
// оставлена в комментариях ниже на всякий случай).
//
// Подключены напрямую по CDN-ссылке images.pexels.com (обычный <img>, не
// next/image) — картинку загружает браузер посетителя сайта, а не наш
// сервер. Это осознанный выбор: сервер самообслуживается через `next start`
// на своей инфраструктуре, и мы не хотим, чтобы показ страницы зависел ещё и
// от исходящего доступа ЭТОГО сервера до внешнего CDN — так риска нет вообще,
// у браузера посетителя доступ в интернет есть по определению.
export type CategoryPhoto = { url: string; alt: string };

// Ключ — тот же slug, что в company.serviceCategories[].slug и
// lib/catalog.ts -> CATEGORY_SLUGS, чтобы карту можно было использовать и на
// /services, и на /catalog, и на /catalog/[category] без пересопоставления.
export const CATEGORY_PHOTOS: Record<string, CategoryPhoto> = {
  // Фото: pexels.com/photo/construction-worker-pouring-concrete-at-job-site-36847998
  beton: {
    url: 'https://images.pexels.com/photos/36847998/pexels-photo-36847998.jpeg?auto=compress&cs=tinysrgb&w=1200',
    alt: 'Заливка товарного бетона на строительной площадке',
  },
  // Фото: pexels.com/photo/construction-worker-smoothing-fresh-concrete-surface-37121398
  'toshchiy-beton': {
    url: 'https://images.pexels.com/photos/37121398/pexels-photo-37121398.jpeg?auto=compress&cs=tinysrgb&w=1200',
    alt: 'Выравнивание подготовительного слоя бетона',
  },
  // Фото: pexels.com/photo/industrial-construction-site-with-concrete-columns-29152268
  'vysokoprochnyy-beton': {
    url: 'https://images.pexels.com/photos/29152268/pexels-photo-29152268.jpeg?auto=compress&cs=tinysrgb&w=1200',
    alt: 'Бетонные конструкции на промышленном объекте',
  },
  // Фото: pexels.com/photo/construction-workers-cement-pouring-on-rooftop-39133859
  polistirolbeton: {
    url: 'https://images.pexels.com/photos/39133859/pexels-photo-39133859.jpeg?auto=compress&cs=tinysrgb&w=1200',
    alt: 'Заливка лёгкого бетона на кровле',
  },
  // Фото: pexels.com/photo/plastering-work-with-trowel-and-cement-38561968
  rastvory: {
    url: 'https://images.pexels.com/photos/38561968/pexels-photo-38561968.jpeg?auto=compress&cs=tinysrgb&w=1200',
    alt: 'Штукатурные работы с цементным раствором',
  },
  // Фото: pexels.com/photo/pumping-concrete-to-the-floor-of-a-building-under-construction-18283538
  'arenda-betononasosa': {
    url: 'https://images.pexels.com/photos/18283538/pexels-photo-18283538.jpeg?auto=compress&cs=tinysrgb&w=1200',
    alt: 'Подача бетона бетононасосом на этаж строящегося здания',
  },
};

// Фото: pexels.com/photo/birds-eye-view-of-a-concrete-batching-plant-12032964
export const PLANT_PHOTO: CategoryPhoto = {
  url: 'https://images.pexels.com/photos/12032964/pexels-photo-12032964.jpeg?auto=compress&cs=tinysrgb&w=1400',
  alt: 'Бетонный завод с высоты птичьего полёта',
};

// Фото: pexels.com/photo/urban-construction-site-with-concrete-mixer-trucks-36782541
export const CONSTRUCTION_SITE_PHOTO: CategoryPhoto = {
  url: 'https://images.pexels.com/photos/36782541/pexels-photo-36782541.jpeg?auto=compress&cs=tinysrgb&w=1600',
  alt: 'Городская стройплощадка с бетоносмесителями',
};
