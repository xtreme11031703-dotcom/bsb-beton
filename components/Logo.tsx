import Image from 'next/image';
import { company } from '@/lib/company';

// dark оставлен для совместимости с местами, где логотип кладут на тёмный фон —
// сам файл логотипа цветной/светлый, поэтому по умолчанию рендерим его как есть.
// Если реальный логотип окажется тёмным на тёмном фоне — просто положи здесь
// вторую (dark-theme) версию файла и подставляй по этому пропу.
export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex items-center gap-2 leading-none" data-theme={dark ? 'dark' : 'light'}>
      <Image
        src={company.logoUrl}
        alt={company.fullName}
        width={140}
        height={36}
        priority
        className="h-8 w-auto object-contain"
      />
    </div>
  );
}
