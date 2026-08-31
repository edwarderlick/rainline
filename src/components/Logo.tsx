export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.svg"
        alt="AP"
        width={32}
        height={32}
        className="h-7 w-7 shrink-0 md:h-8 md:w-8"
      />
      {compact ? null : (
        <span className="truncate font-sans text-[18px] font-semibold leading-7 tracking-tight text-primary md:text-[24px]">
          Rainline
        </span>
      )}
    </span>
  );
}
