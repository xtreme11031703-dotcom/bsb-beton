'use client';

const GROUPS = ['Материал', 'Параметры', 'Доставка', 'Контакты', 'Подтверждение'];

export function StepShell({
  title,
  subtitle,
  groupIndex,
  onBack,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  groupIndex: number; // 0..4, соответствует GROUPS
  onBack?: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-57px)] max-w-lg flex-col px-4 pb-28 pt-6 sm:px-6">
      {/* Progress indicator */}
      <div className="mb-6 flex items-center gap-1.5">
        {GROUPS.map((g, i) => (
          <div key={g} className="flex-1">
            <div
              className={`h-1.5 rounded-full ${i <= groupIndex ? 'bg-accent-500' : 'bg-surface-border'}`}
            />
          </div>
        ))}
      </div>
      <div className="mb-1 flex items-center gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Назад"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-surface-border text-navy-500 hover:bg-surface-border"
          >
            ←
          </button>
        )}
        <p className="text-xs font-medium uppercase text-navy-400">{GROUPS[groupIndex]}</p>
      </div>
      <h1 className="text-2xl font-bold text-navy-800">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-navy-500">{subtitle}</p>}

      <div className="mt-6 flex-1">{children}</div>

      <div className="fixed inset-x-0 bottom-0 border-t border-surface-border bg-white/95 p-4 backdrop-blur sm:static sm:mt-8 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-0">
        <div className="mx-auto max-w-lg">{footer}</div>
      </div>
    </div>
  );
}
