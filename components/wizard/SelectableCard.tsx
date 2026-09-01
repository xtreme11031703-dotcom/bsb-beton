'use client';

export function SelectableCard({
  label,
  sublabel,
  selected,
  onClick,
}: {
  label: string;
  sublabel?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border-2 px-4 py-4 text-left transition-colors ${
        selected
          ? 'border-navy-700 bg-navy-700 text-white'
          : 'border-surface-border bg-white text-navy-700 hover:border-navy-400'
      }`}
    >
      <div className="text-base font-semibold">{label}</div>
      {sublabel && (
        <div className={`mt-0.5 text-xs ${selected ? 'text-navy-200' : 'text-navy-400'}`}>
          {sublabel}
        </div>
      )}
    </button>
  );
}
