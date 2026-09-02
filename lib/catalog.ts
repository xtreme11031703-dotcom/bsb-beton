// Каталог товаров — источник истины для публичных страниц каталога
// (app/catalog), для корзины заказа (общий контекст lib/cart-context.tsx,
// используется и мастером заказа app/order/new, и страницами каталога), для
// формы завода в админке (components/admin/PlantForm.tsx) и для отображения
// заказов везде, где нужно показать позиции (админка, кабинет клиента,
// кабинет завода, телеграм-алерты).
//
// Марки, характеристики (класс/морозостойкость/водонепроницаемость/
// плотность) и цены за м³ сверены вручную по факту со страницами
// bsb-beton.ru/catalog/... (сентябрь 2026) — пользователь прислал полный
// текст всех разделов, включая цены, так что это не оценка, а точные цифры
// с сайта на момент разработки. ВАЖНО: цена, сохранённая в позиции
// оформленного заказа (OrderItem.unitPrice/lineTotal) — это СНИМОК на
// момент оформления, а не ссылка на этот файл: если цены тут поменяются
// (или, как планирует заказчик, их вообще заменит отдельный калькулятор
// цены), история уже оформленных заказов не должна задним числом
// пересчитываться. Для текущей корзины (ещё не оформленного заказа) цена,
// наоборот, всегда считается вживую через getItemUnitPrice/getItemLineTotal.
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

// Короткое пояснение под названием категории — совпадает по смыслу с
// company.serviceCategories.description.
export const PRODUCT_CATEGORY_HINTS: Record<ProductCategory, string> = {
  BETON: 'На гравии, граните или керамзите — для фундаментов, плит и стяжек',
  TOSHCHIY_BETON: 'Низкие марки для подготовительных и выравнивающих работ',
  VYSOKOPROCHNYY_BETON: 'Марки М400–М1000 для нагруженных конструкций',
  POLISTIROLBETON: 'Лёгкий теплоизоляционный бетон для утепления кровель и стяжек',
  RASTVORY: 'Цементные и специальные растворы, пескобетон',
  NASOS: 'Автобетононасосы и линейные насосы со стрелой до 68 м',
};

// URL-слаги категорий на публичных страницах каталога (app/catalog/[category])
// — совпадают со company.serviceCategories[].slug, чтобы /services и
// /catalog ссылались на одни и те же разделы.
export const CATEGORY_SLUGS: Record<ProductCategory, string> = {
  BETON: 'beton',
  TOSHCHIY_BETON: 'toshchiy-beton',
  VYSOKOPROCHNYY_BETON: 'vysokoprochnyy-beton',
  POLISTIROLBETON: 'polistirolbeton',
  RASTVORY: 'rastvory',
  NASOS: 'arenda-betononasosa',
};

export function categorySlugToKey(slug: string): ProductCategory | null {
  const entry = (Object.entries(CATEGORY_SLUGS) as [ProductCategory, string][]).find(([, s]) => s === slug);
  return entry ? entry[0] : null;
}

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
  STATIONARY: 'Линейный насос',
};

// ---------------------------------------------------------------------------
// SKU-таблицы: марка/класс/характеристики/цена — по данным bsb-beton.ru/catalog

export type BetonSku = {
  grade: ConcreteGrade;
  classLabel: string; // например "В22,5"
  frost?: string; // "F200"
  water?: string; // "W6"
  density?: number; // кг/м³
  price: number; // руб. за м³
};

