"use client";

import { filterParishesBySearch, getParishes } from "@parohia/shared";
import { useEffect, useState } from "react";
import { Icon } from "../Icon";
import { EmptyState, IconButton, Skeleton, TextField, cx } from "../app/ui";

export interface ParishOption {
  id: string;
  name: string;
  jurisdiction: string | null;
  city: string;
  state: string;
  is_verified: boolean;
}

/** Searchable parish list used for joining or switching parishes. */
export function ParishPicker({
  selectedId,
  onSelect,
  excludeId,
  height = 360,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
  excludeId?: string;
  height?: number;
}) {
  const [parishes, setParishes] = useState<ParishOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    getParishes()
      .then((rows) => setParishes(((rows ?? []) as ParishOption[]).filter((p) => p.id !== excludeId)))
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, [excludeId]);

  const filtered = filterParishesBySearch(parishes, query);

  return (
    <div>
      <TextField
        type="search"
        placeholder="Search by name, city, or jurisdiction"
        leadingIcon="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
        trailing={query ? <IconButton icon="close-circle" label="Clear search" size={32} onClick={() => setQuery("")} /> : null}
      />
      <div className="-mx-1 overflow-y-auto px-1" style={{ height }}>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[68px] rounded-3xl" />
            ))}
          </div>
        ) : failed ? (
          <EmptyState compact icon="warning-outline" title="Couldn't load parishes" message="Refresh the page and try again." />
        ) : filtered.length === 0 ? (
          <EmptyState
            compact
            icon={parishes.length === 0 ? "business-outline" : "search"}
            title={parishes.length === 0 ? "No parishes available" : "No results found"}
            message={parishes.length === 0 ? "Parishes appear here as administrators register." : "Try adjusting your search terms."}
          />
        ) : (
          <ul className="space-y-2" role="listbox" aria-label="Parishes">
            {filtered.map((parish) => {
              const selected = parish.id === selectedId;
              return (
                <li key={parish.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => onSelect(parish.id)}
                    className={cx(
                      "flex w-full items-center gap-4 rounded-3xl border p-4 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand-red/50",
                      selected
                        ? "border-red-200 bg-red-50 dark:border-red-500/25 dark:bg-red-500/10"
                        : "border-zinc-100 bg-white hover:border-zinc-200 dark:border-white/[0.06] dark:bg-white/[0.04] dark:hover:border-white/[0.12]"
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate font-sans-semibold text-[15px] text-zinc-900 dark:text-white">{parish.name}</span>
                        <Icon
                          name={parish.is_verified ? "checkmark-circle" : "alert-circle"}
                          size={14}
                          className={parish.is_verified ? "text-green-600" : "text-amber-500"}
                        />
                      </span>
                      <span className="mt-0.5 block truncate text-[13px] text-zinc-500 dark:text-zinc-400">
                        {parish.city}, {parish.state}
                        {parish.jurisdiction ? ` · ${parish.jurisdiction}` : ""}
                      </span>
                    </span>
                    <span
                      className={cx(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2",
                        selected ? "border-red-600 bg-red-600 text-white" : "border-zinc-300 dark:border-white/20"
                      )}
                    >
                      {selected && <Icon name="checkmark" size={14} />}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
