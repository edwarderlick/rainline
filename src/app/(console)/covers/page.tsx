"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CoverCard } from "@/components/CoverCard";
import { EmptyState } from "@/components/EmptyState";
import { Icon } from "@/components/Icon";
import { LoadingState } from "@/components/LoadingState";
import { DEMO_COVERS, asDisplay, type DisplayCover } from "@/lib/demo";
import { TEMPLATES } from "@/lib/templates";
import type { CoverState } from "@/lib/contract";
import { hasContract } from "@/lib/genlayer";
import { readCover, readCoverIds } from "@/lib/rainline";
import Link from "next/link";

type Filter = "ALL" | "OPEN" | "SETTLED";
type TemplateFilter = "ALL" | "RAIN" | "DRY" | "HEAT";

function isSettled(state: CoverState) {
  return state !== "OPEN";
}

function applyFilters(
  rows: DisplayCover[],
  filter: Filter,
  template: TemplateFilter,
  query: string
) {
  return rows.filter((c) => {
    if (filter === "OPEN" && c.state !== "OPEN") return false;
    if (filter === "SETTLED" && !isSettled(c.state)) return false;
    if (template !== "ALL" && c.template !== template) return false;
    if (query) {
      const q = query.toLowerCase();
      return (
        c.id.toLowerCase().includes(q) ||
        c.place.toLowerCase().includes(q) ||
        c.template.toLowerCase().includes(q)
      );
    }
    return true;
  });
}

export default function CoversPage() {
  const [filter, setFilter] = useState<Filter>("ALL");
  const [template, setTemplate] = useState<TemplateFilter>("ALL");
  const [query, setQuery] = useState("");
  const [live, setLive] = useState<DisplayCover[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const refresh = useCallback(async () => {
    if (!hasContract()) {
      setLive([]);
      return;
    }
    setLoading(true);
    setLoadError("");
    try {
      const ids = await readCoverIds();
      const rows: DisplayCover[] = [];
      for (const id of ids) {
        const cover = await readCover(id);
        if (cover) rows.push(asDisplay(cover, false));
      }
      setLive(rows);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "list_cover_ids failed");
      setLive([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const liveRows = useMemo(
    () => applyFilters(live, filter, template, query),
    [live, filter, template, query]
  );
  const demoRows = useMemo(
    () => applyFilters(DEMO_COVERS, filter, template, query),
    [filter, template, query]
  );

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 border-b border-outline-variant pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="font-mono text-[12px] uppercase tracking-widest text-on-surface-variant">
            [01] Browse covers
          </span>
          <h1 className="font-sans text-[48px] font-extrabold leading-[52px] tracking-tight md:text-[80px] md:leading-[72px]">
            Registry.
          </h1>
        </div>
        <div className="flex items-center gap-4 border border-outline-variant bg-surface-container-high px-4 py-2">
          <div className="flex flex-col gap-1 border-r border-outline-variant pr-4">
            <span className="font-mono text-[10px] font-bold uppercase text-on-surface-variant">
              Demo rows
            </span>
            <span className="text-2xl font-bold">{DEMO_COVERS.length}</span>
          </div>
          <div className="flex flex-col gap-1 pl-2">
            <span className="font-mono text-[10px] font-bold uppercase text-on-surface-variant">
              Live covers
            </span>
            <span className="text-2xl font-bold text-primary">
              {hasContract() ? live.length : "after deploy"}
            </span>
          </div>
        </div>
      </div>

      <div className="mb-8 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 border border-outline-variant bg-surface-container p-1">
          {(["ALL", "OPEN", "SETTLED"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 font-mono text-[12px] uppercase tracking-wide ${
                filter === f ? "bg-on-surface text-surface" : "text-on-surface-variant hover:bg-surface-variant"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 border border-outline-variant bg-surface-container p-1">
          <button
            type="button"
            onClick={() => setTemplate("ALL")}
            className={`px-4 py-1.5 font-mono text-[12px] uppercase ${
              template === "ALL" ? "bg-surface-variant text-on-surface" : "text-on-surface-variant"
            }`}
          >
            All
          </button>
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTemplate(t.id)}
              className={`flex items-center gap-2 px-4 py-1.5 font-mono text-[12px] uppercase ${
                template === t.id ? "bg-surface-variant text-on-surface" : "text-on-surface-variant"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative ml-auto w-full md:w-64">
          <Icon name="search" className="absolute top-1/2 left-3 -translate-y-1/2 text-[18px] text-on-surface-variant" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="SEARCH COVERS..."
            className="w-full border border-outline-variant bg-surface-container py-2 pr-4 pl-10 font-mono text-[12px] uppercase outline-none focus:border-primary"
          />
        </div>
      </div>

      {loading ? <LoadingState rows={3} /> : null}
      {loadError ? (
        <p className="mb-4 font-mono text-[12px] text-error">{loadError}</p>
      ) : null}

      {!loading && liveRows.length === 0 && demoRows.length === 0 ? (
        <EmptyState
          title="No covers in this filter"
          body="Live rows load from list_cover_ids after deploy. Demo rows are labeled DEMO and are not live millimetres."
          action={
            <Link
              href="/buy"
              className="inline-block border border-primary bg-primary px-6 py-3 font-mono text-[12px] uppercase text-on-primary"
            >
              buy_cover
            </Link>
          }
        />
      ) : (
        <div className="space-y-10">
          {liveRows.length > 0 ? (
            <section>
              <h2 className="mb-4 font-mono text-[12px] uppercase tracking-widest text-on-surface-variant">
                Live · list_cover_ids
              </h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {liveRows.map((cover) => (
                  <CoverCard key={cover.id} cover={cover} />
                ))}
              </div>
            </section>
          ) : null}
          {demoRows.length > 0 ? (
            <section>
              <h2 className="mb-4 font-mono text-[12px] uppercase tracking-widest text-on-surface-variant">
                Demo · not on-chain
              </h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {demoRows.map((cover) => (
                  <CoverCard key={cover.id} cover={cover} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
      <p className="mt-6 font-mono text-[12px] text-on-surface-variant">
        Sample rows are labeled DEMO. Templates: {TEMPLATES.map((t) => t.id).join(", ")}. No
        custom text. Paid is shown only on RESOLVED_PAY, INSUFFICIENT, or CANCELED.
      </p>
    </div>
  );
}