export const BETON_SKUS: Record<ConcreteAggregate, BetonSku[]> = {
  GRAVEL: [
    { grade: 'M100', classLabel: 'В7,5', frost: 'F100', water: 'W4', density: 2265, price: 4300 },
    { grade: 'M150', classLabel: 'В12,5', frost: 'F100', water: 'W4', density: 2310, price: 4550 },
    { grade: 'M200', classLabel: 'В15', frost: 'F100', water: 'W4', density: 2330, price: 4800 },
    { grade: 'M250', classLabel: 'В20', frost: 'F100', water: 'W4', density: 2340, price: 5100 },
    { grade: 'M300', classLabel: 'В22,5', frost: 'F200', water: 'W6', density: 2350, price: 5300 },
    { grade: 'M350', classLabel: 'В25', frost: 'F200', water: 'W8', density: 2400, price: 5500 },
    { grade: 'M400', classLabel: 'В30', frost: 'F200', water: 'W12', density: 2430, price: 5750 },
  ],
  GRANITE: [
    { grade: 'M200', classLabel: 'В15', frost: 'F150', water: 'W4', density: 2315, price: 5700 },
    { grade: 'M250', classLabel: 'В20', frost: 'F150', water: 'W6', density: 2340, price: 5900 },
    { grade: 'M300', classLabel: 'В22,5', frost: 'F200', water: 'W6', density: 2365, price: 6100 },
    { grade: 'M350', classLabel: 'В25', frost: 'F200', water: 'W8', density: 2380, price: 6250 },
    { grade: 'M400', classLabel: 'В30, В27,5', frost: 'F300', water: 'W10', density: 2370, price: 6440 },
    { grade: 'M450', classLabel: 'В35', frost: 'F300', water: 'W12', density: 2400, price: 6650 },
    { grade: 'M500', classLabel: 'В40', frost: 'F300', water: 'W12', density: 2440, price: 6900 },
    { grade: 'M550', classLabel: 'В40', frost: 'F300', water: 'W12', density: 2450, price: 7100 },
    { grade: 'M600', classLabel: 'В45', frost: 'F300', water: 'W14', density: 2475, price: 7435 },
    { grade: 'M700', classLabel: 'В50', frost: 'F400', water: 'W16', density: 2475, price: 7685 },
    { grade: 'M800', classLabel: 'В60', frost: 'F400', water: 'W18', density: 2500, price: 7900 },
    { grade: 'M1000', classLabel: 'В80', frost: 'F400', water: 'W20', density: 2700, price: 8400 },
  ],
  EXPANDED_CLAY: [
    { grade: 'M50', classLabel: 'В3,5', frost: 'F100', water: 'W4', density: 800, price: 3850 },
    { grade: 'M75', classLabel: 'В5', frost: 'F100', water: 'W4', density: 1000, price: 4050 },
    { grade: 'M100', classLabel: 'В7,5', frost: 'F100', water: 'W4', density: 1200, price: 4200 },
    { grade: 'M150', classLabel: 'В12,5, В10', frost: 'F100', water: 'W4', density: 1400, price: 4400 },
    { grade: 'M200', classLabel: 'В15', frost: 'F150', water: 'W4', density: 1600, price: 4600 },
    { grade: 'M250', classLabel: 'В20', frost: 'F150', water: 'W4', density: 1800, price: 4750 },
    { grade: 'M300', classLabel: 'В22,5', frost: 'F200', water: 'W6', density: 2000, price: 4900 },
  ],
};

export const TOSHCHIY_BETON_SKUS: BetonSku[] = [
  { grade: 'M50', classLabel: 'В3,5', frost: 'F50', water: 'W2', density: 2210, price: 3300 },
  { grade: 'M75', classLabel: 'В3,5', frost: 'F50', water: 'W2', density: 2210, price: 3400 },
  { grade: 'M100', classLabel: 'В7,5', frost: 'F50', water: 'W2', density: 2210, price: 3500 },
  { grade: 'M150', classLabel: 'В12,5', frost: 'F100', water: 'W4', density: 2260, price: 3700 },
  { grade: 'M200', classLabel: 'В15', frost: 'F100', water: 'W4', density: 2270, price: 3900 },
  { grade: 'M250', classLabel: 'В20', frost: 'F150', water: 'W6', density: 2290, price: 4100 },
  { grade: 'M300', classLabel: 'В22,5', frost: 'F150', water: 'W6', density: 2315, price: 4300 },
];

export const VYSOKOPROCHNYY_BETON_SKUS: BetonSku[] = [
  { grade: 'M400', classLabel: 'В30', frost: 'F200', water: 'W10', price: 6440 },
  { grade: 'M450', classLabel: 'В35', frost: 'F200–F300', water: 'W8–W12', price: 6650 },
  { grade: 'M500', classLabel: 'В40', frost: 'F200', water: 'W10–W14', price: 6900 },
  { grade: 'M600', classLabel: 'В45', frost: 'F300–F400', water: 'W12–W16', price: 7100 },
  { grade: 'M700', classLabel: 'В50', frost: 'F400', water: 'W14–W18', price: 7435 },
  { grade: 'M800', classLabel: 'В55', price: 7685 },
  { grade: 'M900', classLabel: 'В60', price: 7900 },
  { grade: 'M1000', classLabel: 'В70–В80', price: 8400 },
];

export const POLISTIROLBETON_SKUS: BetonSku[] = [
  { grade: 'M50', classLabel: 'В3,5', frost: 'F150', water: 'W6', density: 2210, price: 5800 },
  { grade: 'M75', classLabel: 'В5', frost: 'F150', water: 'W6', density: 2210, price: 6300 },
];

