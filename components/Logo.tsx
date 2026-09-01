export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <div className="leading-none">
      <div
        className={`text-2xl font-extrabold tracking-tight ${dark ? 'text-white' : 'text-navy-700'}`}
      >
        БСБ
      </div>
      <div className={`text-[11px] ${dark ? 'text-navy-200' : 'text-navy-400'}`}>
        Бетон • Доставка • Насос
      </div>
    </div>
  );
}
