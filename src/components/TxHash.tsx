import { STUDIO_NEXT_EXPLORER } from "@/lib/contract";

export function TxHash({ hash }: { hash: string }) {
  if (!hash) return null;
  const href = `${STUDIO_NEXT_EXPLORER}/tx/${hash}`;
  return (
    <p className="break-all font-mono text-[12px] text-on-surface-variant">
      Studio Next tx:{" "}
      <a href={href} target="_blank" rel="noreferrer" className="text-primary underline">
        {hash}
      </a>
    </p>
  );
}
