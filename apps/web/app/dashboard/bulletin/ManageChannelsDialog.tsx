"use client";

import { ChannelService, getParishMembers, type BulletinChannel, type ParishMember } from "@parohia/shared";
import { useEffect, useState } from "react";
import { Icon } from "../../../components/Icon";
import { channelIcon } from "./shared";
import {
  Avatar,
  Button,
  Checkbox,
  ConfirmDialog,
  Dialog,
  EmptyState,
  IconButton,
  Pill,
  Skeleton,
  TextField,
  cx,
} from "../../../components/app/ui";
import { useToast } from "../../../components/app/toast";

export function ManageChannelsDialog({
  open,
  onClose,
  parishId,
  adminUserId,
  channels,
  onChanged,
}: {
  open: boolean;
  onClose: () => void;
  parishId: string;
  adminUserId: string;
  channels: BulletinChannel[];
  onChanged: () => Promise<void>;
}) {
  const toast = useToast();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [members, setMembers] = useState<ParishMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelectedId((prev) => (prev && channels.some((c) => c.id === prev) ? prev : channels[0]?.id ?? null));
    setMembersLoading(true);
    getParishMembers(parishId, adminUserId)
      .then(setMembers)
      .finally(() => setMembersLoading(false));
  }, [open, parishId, adminUserId, channels]);

  const selected = channels.find((c) => c.id === selectedId) ?? null;

  const create = async () => {
    setCreating(true);
    const result = await ChannelService.createChannel(parishId, adminUserId, newName, newDescription);
    setCreating(false);
    if (!result.success) {
      toast(result.error || "Failed to create channel", "error");
      return;
    }
    toast(`Created #${result.channel?.name}`, "success");
    setNewName("");
    setNewDescription("");
    await onChanged();
    if (result.channel) setSelectedId(result.channel.id);
  };

  return (
    <Dialog open={open} onClose={onClose} eyebrow="Parish admin" title="Manage channels" width={880}>
      <div className="grid min-h-[420px] grid-cols-[260px_1fr] gap-6">
        <div className="flex flex-col">
          <ul className="space-y-1">
            {channels.map((channel) => (
              <li key={channel.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(channel.id)}
                  className={cx(
                    "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[14px] font-semibold transition-colors",
                    channel.id === selectedId
                      ? "bg-red-600/[0.08] text-red-700 dark:bg-red-500/[0.12] dark:text-red-300"
                      : "text-zinc-700 hover:bg-zinc-900/[0.04] dark:text-zinc-300 dark:hover:bg-white/[0.05]"
                  )}
                >
                  <Icon
                    name={channelIcon(channel)}
                    size={15}
                  />
                  <span className="flex-1 truncate">{channel.name}</span>
                  {!!channel.manager_count && <span className="text-[11px] text-zinc-400">{channel.manager_count}</span>}
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-auto rounded-2xl border border-dashed border-zinc-200 p-3 pt-4 dark:border-white/10">
            <TextField
              label="New channel"
              placeholder="Youth group"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && newName.trim() && create()}
              containerClassName="mb-2"
            />
            <TextField
              placeholder="Description (optional)"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              containerClassName="mb-3"
            />
            <Button size="sm" icon="add" fullWidth loading={creating} disabled={!newName.trim()} onClick={create}>
              Create channel
            </Button>
          </div>
        </div>

        <div className="min-w-0 border-l border-zinc-100 pl-6 dark:border-white/[0.06]">
          {selected ? (
            <ChannelDetail
              key={selected.id}
              channel={selected}
              members={members}
              membersLoading={membersLoading}
              adminUserId={adminUserId}
              onChanged={onChanged}
            />
          ) : (
            <EmptyState icon="chatbubbles-outline" title="No channels yet" />
          )}
        </div>
      </div>
    </Dialog>
  );
}

function ChannelDetail({
  channel,
  members,
  membersLoading,
  adminUserId,
  onChanged,
}: {
  channel: BulletinChannel;
  members: ParishMember[];
  membersLoading: boolean;
  adminUserId: string;
  onChanged: () => Promise<void>;
}) {
  const toast = useToast();
  const locked = channel.is_default || channel.is_chant;
  const [name, setName] = useState(channel.name);
  const [description, setDescription] = useState(channel.description ?? "");
  const [savingName, setSavingName] = useState(false);
  const [managerIds, setManagerIds] = useState<string[]>(channel.manager_ids ?? []);
  const [savingManagers, setSavingManagers] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [query, setQuery] = useState("");

  const managersDirty =
    managerIds.length !== (channel.manager_ids ?? []).length ||
    managerIds.some((id) => !(channel.manager_ids ?? []).includes(id));
  const nameDirty = name.trim() !== channel.name || (description.trim() || "") !== (channel.description ?? "");

  const saveName = async () => {
    setSavingName(true);
    const result = await ChannelService.renameChannel(channel.id, name, description);
    setSavingName(false);
    if (!result.success) return toast(result.error || "Failed to rename channel", "error");
    toast("Channel updated", "success");
    await onChanged();
  };

  const saveManagers = async () => {
    setSavingManagers(true);
    const result = await ChannelService.setChannelManagers(channel.id, managerIds, adminUserId);
    setSavingManagers(false);
    if (!result.success) return toast(result.error || "Failed to update managers", "error");
    toast("Managers updated", "success");
    await onChanged();
  };

  const archive = async () => {
    setArchiving(true);
    const result = await ChannelService.archiveChannel(channel.id);
    setArchiving(false);
    setConfirmArchive(false);
    if (!result.success) return toast(result.error || "Failed to archive channel", "error");
    toast(`Archived #${channel.name}`, "success");
    await onChanged();
  };

  const candidates = members
    .filter((m) => m.user_id !== adminUserId)
    .filter((m) => !query.trim() || `${m.full_name} ${m.email}`.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display text-[26px] leading-tight text-zinc-900 dark:text-white">{channel.name}</h3>
            {channel.is_default && <Pill>Default</Pill>}
            {channel.is_chant && <Pill icon="musical-notes-outline">Opt-in</Pill>}
          </div>
          <p className="mt-0.5 text-[13px] text-zinc-500 dark:text-zinc-400">
            {channel.is_default
              ? "Every member is subscribed to General."
              : channel.is_chant
                ? "Members opt in to see chant sign-ups for services."
                : channel.description || "Members choose to join this channel."}
          </p>
        </div>
        {!locked && (
          <Button variant="danger" size="sm" icon="archive-outline" onClick={() => setConfirmArchive(true)}>
            Archive
          </Button>
        )}
      </div>

      {!locked && (
        <div className="mb-6 grid grid-cols-[1fr_1fr_auto] items-end gap-3">
          <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} containerClassName="mb-0" />
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            containerClassName="mb-0"
          />
          <Button variant="secondary" loading={savingName} disabled={!nameDirty || !name.trim()} onClick={saveName} className="h-12">
            Save
          </Button>
        </div>
      )}

      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className="font-sans-bold text-[15px] text-zinc-900 dark:text-white">Channel managers</p>
          <p className="text-[12px] text-zinc-500 dark:text-zinc-400">Managers can publish and edit posts in this channel.</p>
        </div>
        <Button size="sm" loading={savingManagers} disabled={!managersDirty} onClick={saveManagers}>
          Save managers
        </Button>
      </div>
      <TextField
        placeholder="Search members"
        leadingIcon="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        trailing={query ? <IconButton icon="close-circle" label="Clear" size={30} onClick={() => setQuery("")} /> : null}
        containerClassName="mb-2"
      />
      <div className="max-h-[260px] overflow-y-auto rounded-2xl border border-zinc-100 dark:border-white/[0.06]">
        {membersLoading ? (
          <div className="space-y-2 p-3">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        ) : candidates.length === 0 ? (
          <EmptyState compact icon="people-outline" title="No members found" />
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-white/[0.06]">
            {candidates.map((member) => (
              <li key={member.user_id} className="px-3 py-2.5">
                <Checkbox
                  checked={managerIds.includes(member.user_id)}
                  onChange={(checked) =>
                    setManagerIds((prev) =>
                      checked ? [...prev, member.user_id] : prev.filter((id) => id !== member.user_id)
                    )
                  }
                >
                  <span className="flex items-center gap-2.5">
                    <Avatar name={member.full_name} size={26} />
                    <span>
                      <span className="block font-sans-semibold text-[13px] text-zinc-900 dark:text-white">{member.full_name}</span>
                      <span className="block text-[12px] text-zinc-500">{member.email}</span>
                    </span>
                  </span>
                </Checkbox>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={confirmArchive}
        onClose={() => setConfirmArchive(false)}
        onConfirm={archive}
        loading={archiving}
        destructive
        title={`Archive #${channel.name}?`}
        message="Posts in this channel will be hidden from the bulletin and members will no longer see it."
        confirmLabel="Archive channel"
      />
    </div>
  );
}