export type MortarSku = {
  grade?: ConcreteGrade; // отсутствует у "Цементное молочко" — там нет марки, один товар
  label?: string; // название, когда марки нет (см. выше)
  classLabel?: string;
  frost?: string;
  water?: string;
  density?: number;
  price: number;
};

export const MORTAR_SKUS: Record<MortarKind, MortarSku[]> = {
  CEMENT: [
    { grade: 'M50', classLabel: 'В3,5', frost: 'F50', water: 'W2', price: 3400 },
    { grade: 'M75', frost: 'F50', water: 'W2', price: 3500 },
    { grade: 'M100', classLabel: 'В7,5', frost: 'F50', water: 'W4', density: 2145, price: 3600 },
    { grade: 'M150', classLabel: 'В12,5', frost: 'F100', water: 'W4', density: 2165, price: 3750 },
    { grade: 'M200', classLabel: 'В15', frost: 'F100', water: 'W4', density: 2300, price: 4100 },
    { grade: 'M250', classLabel: 'В20', frost: 'F150', water: 'W6', density: 2220, price: 4400 },
    { grade: 'M300', classLabel: 'В22,5', frost: 'F200', water: 'W6', density: 2235, price: 4700 },
  ],
  SAND_CONCRETE: [
    { grade: 'M100', classLabel: 'В7,5', frost: 'F50', water: 'W4', density: 2140, price: 3600 },
    { grade: 'M150', classLabel: 'В12,5, В10', frost: 'F50', water: 'W4', density: 2165, price: 3750 },
    { grade: 'M200', classLabel: 'В15', frost: 'F100', water: 'W6', density: 2195, price: 4100 },
    { grade: 'M250', classLabel: 'В20', frost: 'F100', water: 'W6', density: 2210, price: 4400 },
    { grade: 'M300', classLabel: 'В20', frost: 'F100', water: 'W6', density: 2210, price: 4700 },
  ],
  // Единственный товар в этом разделе на сайте — без марки, но тоже
  // продаётся за м³ (не штучно).
  SPECIAL: [{ label: 'Цементное молочко', density: 1300, price: 4500 }],
};

export type PumpSku = {
  length: string; // не всегда буквально "длина" — см. "Миксер с бетононасосом" ниже
  price: number | null; // null — цена уточняется (например, произвольная длина)
};

export const AUTO_PUMP_SKUS: PumpSku[] = [
  { length: '15 м', price: 20000 },
  { length: '20 м', price: 22000 },
  { length: '24 м', price: 24000 },
  { length: '28 м', price: 28000 },
  { length: '32 м', price: 30000 },
  { length: '36 м', price: 34000 },
  { length: '42 м', price: 38000 },
  { length: '46 м', price: 40000 },
  { length: '52 м', price: 44000 },
  { length: '56 м', price: 46000 },
  { length: '62 м', price: 48000 },
  { length: '65 м', price: 50000 },
  { length: '68 м', price: 52000 },
  { length: 'Миксер с бетононасосом (58 м³/ч)', price: 55000 },
  { length: 'Другой', price: null },
];

export const STATIONARY_PUMP_SKUS: PumpSku[] = [
  { length: 'До 100 м трассы', price: 20000 },
  { length: 'До 200 м трассы', price: 25000 },
  { length: 'Для керамзитобетона (до 150 м)', price: 35000 },
];

// ---------------------------------------------------------------------------
// Что показывать/требовать для категории — не зависит от марки/наполнителя

export function categoryUsesAggregate(category: ProductCategory): boolean {
  return category === 'BETON';
}

