"use client";

import { BulletinService, type BulletinEvent, type EventResponse } from "@parohia/shared";
import { useEffect, useState } from "react";
import { Icon } from "../../../components/Icon";
import { Avatar, Button, ConfirmDialog, Dialog, EmptyState, Pill, Spinner, TextArea, cx } from "../../../components/app/ui";
import { useToast } from "../../../components/app/toast";
import { formatClockTime, formatRelativeTime, parseLocalDate } from "../../../lib/format";
import { KindBadge, RESPONSE_LABEL, VolunteerProgress, channelIcon, isDatedPost } from "./shared";

interface ResponseRow {
  user_id: string;
  response_type: string;
  notes?: string | null;
  created_at: string;
  user_profile?: { full_name?: string; email?: string } | null;
}

export function PostDialog({
  post,
  onClose,
  userId,
  isAdmin,
  canManage,
  onEdit,
  onChanged,
}: {
  post: BulletinEvent | null;
  onClose: () => void;
  userId: string;
  isAdmin: boolean;
  canManage: boolean;
  onEdit: (post: BulletinEvent) => void;
  /** Reloads the feed; returns the refreshed copy of this post if it still exists. */
  onChanged: (postId: string) => Promise<BulletinEvent | null>;
}) {
  const toast = useToast();
  const [current, setCurrent] = useState<BulletinEvent | null>(post);
  const [choice, setChoice] = useState<EventResponse["response_type"]>("attending");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [responses, setResponses] = useState<ResponseRow[]>([]);
  const [responsesLoading, setResponsesLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (post) {
      setCurrent(post);
      setChoice(post.event_type === "volunteer" ? "volunteer" : "attending");
      setNotes("");
    }
  }, [post]);

  const showResponses = isAdmin && !!current && isDatedPost(current);

  useEffect(() => {
    if (!post || !isAdmin || !isDatedPost(post)) {
      setResponses([]);
      return;
    }
    setResponsesLoading(true);
    BulletinService.getEventResponses(post.id)
      .then((result) => setResponses((result.responses as ResponseRow[]) ?? []))
      .finally(() => setResponsesLoading(false));
  }, [post, isAdmin]);

  const respond = async () => {
    if (!current) return;
    setSubmitting(true);
    const result = await BulletinService.respondToEvent(current.id, userId, {
      response_type: choice,
      notes: notes.trim() || undefined,
    });
    if (!result.success) {
      toast(result.error || "Failed to submit response", "error");
      setSubmitting(false);
      return;
    }
    toast(choice === "volunteer" ? "Thank you for volunteering!" : "Response sent", "success");
    setCurrent((await onChanged(current.id)) ?? current);
    setNotes("");
    setSubmitting(false);
  };

  const removeResponse = async () => {
    if (!current) return;
    setRemoving(true);
    const result = await BulletinService.removeResponse(current.id, userId);
    if (!result.success) {
      toast(result.error || "Failed to remove response", "error");
    } else {
      toast("Response removed", "success");
      setCurrent((await onChanged(current.id)) ?? current);
    }
    setRemoving(false);
  };

  const deletePost = async () => {
    if (!current) return;
    setDeleting(true);
    const result = await BulletinService.deleteEvent(current.id);
    setDeleting(false);
    setConfirmDelete(false);
    if (!result.success) {
      toast(result.error || "Failed to delete post", "error");
      return;
    }
    toast("Post deleted", "success");
    await onChanged(current.id);
    onClose();
  };

  const post_ = current;
  const attending = responses.filter((r) => r.response_type === "attending").length;
  const unavailable = responses.filter((r) => r.response_type === "unavailable").length;

  return (
    <>
      <Dialog
        open={!!post}
        onClose={onClose}
        title={post_?.title ?? ""}
        width={640}
        footer={
          <>
            {canManage && post_ && (
              <div className="mr-auto flex gap-2">
                <Button variant="secondary" icon="create-outline" onClick={() => onEdit(post_)}>
                  Edit
                </Button>
                <Button variant="danger" icon="trash-outline" onClick={() => setConfirmDelete(true)}>
                  Delete
                </Button>
              </div>
            )}
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </>
        }
      >
        {post_ && (
          <div className="space-y-5">
            <div className="-mt-2 flex flex-wrap items-center gap-2">
              <KindBadge kind={post_.event_type} />
              {post_.channel && <Pill icon={channelIcon(post_.channel)}>{post_.channel.name}</Pill>}
              <span className="text-[12px] text-zinc-500 dark:text-zinc-400">
                {post_.created_by_profile?.full_name ? `${post_.created_by_profile.full_name} · ` : ""}
                {formatRelativeTime(post_.created_at)}
              </span>
            </div>

            {post_.description && (
              <p className="whitespace-pre-line text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300">
                {post_.description}
              </p>
            )}

            {(post_.event_date || post_.event_time || post_.location || post_.contact_info || post_.link) && (
              <dl className="grid grid-cols-2 gap-3">
                {post_.event_date && (
                  <Meta icon="calendar-outline" label="Date">
                    {parseLocalDate(post_.event_date).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </Meta>
                )}
                {post_.event_time && (
                  <Meta icon="time-outline" label="Time">
                    {formatClockTime(post_.event_time)}
                  </Meta>
                )}
                {post_.location && (
                  <Meta icon="location-outline" label="Location">
                    {post_.location}
                  </Meta>
                )}
                {post_.contact_info && (
                  <Meta icon="call-outline" label="Contact">
                    {post_.contact_info}
                  </Meta>
                )}
                {post_.link && (
                  <Meta icon="link-outline" label="Link">
                    <a
                      href={post_.link.startsWith("http") ? post_.link : `https://${post_.link}`}
                      target="_blank"
                      rel="noreferrer"
                      className="underline decoration-zinc-300 underline-offset-2 hover:decoration-zinc-500 dark:decoration-zinc-600 dark:hover:decoration-zinc-400"
                    >
                      {post_.link.replace(/^https?:\/\//i, "")}
                    </a>
                  </Meta>
                )}
              </dl>
            )}

            {post_.event_type === "volunteer" && (
              <VolunteerProgress count={post_.volunteer_count || 0} needed={post_.volunteers_needed} />
            )}

            {!isAdmin && isDatedPost(post_) && (
              <section className="border-t border-zinc-100 pt-5 dark:border-white/[0.06]">
                {post_.user_response ? (
                  <div className="flex items-center gap-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.07] p-4">
                    <Icon name="checkmark-circle" size={24} className="text-emerald-500" />
                    <div className="min-w-0 flex-1">
                      <p className="font-sans-semibold text-[15px] text-emerald-700 dark:text-emerald-400">
                        {post_.event_type === "volunteer"
                          ? "You volunteered for this"
                          : `You responded: ${RESPONSE_LABEL[post_.user_response.response_type] ?? "Attending"}`}
                      </p>
                      {post_.user_response.notes && (
                        <p className="mt-0.5 text-[13px] text-zinc-600 dark:text-zinc-300">
                          Your notes: “{post_.user_response.notes}”
                        </p>
                      )}
                    </div>
                    <Button variant="danger" size="sm" loading={removing} onClick={removeResponse}>
                      Remove response
                    </Button>
                  </div>
                ) : (
                  <>
                    <h3 className="mb-3 font-display text-[22px] text-zinc-900 dark:text-white">
                      {post_.event_type === "volunteer" ? "Can you help?" : "Will you be there?"}
                    </h3>
                    {post_.event_type === "event" ? (
                      <div className="mb-4 grid grid-cols-2 gap-2" role="radiogroup">
                        {(
                          [
                            { key: "attending", label: "Attending", icon: "checkmark-circle", tone: "emerald" },
                            { key: "unavailable", label: "Can't make it", icon: "close-circle", tone: "red" },
                          ] as const
                        ).map((option) => {
                          const active = choice === option.key;
                          return (
                            <button
                              key={option.key}
                              type="button"
                              role="radio"
                              aria-checked={active}
                              onClick={() => setChoice(option.key)}
                              className={cx(
                                "flex items-center justify-center gap-2 rounded-2xl border-2 py-3 text-[14px] font-semibold transition-colors",
                                active
                                  ? option.tone === "emerald"
                                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                    : "border-red-400 bg-red-500/10 text-red-700 dark:text-red-300"
                                  : "border-transparent bg-zinc-900/[0.04] text-zinc-500 hover:text-zinc-800 dark:bg-white/[0.05] dark:text-zinc-400"
                              )}
                            >
                              <Icon name={option.icon} size={17} />
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                    <TextArea
                      label="Notes (optional)"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Anything the organizers should know…"
                      className="min-h-[80px]"
                    />
                    <Button
                      icon={post_.event_type === "volunteer" ? "hand-right-outline" : "send"}
                      loading={submitting}
                      onClick={respond}
                      fullWidth
                      size="lg"
                    >
                      {post_.event_type === "volunteer" ? "I'll volunteer" : "Send response"}
                    </Button>
                  </>
                )}
              </section>
            )}

            {showResponses && (
              <section className="border-t border-zinc-100 pt-5 dark:border-white/[0.06]">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-display text-[22px] text-zinc-900 dark:text-white">
                    {post_.event_type === "volunteer" ? "Volunteers" : "Responses"}
                  </h3>
                  {responsesLoading && <Spinner size={14} className="text-zinc-400" />}
                </div>
                {post_.event_type === "event" && responses.length > 0 && (
                  <div className="mb-4 grid grid-cols-3 gap-2">
                    {[
                      { label: "Attending", value: attending, className: "text-emerald-600 dark:text-emerald-400" },
                      { label: "Can't make it", value: unavailable, className: "text-red-500" },
                      { label: "Total", value: responses.length, className: "text-zinc-900 dark:text-white" },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-2xl bg-zinc-900/[0.03] py-3 text-center dark:bg-white/[0.04]">
                        <p className={cx("font-display text-[28px] leading-none", stat.className)}>{stat.value}</p>
                        <p className="mt-1 text-[11px] font-medium text-zinc-500">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                )}
                {!responsesLoading && responses.length === 0 ? (
                  <EmptyState
                    compact
                    icon="people-outline"
                    title={post_.event_type === "volunteer" ? "No volunteers yet" : "No responses yet"}
                  />
                ) : (
                  <ul className="divide-y divide-zinc-100 dark:divide-white/[0.06]">
                    {responses.map((response) => {
                      const name = response.user_profile?.full_name || "Unknown member";
                      const positive = response.response_type === "attending" || response.response_type === "volunteer";
                      return (
                        <li key={`${response.user_id}-${response.created_at}`} className="flex items-start gap-3 py-3">
                          <Avatar name={name} size={32} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="truncate font-sans-semibold text-[14px] text-zinc-900 dark:text-white">{name}</p>
                              <span
                                className={cx(
                                  "rounded-full px-2.5 py-1 text-[11px] font-bold",
                                  positive
                                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                                    : "bg-red-500/10 text-red-600 dark:text-red-400"
                                )}
                              >
                                {RESPONSE_LABEL[response.response_type] ?? response.response_type}
                              </span>
                            </div>
                            {response.notes && (
                              <p className="mt-0.5 text-[13px] text-zinc-600 dark:text-zinc-300">“{response.notes}”</p>
                            )}
                            <p className="mt-0.5 text-[11px] text-zinc-400">
                              {response.user_profile?.email ? `${response.user_profile.email} · ` : ""}
                              {formatRelativeTime(response.created_at)}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            )}
          </div>
        )}
      </Dialog>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={deletePost}
        loading={deleting}
        destructive
        title="Delete this post?"
        message="It will disappear from the bulletin for everyone, along with its responses."
        confirmLabel="Delete post"
      />
    </>
  );
}

function Meta({
  icon,
  label,
  children,
}: {
  icon: "calendar-outline" | "time-outline" | "location-outline" | "call-outline" | "link-outline";
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-zinc-900/[0.03] p-3 dark:bg-white/[0.04]">
      <Icon name={icon} size={16} className="mt-0.5 text-red-500" />
      <div className="min-w-0">
        <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-400">{label}</dt>
        <dd className="mt-0.5 break-words text-[14px] text-zinc-800 dark:text-zinc-200">{children}</dd>
      </div>
    </div>
  );
}
