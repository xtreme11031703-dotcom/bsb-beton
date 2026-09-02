// Каталог товаров — источник истины для корзины заказа (app/order/new), для
// формы завода в админке (components/admin/PlantForm.tsx) и для отображения
// заказов везде, где нужно показать позиции (админка, кабинет клиента,
// кабинет завода, телеграм-алерты). Структура повторяет разделы каталога
// bsb-beton.ru/catalog (см. lib/company.ts -> serviceCategories) — по
// требованию заказчика наполненность должна совпадать 1 в 1.
//
// Сами подстраницы каталога на исходном сайте на момент разработки отдают
// 404 (похоже, известный баг самого bsb-beton.ru — как и часть блога), из-за
// чего точные марки/подвиды для полистиролбетона восстановлены по общей
// строительной практике (лёгкий теплоизоляционный бетон низких марок), а не
// списаны с живой страницы. Цен в исходном каталоге нет вообще — калькулятора
// стоимости в проекте не было и не появилось, придумывать цифры не стали.
import type {
  ConcreteAggregate,
  ConcreteGrade,
  MortarKind,
  ProductCategory,
  PumpType,
} from '@prisma/client';

export const ALL_PRODUCT_CATEGORIES: ProductCategory[] = [
  'BETON',
  'TOSHCHIY_BETON',
  'VYSOKOPROCHNYY_BETON',
  'POLISTIROLBETON',
  'RASTVORY',
  'NASOS',
];

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  BETON: 'Товарный бетон',
  TOSHCHIY_BETON: 'Тощий бетон',
  VYSOKOPROCHNYY_BETON: 'Высокопрочный бетон',
  POLISTIROLBETON: 'Полистиролбетон',
  RASTVORY: 'Растворы',
  NASOS: 'Аренда бетононасоса',
};

// Короткое пояснение под названием категории на шаге выбора товара —
// совпадает по смыслу с company.serviceCategories.description.
export const PRODUCT_CATEGORY_HINTS: Record<ProductCategory, string> = {
  BETON: 'На гравии, граните или керамзите — для фундаментов, плит и стяжек',
  TOSHCHIY_BETON: 'Низкие марки для подготовительных и выравнивающих работ',
  VYSOKOPROCHNYY_BETON: 'Марки М450–М500 для нагруженных конструкций',
  POLISTIROLBETON: 'Лёгкий теплоизоляционный бетон для утепления кровель и стяжек',
  RASTVORY: 'Цементные и специальные растворы, пескобетон',
  NASOS: 'Автобетононасосы и линейные насосы со стрелой до 68 м',
};

export const CONCRETE_AGGREGATE_LABELS: Record<ConcreteAggregate, string> = {
  GRAVEL: 'На гравии',
  GRANITE: 'На граните',
  EXPANDED_CLAY: 'Керамзитобетон',
};

export const MORTAR_KIND_LABELS: Record<MortarKind, string> = {
  CEMENT: 'Цементный раствор',
  SPECIAL: 'Специальный раствор',
  SAND_CONCRETE: 'Пескобетон',
};

export const PUMP_TYPE_LABELS: Record<PumpType, string> = {
  AUTO: 'Автобетононасос',
  STATIONARY: 'Стационарный насос',
};

export const AUTO_PUMP_LENGTHS = ['24 м', '28 м', '32 м', '36 м', '40 м', '42 м', '48 м', 'Другой'];

// Какие марки бетона предлагать для каждой "бетонной" категории — отсутствие
// категории в этом объекте означает, что марка бетона к ней не относится
// (растворы и аренда насоса маркируются иначе).
export const CONCRETE_GRADES_BY_CATEGORY: Partial<Record<ProductCategory, ConcreteGrade[]>> = {
  BETON: ['M100', 'M150', 'M200', 'M250', 'M300', 'M350', 'M400', 'M450', 'M500'],
  TOSHCHIY_BETON: ['M100', 'M150', 'M200'],
  VYSOKOPROCHNYY_BETON: ['M450', 'M500'],
  POLISTIROLBETON: ['M100', 'M150', 'M200'],
};

export function categoryUsesGrade(category: ProductCategory): boolean {
  return category in CONCRETE_GRADES_BY_CATEGORY;
}

export function categoryUsesAggregate(category: ProductCategory): boolean {
  return category === 'BETON';
}

// "Характеристики бетона" (класс/подвижность/морозостойкость/водонепроницаемость/фибра)
export function categoryUsesConcreteSpecs(category: ProductCategory): boolean {
  return categoryUsesGrade(category);
}

