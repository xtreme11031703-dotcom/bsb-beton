import type { ReactNode } from 'react';

type PhotoHeroProps = {
  imageUrl: string;
  imageAlt: string;
  children: ReactNode;
};

/**
 * Тёмная "шапка" раздела с фоновой фотографией — общий вид для /services,
 * /catalog и /catalog/[category] вместо плоского navy-фона. Фото — обычный
 * <img> (см. lib/category-photos.ts, почему не next/image), затемнённый
 * градиентом слева направо, чтобы текст оставался читаемым поверх любой
 * картинки без подбора цвета под конкретное фото.
 */
export function PhotoHero({ imageUrl, imageAlt, children }: PhotoHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-surface-border bg-navy-900">
      <img
        src={imageUrl}
        alt={imageAlt}
        loading="eager"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-navy-900 via-navy-900/90 to-navy-900/55" />
      <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">{children}</div>
    </section>
  );
}
