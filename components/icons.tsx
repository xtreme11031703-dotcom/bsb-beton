// Небольшой набор тематических line-иконок для карточек преимуществ, услуг,
// оплаты и т.д. Раньше на сайте не было вообще никакой графики (только текст
// в карточках) — набор призван оживить страницы, не прибегая к стоковым фото:
// у компании их пока нет, а выдавать чужие/сгенерированные снимки за реальные
// заводы или технику было бы нечестно. Стиль — Heroicons-подобный контурный,
// 24×24, чтобы визуально сочетаться с шевроном на /faq.

type IconProps = { className?: string };

const DEFAULT_CLASS = 'h-full w-full';

function Svg({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className ?? DEFAULT_CLASS}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

/** Круглосуточная работа заводов. */
export function ClockIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </Svg>
  );
}

/** Быстрое оформление заявки. */
export function BoltIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M13.25 2.25 3.5 13.5H12l-1.25 8.25L20.5 10.5H12z" />
    </Svg>
  );
}

/** Собственный автопарк / доставка. */
export function TruckIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M2.5 6h11v10h-11z" />
      <path d="M13.5 10h4l3 3v3h-7z" />
      <circle cx="6.5" cy="17.5" r="1.7" />
      <circle cx="16.5" cy="17.5" r="1.7" />
    </Svg>
  );
}

/** Радиус доставки / адрес. */
export function MapPinIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
      <circle cx="12" cy="10.5" r="2.6" />
    </Svg>
  );
}

/** Бетононасос. */
export function PumpIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4 20V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v11" />
      <path d="M10 12h3.5a3.5 3.5 0 0 0 3.5-3.5V6" />
      <path d="M17 6h2.5" />
      <path d="M19.5 6v.01" />
    </Svg>
  );
}

/** Сеть заводов. */
export function FactoryIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M3 21V11l5 3.2V11l5 3.2V9l6 3.6V21z" />
      <path d="M3 21h18" />
      <path d="M17 8V4.5" />
      <path d="M17 4.5h2.2" />
    </Svg>
  );
}

/** Документы, декларации, счета. */
export function DocumentCheckIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M6.5 3.5h8L19 8v12.5h-12.5z" />
      <path d="M14.5 3.5V8H19" />
      <path d="M9 14l2 2 4-4.3" />
    </Svg>
  );
}

/** Доставка по маршруту/графику. */
export function RouteIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="5" cy="18" r="2" />
      <circle cx="19" cy="6" r="2" />
      <path d="M6.6 16.7 12 10.5" strokeDasharray="2.4 2.4" />
      <path d="M13.3 9.6 17.4 7.8" strokeDasharray="2.4 2.4" />
    </Svg>
  );
}

/** Марки/слои материала — товарный бетон, растворы. */
export function LayersIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M12 3.5 21 8.5 12 13.5 3 8.5Z" />
      <path d="m3 12.5 9 5 9-5" />
      <path d="m3 16.5 9 5 9-5" />
    </Svg>
  );
}

/** Прочность / надёжность. */
export function ShieldCheckIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M12 3 19 5.8v5.4c0 5-3.1 8.2-7 9.8-3.9-1.6-7-4.8-7-9.8V5.8Z" />
      <path d="m9 12 2.2 2.2L15.5 10" />
    </Svg>
  );
}

/** Теплоизоляция (полистиролбетон). */
export function ThermalIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M3 7c1.5 1.6 3 1.6 4.5 0S11 5.4 12.5 7s3 1.6 4.5 0 3-1.6 4.5 0" />
      <path d="M3 12.5c1.5 1.6 3 1.6 4.5 0s3-1.6 4.5 0 3 1.6 4.5 0 3-1.6 4.5 0" />
      <path d="M3 18c1.5 1.6 3 1.6 4.5 0s3-1.6 4.5 0 3 1.6 4.5 0 3-1.6 4.5 0" />
    </Svg>
  );
}

/** Наличный расчёт. */
export function BanknoteIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="2.5" y="6" width="19" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.6" />
      <path d="M5.5 9v.01" />
      <path d="M18.5 15v.01" />
    </Svg>
  );
}

/** Безналичный перевод. */
export function CreditCardIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="2.5" y="5" width="19" height="14" rx="2.2" />
      <path d="M2.5 9.5h19" />
      <path d="M6 14.5h4" />
    </Svg>
  );
}
