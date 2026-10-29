"use client";

import { BulletinService, ChannelService, type BulletinChannel, type BulletinEvent } from "@parohia/shared";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "../../../components/Icon";
import { Button, Card, EmptyState, Segmented, Skeleton, Spinner, cx, useSeeMore } from "../../../components/app/ui";
import { useToast } from "../../../components/app/toast";
import { formatClockTime, formatRelativeTime } from "../../../lib/format";
import { useDashboard } from "../DashboardContext";
import { NoParishState, PageHeader } from "../DashboardShell";
import { ManageChannelsDialog } from "./ManageChannelsDialog";
import { PostDialog } from "./PostDialog";
import { PostEditorDialog } from "./PostEditorDialog";
import { DateTile, KindBadge, RESPONSE_LABEL, channelIcon, isDatedPost, isUnlimitedVolunteers } from "./shared";

type TypeFilter = "all" | BulletinEvent["event_type"];

export default function BulletinPage() {
  const { parish } = useDashboard();
  if (!parish) {
    return (
      <>
        <PageHeader eyebrow="Bulletin" title="Parish bulletin" />
        <NoParishState feature="the bulletin" />
      </>
    );
  }
  return <Bulletin parishId={parish.id} />;
}

function Bulletin({ parishId }: { parishId: string }) {
  const toast = useToast();
  const { userId, isAdmin, managedChannelIds, canPost, setChantSubscribed } = useDashboard();
  const [channels, setChannels] = useState<BulletinChannel[]>([]);
  const [posts, setPosts] = useState<BulletinEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [selected, setSelected] = useState<BulletinEvent | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<BulletinEvent | null>(null);
  const [manageOpen, setManageOpen] = useState(false);
  const [togglingChannel, setTogglingChannel] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [list, events] = await Promise.all([
      ChannelService.listChannels(parishId, { userId }).catch(() => [] as BulletinChannel[]),
      BulletinService.getParishEvents(parishId, userId, { isParishAdmin: isAdmin }).catch(() => {
        toast("Failed to load bulletin posts", "error");
        return [] as BulletinEvent[];
      }),
    ]);
    setChannels(list);
    setPosts(events);
    setLoading(false);
    return events;
  }, [isAdmin, parishId, toast, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const visibleChannels = isAdmin ? channels : channels.filter((c) => c.is_subscribed || c.is_default);
  const channelList = useSeeMore(channels, 5);
  const postableChannels = isAdmin ? channels : channels.filter((c) => managedChannelIds.includes(c.id));
  const defaultChannelId = isAdmin ? channels.find((c) => c.is_default)?.id || channels[0]?.id || "" : managedChannelIds[0] || "";

  useEffect(() => {
    if (channelFilter !== "all" && !visibleChannels.some((c) => c.id === channelFilter)) setChannelFilter("all");
  }, [channelFilter, visibleChannels]);

  const filtered = useMemo(
    () =>
      posts.filter(
        (p) => (typeFilter === "all" || p.event_type === typeFilter) && (channelFilter === "all" || p.channel_id === channelFilter)
      ),
    [posts, typeFilter, channelFilter]
  );

  const refreshPost = async (postId: string) => {
    const events = await load();
    const updated = events.find((e) => e.id === postId) ?? null;
    return updated;
  };

  const toggleSubscription = async (channel: BulletinChannel) => {
    setTogglingChannel(channel.id);
    const result = channel.is_subscribed
      ? await ChannelService.unsubscribe(channel.id, userId)
      : await ChannelService.subscribe(channel.id, userId);
    setTogglingChannel(null);
    if (!result.success) return toast(result.error || "Couldn't update channel", "error");
    if (channel.is_chant) setChantSubscribed(!channel.is_subscribed);
    toast(channel.is_subscribed ? `Left #${channel.name}` : `Joined #${channel.name}`, "success");
    await load();
  };

  const canManagePost = (post: BulletinEvent) => isAdmin || (!!post.channel_id && managedChannelIds.includes(post.channel_id));

  return (
    <>
      <PageHeader
        eyebrow="Bulletin"
        title="Parish bulletin"
        description={isAdmin ? "Every post across your parish channels." : "Posts from the channels you follow."}
        actions={
          canPost && (
            <Button
              icon="add"
              onClick={() => {
                setEditing(null);
                setEditorOpen(true);
              }}
            >
              New post
            </Button>
          )
        }
      />

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8">
          <div className="mb-5 flex items-center justify-between gap-4">
            <Segmented
              value={typeFilter}
              onChange={setTypeFilter}
              options={[
                { value: "all", label: "All" },
                { value: "announcement", label: "Announcements" },
                { value: "event", label: "Events" },
                { value: "volunteer", label: "Volunteer" },
              ]}
            />
            <span className="text-[13px] font-semibold text-zinc-500 dark:text-zinc-400">
              {channelFilter === "all" ? "All channels" : `#${channels.find((c) => c.id === channelFilter)?.name ?? ""}`}
            </span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[120px] rounded-[28px]" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <Card>
              <EmptyState
                icon="newspaper-outline"
                title={posts.length === 0 ? "No posts yet" : "No matching posts"}
                message={
                  posts.length === 0
                    ? canPost
                      ? "Create the first post to share news with your parish."
                      : "Check back later for announcements."
                    : "Try a different filter."
                }
              />
            </Card>
          ) : (
            <ul className="space-y-3">
              {filtered.map((post) => (
                <li key={post.id}>
                  <PostCard post={post} onOpen={() => setSelected(post)} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <aside className="col-span-4 space-y-6">
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-[22px] text-zinc-900 dark:text-white">Channels</h2>
              {isAdmin && (
                <Button size="sm" variant="secondary" icon="settings-outline" onClick={() => setManageOpen(true)}>
                  Manage
                </Button>
              )}
            </div>
            {loading ? (
              <Skeleton className="h-40" />
            ) : (
              <>
                <ul className="space-y-0.5">
                  {channelList.visible.map((channel) => {
                    const visible = visibleChannels.some((c) => c.id === channel.id);
                    const managed = managedChannelIds.includes(channel.id);
                    return (
                      <li key={channel.id} className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={!visible}
                          onClick={() => setChannelFilter(channelFilter === channel.id ? "all" : channel.id)}
                          className={cx(
                            "flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors disabled:cursor-default",
                            channelFilter === channel.id
                              ? "bg-red-600/[0.08] dark:bg-red-500/[0.12]"
                              : visible && "hover:bg-zinc-900/[0.04] dark:hover:bg-white/[0.05]"
                          )}
                        >
                          <Icon
                            name={channelIcon(channel)}
                            size={15}
                            className={visible ? "text-zinc-500" : "text-zinc-300 dark:text-zinc-600"}
                          />
                          <span
                            className={cx(
                              "truncate text-[14px] font-semibold",
                              visible ? "text-zinc-800 dark:text-zinc-100" : "text-zinc-400 dark:text-zinc-500"
                            )}
                          >
                            {channel.name}
                          </span>
                          {managed && (
                            <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-300">
                              Manager
                            </span>
                          )}
                          {isAdmin && !!channel.manager_count && (
                            <span className="ml-auto text-[11px] text-zinc-400">
                              {channel.manager_count} {channel.manager_count === 1 ? "manager" : "managers"}
                            </span>
                          )}
                        </button>
                        {!isAdmin && !channel.is_default && managed && channel.is_subscribed ? (
                          <span
                            title="You manage this channel. Ask a parish admin to remove you as a manager before leaving."
                            aria-label={`Managing ${channel.name}`}
                            className="flex h-8 w-8 shrink-0 items-center justify-center text-zinc-300 dark:text-zinc-600"
                          >
                            <Icon name="lock-closed" size={13} />
                          </span>
                        ) : !isAdmin && !channel.is_default && (
                          <button
                            type="button"
                            disabled={togglingChannel === channel.id}
                            onClick={() => toggleSubscription(channel)}
                            aria-label={channel.is_subscribed ? `Leave ${channel.name}` : `Join ${channel.name}`}
                            title={channel.is_subscribed ? "Leave channel" : "Join channel"}
                            className={cx(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand-red/50 disabled:opacity-50",
                              channel.is_subscribed
                                ? "text-zinc-400 hover:bg-red-600/10 hover:text-red-600 dark:hover:bg-red-500/15 dark:hover:text-red-400"
                                : "bg-zinc-900/[0.06] text-zinc-700 hover:bg-zinc-900/[0.1] hover:text-zinc-900 dark:bg-white/[0.08] dark:text-zinc-200 dark:hover:bg-white/[0.14] dark:hover:text-white"
                            )}
                          >
                            {togglingChannel === channel.id ? (
                              <Spinner size={13} />
                            ) : (
                              <Icon name={channel.is_subscribed ? "close" : "add"} size={15} />
                            )}
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
                {channelList.toggle}
              </>
            )}
            {!isAdmin && (
              <p className="mt-3 text-[12px] leading-5 text-zinc-500 dark:text-zinc-400">
                Everyone follows General, and managers follow the channels they manage. Join other channels to see
                their posts.
              </p>
            )}
          </Card>
        </aside>
      </div>

      <PostDialog
        post={selected}
        onClose={() => setSelected(null)}
        userId={userId}
        isAdmin={isAdmin}
        canManage={!!selected && canManagePost(selected)}
        onEdit={(post) => {
          setSelected(null);
          setEditing(post);
          setEditorOpen(true);
        }}
        onChanged={refreshPost}
      />

      <PostEditorDialog
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        editing={editing}
        parishId={parishId}
        userId={userId}
        channels={postableChannels}
        defaultChannelId={defaultChannelId}
        onSaved={() => void load()}
      />

      {isAdmin && (
        <ManageChannelsDialog
          open={manageOpen}
          onClose={() => setManageOpen(false)}
          parishId={parishId}
          adminUserId={userId}
          channels={channels}
          onChanged={async () => {
            await load();
          }}
        />
      )}
    </>
  );
}

function PostCard({ post, onOpen }: { post: BulletinEvent; onOpen: () => void }) {
  const dated = isDatedPost(post) && !!post.event_date;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full gap-4 rounded-[28px] border border-zinc-200/80 bg-white p-5 text-left shadow-[0_1px_2px_rgba(9,9,11,0.04)] outline-none transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:border-zinc-300 hover:shadow-md focus-visible:ring-2 focus-visible:ring-brand-red/50 dark:border-white/[0.08] dark:bg-white/[0.03] dark:hover:border-white/[0.14]"
    >
      {dated && <DateTile value={post.event_date!} />}
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <KindBadge kind={post.event_type} />
          {post.channel && !post.channel.is_default && (
            <span className="text-[12px] font-semibold text-zinc-500 dark:text-zinc-400">#{post.channel.name}</span>
          )}
          <span className="ml-auto text-[12px] text-zinc-400">{formatRelativeTime(post.created_at)}</span>
        </div>
        <h3 className="font-sans-bold text-[16px] text-zinc-900 dark:text-white">{post.title}</h3>
        {post.description && (
          <p className="mt-1 line-clamp-2 text-[14px] leading-relaxed text-zinc-600 dark:text-zinc-400">{post.description}</p>
        )}
        {(post.event_time || post.location || post.user_response || post.event_type === "volunteer") && (
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-zinc-500 dark:text-zinc-400">
            {post.event_time && (
              <span className="flex items-center gap-1">
                <Icon name="time-outline" size={13} />
                {formatClockTime(post.event_time)}
              </span>
            )}
            {post.location && (
              <span className="flex items-center gap-1">
                <Icon name="location-outline" size={13} />
                {post.location}
              </span>
            )}
            {post.event_type === "volunteer" && (
              <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                <Icon name="people-outline" size={13} />
                {isUnlimitedVolunteers(post.volunteers_needed)
                  ? `${post.volunteer_count || 0} signed up`
                  : `${post.volunteer_count || 0} of ${post.volunteers_needed || 0} volunteers`}
              </span>
            )}
            {post.user_response && (
              <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                <Icon name="checkmark-circle" size={13} />
                {RESPONSE_LABEL[post.user_response.response_type] ?? "Responded"}
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}