// "Характеристики бетона" (класс/подвижность/морозостойкость/водонепроницаемость/фибра)
export function categoryUsesConcreteSpecs(category: ProductCategory): boolean {
  return category === 'BETON' || category === 'TOSHCHIY_BETON' || category === 'VYSOKOPROCHNYY_BETON' || category === 'POLISTIROLBETON';
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

/** Нужна ли марка для текущего сочетания параметров позиции — для растворов
 * зависит от вида (у "Цементного молочка" марки нет вообще). */
export function itemRequiresGrade(item: { category: ProductCategory; mortarKind?: MortarKind | null }): boolean {
  if (item.category === 'RASTVORY') return item.mortarKind === 'CEMENT' || item.mortarKind === 'SAND_CONCRETE';
  return item.category === 'BETON' || item.category === 'TOSHCHIY_BETON' || item.category === 'VYSOKOPROCHNYY_BETON' || item.category === 'POLISTIROLBETON';
}

/** Список доступных марок для текущего сочетания категория+наполнитель/вид
 * раствора — например, марки бетона на граните отличаются от марок на
 * гравии. Пусто, если для этого сочетания маркой выбирать нечего (например,
 * BETON без выбранного наполнителя, или RASTVORY/SPECIAL). */
export function getGradeOptions(item: {
  category: ProductCategory;
  aggregate?: ConcreteAggregate | null;
  mortarKind?: MortarKind | null;
}): ConcreteGrade[] {
  switch (item.category) {
    case 'BETON':
      return item.aggregate ? BETON_SKUS[item.aggregate].map((s) => s.grade) : [];
    case 'TOSHCHIY_BETON':
      return TOSHCHIY_BETON_SKUS.map((s) => s.grade);
    case 'VYSOKOPROCHNYY_BETON':
      return VYSOKOPROCHNYY_BETON_SKUS.map((s) => s.grade);
    case 'POLISTIROLBETON':
      return POLISTIROLBETON_SKUS.map((s) => s.grade);
    case 'RASTVORY':
      if (item.mortarKind === 'CEMENT') return MORTAR_SKUS.CEMENT.map((s) => s.grade!);
      if (item.mortarKind === 'SAND_CONCRETE') return MORTAR_SKUS.SAND_CONCRETE.map((s) => s.grade!);
      return [];
    default:
      return [];
  }
}

function findBetonSku(aggregate: ConcreteAggregate | null | undefined, grade: ConcreteGrade | null | undefined) {
  if (!aggregate || !grade) return null;
  return BETON_SKUS[aggregate].find((s) => s.grade === grade) ?? null;
}

function findMortarSku(mortarKind: MortarKind | null | undefined, grade: ConcreteGrade | null | undefined) {
  if (!mortarKind) return null;
  if (mortarKind === 'SPECIAL') return MORTAR_SKUS.SPECIAL[0] ?? null;
  return MORTAR_SKUS[mortarKind].find((s) => s.grade === grade) ?? null;
}

function findPumpSku(pumpType: PumpType | null | undefined, length: string | null | undefined) {
  if (!pumpType || !length) return null;
  const list = pumpType === 'AUTO' ? AUTO_PUMP_SKUS : STATIONARY_PUMP_SKUS;
  return list.find((s) => s.length === length) ?? null;
}

export type SkuSpecs = { classLabel?: string; frost?: string; water?: string; density?: number };

/** Тех.характеристики (класс/морозостойкость/водонепроницаемость/плотность),
 * которые подтягиваются автоматически по выбранной марке — те же цифры, что
 * показаны в карточках каталога (см. BETON_SKUS/MORTAR_SKUS и т.п.), чтобы в
 * заявке они не расходились с тем, что человек видел при выборе марки, и не
 * вводились вручную (там, где для сочетания категория+марка(+наполнитель/вид
 * раствора) характеристики неизвестны — например, марка ещё не выбрана —
 * возвращает null). Подвижность и фибра сюда не входят — в прайсе с сайта их
 * нет, это остаётся отдельным полем/чекбоксом, которые человек заполняет сам. */
export function getSkuSpecs(item: {
  category: ProductCategory;
  aggregate?: ConcreteAggregate | null;
  concreteGrade?: ConcreteGrade | null;
  mortarKind?: MortarKind | null;
}): SkuSpecs | null {
  let sku: { classLabel?: string; frost?: string; water?: string; density?: number } | null | undefined;
  switch (item.category) {
    case 'BETON':
      sku = findBetonSku(item.aggregate, item.concreteGrade);
      break;
    case 'TOSHCHIY_BETON':
      sku = TOSHCHIY_BETON_SKUS.find((s) => s.grade === item.concreteGrade);
      break;
    case 'VYSOKOPROCHNYY_BETON':
      sku = VYSOKOPROCHNYY_BETON_SKUS.find((s) => s.grade === item.concreteGrade);
      break;
    case 'POLISTIROLBETON':
      sku = POLISTIROLBETON_SKUS.find((s) => s.grade === item.concreteGrade);
      break;
    case 'RASTVORY':
      sku = findMortarSku(item.mortarKind, item.concreteGrade);
      break;
    default:
      return null;
  }
  if (!sku) return null;
  return { classLabel: sku.classLabel, frost: sku.frost, water: sku.water, density: sku.density };
}

type PriceLookupItem = {
  category: ProductCategory;
  aggregate?: ConcreteAggregate | null;
  concreteGrade?: ConcreteGrade | null;
  mortarKind?: MortarKind | null;
  pumpType?: PumpType | null;
  pumpLength?: string | null;
};

/** Цена за м³ (для насоса — не имеет смысла, там сразу getItemLineTotal). */
export function getItemUnitPrice(item: PriceLookupItem): number | null {
  switch (item.category) {
    case 'BETON':
      return findBetonSku(item.aggregate, item.concreteGrade)?.price ?? null;
    case 'TOSHCHIY_BETON':
      return TOSHCHIY_BETON_SKUS.find((s) => s.grade === item.concreteGrade)?.price ?? null;
    case 'VYSOKOPROCHNYY_BETON':
      return VYSOKOPROCHNYY_BETON_SKUS.find((s) => s.grade === item.concreteGrade)?.price ?? null;
    case 'POLISTIROLBETON':
      return POLISTIROLBETON_SKUS.find((s) => s.grade === item.concreteGrade)?.price ?? null;
    case 'RASTVORY':
      return findMortarSku(item.mortarKind, item.concreteGrade)?.price ?? null;
    default:
      return null;
  }
}

/** Итог по позиции: unitPrice × quantity для объёмных категорий, либо
 * фиксированная цена аренды насоса. null — цена не определена (например,
 * произвольная длина стрелы "Другой") — тогда сумма по заказу уточняется. */
export function getItemLineTotal(item: PriceLookupItem & { quantity?: number | null }): number | null {
  if (item.category === 'NASOS') {
    return findPumpSku(item.pumpType, item.pumpLength)?.price ?? null;
  }
  const unit = getItemUnitPrice(item);
  if (unit === null) return null;
  return unit * (item.quantity ?? 0);
}

export function getCartTotal(items: (PriceLookupItem & { quantity?: number | null })[]): number | null {
  let total = 0;
  for (const item of items) {
    const line = getItemLineTotal(item);
    if (line === null) return null;
    total += line;
  }
  return total;
}

export function formatPrice(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'уточняется';
  return `${Math.round(value).toLocaleString('ru-RU')} ₽`;
}

// ---------------------------------------------------------------------------
// Корзина (общий тип для страниц каталога, мастера заказа и контекста lib/cart-context.tsx)

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
// корзину — используется и на страницах каталога, и в мастере заказа, и как
// последняя защита перед отправкой.
export function isCartItemValid(item: CartItem): boolean {
  if (categoryUsesAggregate(item.category) && !item.aggregate) return false;
  if (categoryUsesMortarKind(item.category) && !item.mortarKind) return false;
  if (itemRequiresGrade(item) && !item.concreteGrade) return false;
  if (categoryUsesQuantity(item.category) && (!item.quantity || item.quantity < 1)) return false;
  if (categoryUsesPump(item.category) && (!item.pumpType || !item.pumpLength)) return false;
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

/** Название позиции без количества и цены — "Товарный бетон М300, на гравии".
 * Подходит и для CartItem на клиенте, и для OrderItem, пришедшего из Prisma. */
export function describeCartItem(item: ItemLike): string {
  const parts: string[] = [PRODUCT_CATEGORY_LABELS[item.category]];
  if (item.concreteGrade) parts.push(item.concreteGrade);
  if (item.aggregate) parts.push(CONCRETE_AGGREGATE_LABELS[item.aggregate]);
  if (item.category === 'RASTVORY' && item.mortarKind) {
    parts.push(item.mortarKind === 'SPECIAL' ? (MORTAR_SKUS.SPECIAL[0]?.label ?? 'Цементное молочко') : MORTAR_KIND_LABELS[item.mortarKind]);
  }
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

/** Однострочная сводка всей корзины с итоговой суммой — для карточек заказа,
 * Telegram-алертов и т.п. Использует переданные позиции как есть (для уже
 * оформленного заказа — это снимок unitPrice/lineTotal из OrderItem, а не
 * пересчёт по текущему прайсу). */
export function summarizeOrderItems(items: (ItemLike & { lineTotal?: number | null })[]): string {
  if (items.length === 0) return '—';
  const lines = items.map((item) => {
    const qty = describeCartItemQuantity(item);
    const base = qty ? `${describeCartItem(item)} — ${qty}` : describeCartItem(item);
    return item.lineTotal != null ? `${base} (${formatPrice(item.lineTotal)})` : base;
  });
  const total = items.reduce<number | null>((sum, item) => {
    if (sum === null || item.lineTotal == null) return null;
    return sum + item.lineTotal;
  }, 0);
  const totalSuffix = total !== null ? `; Итого: ${formatPrice(total)}` : '';
  return lines.join('; ') + totalSuffix;
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
