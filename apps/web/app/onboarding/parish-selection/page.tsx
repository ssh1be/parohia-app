"use client";

import { filterParishesBySearch, getParishes, getUserProfile, NO_PARISH_ID } from "@parohia/shared";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "../../../components/Icon";
import { Button, EmptyState, IconButton, Notice, Skeleton, TextField, cx } from "../../../components/app/ui";
import { StepHeader, useOnboarding } from "../OnboardingShell";

interface ParishOption {
  id: string;
  name: string;
  jurisdiction: string | null;
  city: string;
  state: string;
  is_verified: boolean;
}

export default function ParishSelectionStep() {
  const router = useRouter();
  const { userId, rejoin, data, updateData } = useOnboarding();
  const [parishes, setParishes] = useState<ParishOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedParishId, setSelectedParishId] = useState(
    data.selectedParishId && data.selectedParishId !== NO_PARISH_ID ? data.selectedParishId : ""
  );

  useEffect(() => {
    getParishes()
      .then((rows) => setParishes((rows ?? []) as ParishOption[]))
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, []);

  // Members whose parish was deleted land here with an existing profile
  useEffect(() => {
    if (data.fullName && data.userType) return;
    if (!rejoin) {
      router.replace("/onboarding/user-type");
      return;
    }
    getUserProfile(userId).then((profile) => {
      if (!profile) {
        router.replace("/onboarding/user-type");
        return;
      }
      updateData({
        fullName: profile.full_name,
        userType: profile.user_type,
        phoneNumber: profile.phone_number || undefined,
        email: profile.email || undefined,
      });
    });
  }, [data.fullName, data.userType, rejoin, router, updateData, userId]);

  const finish = (parishId: string) => {
    updateData({ selectedParishId: parishId, userType: data.userType || "regular_user" });
    router.push("/onboarding/complete");
  };

  const filtered = filterParishesBySearch(parishes, query);

  return (
    <>
      <StepHeader
        eyebrow={rejoin ? "Choose a parish" : "Step 3 of 3"}
        title="Find your parish"
        subtitle={
          rejoin
            ? "Your previous parish is no longer available. Select a new one to continue."
            : "Connect with your local Orthodox community."
        }
      />

      <TextField
        type="search"
        placeholder="Search by name, city, or jurisdiction"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
        leadingIcon="search"
        trailing={
          query ? <IconButton icon="close-circle" label="Clear search" size={32} onClick={() => setQuery("")} /> : null
        }
      />

      <div className="-mx-1 mb-6 h-[340px] overflow-y-auto px-1">
        {loading ? (
          <div className="space-y-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[72px] rounded-3xl" />
            ))}
          </div>
        ) : loadError ? (
          <EmptyState
            compact
            icon="warning-outline"
            title="Couldn't load parishes"
            message="Check your connection and refresh the page, or skip this step for now."
          />
        ) : parishes.length === 0 ? (
          <EmptyState
            compact
            icon="business-outline"
            title="No parishes available"
            message="You can skip this step. Parishes will appear as administrators register."
          />
        ) : filtered.length === 0 ? (
          <EmptyState compact icon="search" title="No results found" message="Try adjusting your search terms." />
        ) : (
          <ul className="space-y-2.5" role="listbox" aria-label="Parishes">
            {filtered.map((parish) => {
              const selected = parish.id === selectedParishId;
              return (
                <li key={parish.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => setSelectedParishId(parish.id)}
                    onDoubleClick={() => finish(parish.id)}
                    className={cx(
                      "flex w-full items-center gap-4 rounded-3xl border p-4 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand-red/50",
                      selected
                        ? "border-red-200 bg-red-50 dark:border-red-500/25 dark:bg-red-500/10"
                        : "border-zinc-100 bg-white hover:border-zinc-200 dark:border-white/[0.06] dark:bg-white/[0.04] dark:hover:border-white/[0.12]"
                    )}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-zinc-900/[0.05] text-zinc-500 dark:bg-white/[0.06] dark:text-zinc-400">
                      <Icon name="business-outline" size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate font-sans-semibold text-[15px] text-zinc-900 dark:text-white">
                          {parish.name}
                        </span>
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

      <Notice tone="info" icon="information-circle-outline" title="Don't see your parish?" className="mb-6">
        Let your parish priest or administrator know about Parohia so they can register.
      </Notice>

      <div className="flex items-center gap-3">
        {!rejoin && (
          <Button variant="secondary" size="lg" icon="arrow-back" onClick={() => router.push("/onboarding/profile")}>
            Back
          </Button>
        )}
        <Button
          size="lg"
          icon="checkmark-circle-outline"
          className="flex-1"
          disabled={!selectedParishId}
          onClick={() => finish(selectedParishId)}
        >
          {rejoin ? "Join parish" : "Complete registration"}
        </Button>
        <Button variant="ghost" size="lg" onClick={() => finish(NO_PARISH_ID)}>
          Skip for now
        </Button>
      </div>
    </>
  );
}
