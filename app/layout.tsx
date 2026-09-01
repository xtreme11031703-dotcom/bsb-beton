import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';

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
    <html lang="ru">
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
