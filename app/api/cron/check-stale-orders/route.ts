import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendTelegramMessageToMany } from '@/lib/telegram';
import { MATERIAL_LABELS } from '@/lib/utils';

// Проверка "зависших" заказов — вызывается по расписанию извне (не Next.js,
// у serverless-функций нет фонового таймера). Варианты запуска описаны в README,
// раздел "Алертинг": Vercel Cron (vercel.json) либо обычный crontab на VPS
// с curl. Защищено секретом в заголовке, чтобы эндпоинт не мог дёрнуть кто попало.
//
//   curl -X POST https://ваш-домен.ru/api/cron/check-stale-orders \
//     -H "Authorization: Bearer ВАШ_CRON_SECRET"

const STALE_AFTER_MINUTES = Number(process.env.STALE_ORDER_MINUTES || 30);

// Поддерживаем и GET (так шлёт запросы Vercel Cron), и POST (обычный curl из
// crontab на своём сервере) — оба варианта описаны в README.
export async function GET(req: NextRequest) {
  return handleCheck(req);
}

export async function POST(req: NextRequest) {
  return handleCheck(req);
}

async function handleCheck(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get('authorization');
    const querySecret = req.nextUrl.searchParams.get('secret');
    if (auth !== `Bearer ${secret}` && querySecret !== secret) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  }

  const threshold = new Date(Date.now() - STALE_AFTER_MINUTES * 60 * 1000);

  const staleOrders = await prisma.order.findMany({
    where: {
      status: 'SEARCHING_PLANT',
      createdAt: { lt: threshold },
      staleAlertSentAt: null,
    },
  });

  if (staleOrders.length === 0) {
    return NextResponse.json({ ok: true, alerted: 0 });
  }

  const adminUsers = await prisma.user.findMany({
    where: { role: 'ADMIN', telegramChatId: { not: null } },
    select: { telegramChatId: true },
  });
  const adminChatIds = adminUsers.map((u) => u.telegramChatId!).filter(Boolean);

  for (const order of staleOrders) {
    const minutesWaiting = Math.round((Date.now() - order.createdAt.getTime()) / 60000);
    const materialLabel = MATERIAL_LABELS[order.materialType] ?? order.materialType;

    if (adminChatIds.length > 0) {
      await sendTelegramMessageToMany(
        adminChatIds,
        `⏰ Заказ ${order.orderNumber} висит без завода уже ${minutesWaiting} мин.\n` +
          `${materialLabel}, ${order.quantity} м³, адрес: ${order.addressText}\n\n` +
          `Назначить вручную: bsb-beton.ru/admin/orders`,
      );
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { staleAlertSentAt: new Date() },
    });
  }

  return NextResponse.json({ ok: true, alerted: staleOrders.length });
}
