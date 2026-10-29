"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { Icon } from "../Icon";
import { Button, Dialog, cx } from "../app/ui";
import { useToast } from "../app/toast";
import { eventKindStyle, type EventKind } from "../phone/tokens";

/** Google Calendar descriptions often arrive as HTML. */
export const plainDescription = (value?: string) =>
  (value ?? "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

/** Event sheet matching the app: time, copyable location, note, description, and Directions. */
export function EventDetailDialog({
  open,
  onClose,
  eyebrow,
  title,
  when,
  whenDetail,
  location,
  link,
  description,
  notes,
  secondaryAction,
  children,
}: {
  open: boolean;
  onClose: () => void;
  eyebrow: string;
  title: string;
  when?: string;
  whenDetail?: string;
  location?: string;
  link?: string;
  description?: string;
  notes?: string;
  secondaryAction?: { label: string; href: string };
  children?: ReactNode;
}) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const body = plainDescription(description);

  useEffect(() => {
    if (!open) setCopied(false);
  }, [open]);

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(timeout);
  }, [copied]);

  const copyAddress = async () => {
    if (!location) return;
    try {
      await navigator.clipboard.writeText(location);
      setCopied(true);
    } catch {
      toast("Couldn't copy the address", "error");
    }
  };

  const pillLink =
    "inline-flex h-10 items-center gap-2 rounded-full bg-zinc-900/[0.05] px-5 text-sm font-semibold text-zinc-800 transition-colors hover:bg-zinc-900/[0.09] dark:bg-white/[0.07] dark:text-zinc-100 dark:hover:bg-white/[0.12]";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      eyebrow={eyebrow}
      title={title}
      width={620}
      footer={
        <>
          <div className="mr-auto flex gap-2">
            {location && (
              <a
                href={`https://maps.google.com/maps?q=${encodeURIComponent(location)}`}
                target="_blank"
                rel="noreferrer"
                className={pillLink}
              >
                <Icon name="navigate" size={16} />
                Directions
              </a>
            )}
            {link?.trim() && (
              <a
                href={link.trim().startsWith("http") ? link.trim() : `https://${link.trim()}`}
                target="_blank"
                rel="noreferrer"
                className={pillLink}
              >
                <Icon name="open-outline" size={16} />
                Open link
              </a>
            )}
            {secondaryAction && (
              <Link href={secondaryAction.href} onClick={onClose} className={pillLink}>
                {secondaryAction.label}
                <Icon name="arrow-forward" size={15} />
              </Link>
            )}
          </div>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </>
      }
    >
      {(when || location || link?.trim()) && (
        <div className="overflow-hidden rounded-3xl border border-zinc-100 bg-zinc-50 dark:border-white/[0.06] dark:bg-white/[0.04]">
          {when && (
            <div className="flex items-center gap-3.5 px-5 py-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-600/10 text-red-600 dark:text-red-400">
                <Icon name="time-outline" size={20} />
              </span>
              <div className="min-w-0">
                <p className="font-sans-semibold text-[17px] text-zinc-900 dark:text-white">{when}</p>
                {whenDetail && <p className="mt-0.5 text-[13px] text-zinc-500 dark:text-zinc-400">{whenDetail}</p>}
              </div>
            </div>
          )}

          {location && (
            <button
              type="button"
              onClick={copyAddress}
              aria-label={`Copy address: ${location}`}
              className={cx(
                "group flex w-full items-center gap-3.5 px-5 py-4 text-left outline-none transition-colors hover:bg-zinc-900/[0.03] focus-visible:bg-zinc-900/[0.03] dark:hover:bg-white/[0.04]",
                when && "border-t border-zinc-100 dark:border-white/[0.06]"
              )}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Icon name="location-outline" size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-medium leading-snug text-zinc-900 dark:text-white">{location}</span>
                <span
                  className={cx(
                    "mt-0.5 block text-[12px] font-semibold",
                    copied ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400 group-hover:text-zinc-500"
                  )}
                >
                  {copied ? "Copied to clipboard" : "Click to copy address"}
                </span>
              </span>
              <Icon
                name={copied ? "checkmark-circle" : "copy-outline"}
                size={18}
                className={copied ? "text-emerald-500" : "text-zinc-400"}
              />
            </button>
          )}

          {link?.trim() && (
            <a
              href={link.trim().startsWith("http") ? link.trim() : `https://${link.trim()}`}
              target="_blank"
              rel="noreferrer"
              className={cx(
                "group flex w-full items-center gap-3.5 px-5 py-4 text-left outline-none transition-colors hover:bg-zinc-900/[0.03] focus-visible:bg-zinc-900/[0.03] dark:hover:bg-white/[0.04]",
                (when || location) && "border-t border-zinc-100 dark:border-white/[0.06]"
              )}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-600/10 text-red-600 dark:text-red-400">
                <Icon name="link-outline" size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-medium leading-snug text-zinc-900 dark:text-white">
                  {link.trim().replace(/^https?:\/\//i, "")}
                </span>
                <span className="mt-0.5 block text-[12px] font-semibold text-zinc-400 group-hover:text-zinc-500">
                  Open in browser
                </span>
              </span>
              <Icon name="open-outline" size={18} className="text-zinc-400" />
            </a>
          )}
        </div>
      )}

      {notes && (
        <div className="mt-5 rounded-2xl border border-amber-500/15 bg-amber-500/[0.08] px-4 py-3">
          <p className="mb-1 font-sans-bold text-[11px] uppercase tracking-[0.1em] text-amber-700 dark:text-amber-400">Your note</p>
          <p className="text-[14px] leading-5 text-zinc-700 dark:text-zinc-300">{notes}</p>
        </div>
      )}

      {body && <p className="mt-5 whitespace-pre-line text-[15px] leading-[1.6] text-zinc-700 dark:text-zinc-300">{body}</p>}

      {children}
    </Dialog>
  );
}

/** A confession, RSVP, or volunteer sign-up from the user's schedule. */
export interface PersonalDetail {
  kind: EventKind;
  title: string;
  when: string;
  whenDetail?: string;
  location?: string;
  link?: string;
  description?: string;
  notes?: string;
  href: string;
  hrefLabel: string;
}

export function PersonalEventDialog({ detail, onClose }: { detail: PersonalDetail | null; onClose: () => void }) {
  const [shown, setShown] = useState(detail);
  useEffect(() => {
    if (detail) setShown(detail);
  }, [detail]);

  return (
    <EventDetailDialog
      open={!!detail}
      onClose={onClose}
      eyebrow={shown ? eventKindStyle[shown.kind].label : ""}
      title={shown?.title ?? ""}
      when={shown?.when}
      whenDetail={shown?.whenDetail}
      location={shown?.location}
      link={shown?.link}
      description={shown?.description}
      notes={shown?.notes}
      secondaryAction={shown ? { label: shown.hrefLabel, href: shown.href } : undefined}
    />
  );
}
