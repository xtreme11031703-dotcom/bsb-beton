import { getSiteSettings } from '@/lib/site-settings';
import { SiteSettingsForm } from './SiteSettingsForm';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-navy-800">Инфо о сайте</h1>
      <p className="mb-6 text-sm text-navy-400">
        Телефон, email, часы работы и вопросы-ответы — эти данные подставляются на главной странице,
        странице контактов, в подвале сайта и на странице «Вопрос-ответ».
      </p>
      <SiteSettingsForm initial={settings} />
    </div>
  );
}
