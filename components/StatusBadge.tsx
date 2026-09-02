import { ORDER_STATUS_LABELS } from '@/lib/utils';

const TONE_CLASSES: Record<string, string> = {
  slate: 'bg-navy-50 text-navy-600',
  amber: 'bg-amber-50 text-amber-700',
  green: 'bg-emerald-50 text-emerald-700',
  blue: 'bg-sky-50 text-sky-700',
  gray: 'bg-surface-muted text-navy-400',
};

/** Цветной статус-бейдж заказа — используется в кабинетах клиента, завода и админки,
 * чтобы статус считывался с одного взгляда, а не терялся в обычном тексте. */
export function StatusBadge({ status }: { status: string }) {
  const info = ORDER_STATUS_LABELS[status] ?? { label: status, emoji: '', tone: 'slate' as const };
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
        TONE_CLASSES[info.tone] ?? TONE_CLASSES.slate
      }`}
    >
      {info.emoji} {info.label}
    </span>
  );
}
