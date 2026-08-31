import type { ReactNode } from "react";
import { Icon } from "./Icon";

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="border border-outline bg-surface-container-low p-8 text-center">
      <Icon name="inventory_2" className="text-outline" />
      <h2 className="mt-3 text-2xl font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-on-surface-variant">{body}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