export function categoryUsesMortarKind(category: ProductCategory): boolean {
  return category === 'RASTVORY';
}

export function categoryUsesPump(category: ProductCategory): boolean {
  return category === 'NASOS';
}

// У аренды насоса нет объёма в м³ — она заказывается штучно (один выезд).
export function categoryUsesQuantity(category: ProductCategory): boolean {
  return category !== 'NASOS';
}

export type CartItem = {
  // Ключ существует только на клиенте, для React key и удаления из корзины —
  // не сохраняется в БД (OrderItem получает свой id при создании).
  key: string;
  category: ProductCategory;
  concreteGrade: ConcreteGrade | null;
  aggregate: ConcreteAggregate | null;
  concreteClass: string;
  mobility: string;
  frostResistance: string;
  waterResistance: string;
  hasFiber: boolean;
  mortarKind: MortarKind | null;
  pumpType: PumpType | null;
  pumpLength: string;
  pumpNote: string;
  quantity: number;
  additionalWishes: string;
};

export function makeCartItemKey(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function emptyCartItem(category: ProductCategory): CartItem {
  return {
    key: makeCartItemKey(),
    category,
    concreteGrade: null,
    aggregate: null,
    concreteClass: '',
    mobility: '',
    frostResistance: '',
    waterResistance: '',
    hasFiber: false,
    mortarKind: null,
    pumpType: null,
    pumpLength: '',
    pumpNote: '',
    quantity: categoryUsesQuantity(category) ? 10 : 1,
    additionalWishes: '',
  };
}

// Достаточно ли данных заполнено, чтобы позицию можно было положить в
// корзину — используется и в мастере заказа (кнопка "Добавить в корзину"),
// и как последняя защита перед отправкой.
export function isCartItemValid(item: CartItem): boolean {
  if (categoryUsesGrade(item.category) && !item.concreteGrade) return false;
  if (categoryUsesQuantity(item.category) && (!item.quantity || item.quantity < 1)) return false;
  if (categoryUsesPump(item.category) && !item.pumpType) return false;
  return true;
}

type ItemLike = {
  category: ProductCategory;
  concreteGrade?: ConcreteGrade | null;
  aggregate?: ConcreteAggregate | null;
  mortarKind?: MortarKind | null;
  pumpType?: PumpType | null;
  pumpLength?: string | null;
  quantity?: number | null;
};

/** Название позиции без количества — "Товарный бетон М300, на гравии". Подходит
 * и для CartItem на клиенте, и для OrderItem, пришедшего из Prisma. */
export function describeCartItem(item: ItemLike): string {
  const parts: string[] = [PRODUCT_CATEGORY_LABELS[item.category]];
  if (item.concreteGrade) parts.push(item.concreteGrade);
  if (item.aggregate) parts.push(CONCRETE_AGGREGATE_LABELS[item.aggregate]);
  if (item.mortarKind) parts.push(MORTAR_KIND_LABELS[item.mortarKind]);
  if (item.category === 'NASOS' && item.pumpType) {
    parts.push(PUMP_TYPE_LABELS[item.pumpType] + (item.pumpLength ? ` ${item.pumpLength}` : ''));
  }
  return parts.join(', ');
}

/** "10 м³" или null для позиций без объёма (аренда насоса). */
export function describeCartItemQuantity(item: ItemLike): string | null {
  if (!categoryUsesQuantity(item.category)) return null;
  return `${item.quantity ?? 0} м³`;
}

/** Однострочная сводка всей корзины — для карточек заказа, Telegram-алертов и т.п. */
export function summarizeOrderItems(items: ItemLike[]): string {
  if (items.length === 0) return '—';
  return items
    .map((item) => {
      const qty = describeCartItemQuantity(item);
      return qty ? `${describeCartItem(item)} — ${qty}` : describeCartItem(item);
    })
    .join('; ');
}

export function distinctCategories(items: { category: ProductCategory }[]): ProductCategory[] {
  return Array.from(new Set(items.map((i) => i.category)));
}

/** Завод подходит для заказа, только если умеет ВСЕ категории из его корзины —
 * заказ целиком уходит одному заводу, разбивки по позициям на разные заводы нет. */
export function plantCoversCategories(
  plantCategories: ProductCategory[],
  neededCategories: ProductCategory[],
): boolean {
  return neededCategories.every((c) => plantCategories.includes(c));
}
