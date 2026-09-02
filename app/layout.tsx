import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';

// Inter вместо системного стека — часть редизайна (см. tailwind.config.ts):
// более современный, "SaaS"-вид типографики. Next.js сам скачивает шрифт
// один раз при сборке и раздаёт со своего домена — раннтайм-зависимости
// от Google Fonts нет.
const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'БСБ — бетон с доставкой',
  description:
    'Заказ бетона, стройматериалов и бетононасоса с доставкой по Москве и МО',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY;

  return (
    <html lang="ru" className={inter.variable}>
      <body className="font-sans">
        {children}

        <Script
          id="yandex-maps"
          src={`https://api-maps.yandex.ru/v3/?apikey=${apiKey}&lang=ru_RU`}
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
