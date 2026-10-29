"use client";

import { BulletinService, type BulletinChannel, type BulletinEvent, type CreateEventData } from "@parohia/shared";
import { useEffect, useState } from "react";
import { Button, Checkbox, Dialog, Segmented, SelectField, Switch, TextArea, TextField } from "../../../components/app/ui";
import { useToast } from "../../../components/app/toast";
import { getBrowserSupabase } from "../../../lib/supabase/client";
import { VOLUNTEERS_UNLIMITED, isUnlimitedVolunteers } from "./shared";

type PostType = CreateEventData["event_type"];

interface FormState {
  title: string;
  description: string;
  event_type: PostType;
  channel_id: string;
  event_date: string;
  event_time: string;
  location: string;
  contact_info: string;
  link: string;
  volunteers: string;
  unlimited: boolean;
}

const emptyForm = (channelId: string): FormState => ({
  title: "",
  description: "",
  event_type: "announcement",
  channel_id: channelId,
  event_date: "",
  event_time: "",
  location: "",
  contact_info: "",
  link: "",
  volunteers: "",
  unlimited: false,
});

const fromPost = (post: BulletinEvent, fallbackChannel: string): FormState => {
  const dated = post.event_type !== "announcement";
  return {
    title: post.title || "",
    description: post.description || "",
    event_type: post.event_type,
    channel_id: post.channel_id || fallbackChannel,
    event_date: dated ? post.event_date || "" : "",
    event_time: dated ? (post.event_time || "").slice(0, 5) : "",
    location: dated ? post.location || "" : "",
    contact_info: post.contact_info || "",
    link: post.link || "",
    volunteers:
      post.event_type === "volunteer" && post.volunteers_needed && post.volunteers_needed > 0
        ? String(post.volunteers_needed)
        : "",
    unlimited: post.event_type === "volunteer" && isUnlimitedVolunteers(post.volunteers_needed),
  };
};

export function PostEditorDialog({
  open,
  onClose,
  editing,
  parishId,
  userId,
  channels,
  defaultChannelId,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  editing: BulletinEvent | null;
  parishId: string;
  userId: string;
  /** Channels this user may post to. */
  channels: BulletinChannel[];
  defaultChannelId: string;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState<FormState>(() => emptyForm(defaultChannelId));
  const [notify, setNotify] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(editing ? fromPost(editing, defaultChannelId) : emptyForm(defaultChannelId));
    setNotify(false);
    setError(null);
  }, [open, editing, defaultChannelId]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((prev) => ({ ...prev, [key]: value }));

  const dated = form.event_type !== "announcement";
  const volunteerCount = parseInt(form.volunteers, 10);
  const hasVolunteerTarget = form.unlimited || (Number.isFinite(volunteerCount) && volunteerCount > 0);

  const save = async () => {
    if (!form.title.trim()) return setError("Please add a title.");
    if (!form.channel_id) return setError("Please choose a channel for this post.");
    if (!channels.some((c) => c.id === form.channel_id)) return setError("You can only post to channels you manage.");
    if (form.event_type === "volunteer" && !hasVolunteerTarget)
      return setError("Set how many volunteers you need, or choose no limit.");

    const data: CreateEventData & { notify?: boolean } = {
      title: form.title.trim(),
      description: form.description.trim(),
      event_type: form.event_type,
      channel_id: form.channel_id,
      contact_info: form.contact_info.trim(),
      link: form.link.trim(),
    };
    if (dated) {
      if (form.event_date) data.event_date = form.event_date;
      if (form.event_time) data.event_time = form.event_time;
      if (form.location.trim()) data.location = form.location.trim();
    }
    if (form.event_type === "volunteer") {
      data.volunteers_needed = form.unlimited ? VOLUNTEERS_UNLIMITED : volunteerCount;
    }

    setSaving(true);
    setError(null);
    try {
      if (editing) {
        const result = await BulletinService.updateEvent(editing.id, data);
        if (!result.success) throw new Error(result.error || "Failed to update post");
        toast("Post updated", "success");
      } else {
        if (notify) data.notify = true;
        const result = await BulletinService.createEvent(parishId, userId, data);
        if (!result.success) throw new Error(result.error || "Failed to create post");
        if (notify && result.event?.id) {
          const { error: pushError } = await getBrowserSupabase().functions.invoke("send-bulletin-push", {
            body: { parishId, eventId: result.event.id, channelId: result.event.channel_id || form.channel_id },
          });
          if (pushError) toast("Post published, but the push notification couldn't be sent", "error");
        }
        toast(notify ? "Post published and subscribers notified" : "Post published", "success");
      }
      onSaved();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      eyebrow={editing ? "Edit post" : "New post"}
      title={editing ? "Update post" : "Share with your parish"}
      width={680}
      dismissible={!saving}
      footer={
        <>
          <div className="mr-auto flex flex-wrap items-center gap-x-5 gap-y-2">
            <p className="text-[12px] text-zinc-500 dark:text-zinc-400">
              <span className="font-semibold text-red-600 dark:text-red-400">*</span> Required field
            </p>
            {!editing && (
              <label className="flex items-center gap-3 text-[13px] font-semibold text-zinc-700 dark:text-zinc-300">
                <Switch checked={notify} onChange={setNotify} label="Notify subscribers" />
                Send push notification to subscribers
              </label>
            )}
          </div>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button icon={editing ? "checkmark" : "send"} loading={saving} onClick={save}>
            {editing ? "Save changes" : "Publish"}
          </Button>
        </>
      }
    >
      {error && (
        <p role="alert" className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-[13px] text-red-700 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </p>
      )}
      <div className="mb-5 flex items-center justify-between gap-4">
        <Segmented
          value={form.event_type}
          onChange={(value) => set("event_type", value)}
          options={[
            { value: "announcement", label: "Announcement", icon: "megaphone-outline" },
            { value: "event", label: "Event", icon: "people-outline" },
            { value: "volunteer", label: "Volunteer", icon: "hand-right-outline" },
          ]}
        />
      </div>

      <div className="grid grid-cols-[1fr_220px] gap-x-4">
        <TextField
          label="Title"
          required
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder={form.event_type === "volunteer" ? "Help set up the parish hall" : "Parish picnic this Sunday"}
          autoFocus
        />
        <SelectField label="Channel" required value={form.channel_id} onChange={(e) => set("channel_id", e.target.value)}>
          {channels.length === 0 && <option value="">No channels available</option>}
          {channels.map((channel) => (
            <option key={channel.id} value={channel.id}>
              {channel.name}
            </option>
          ))}
        </SelectField>
      </div>

      <TextArea
        label="Details"
        value={form.description}
        onChange={(e) => set("description", e.target.value)}
        placeholder="Share the details your parish needs to know…"
      />

      {dated && (
        <div className="grid grid-cols-3 gap-x-4">
          <TextField label="Date" type="date" value={form.event_date} onChange={(e) => set("event_date", e.target.value)} />
          <TextField label="Time" type="time" value={form.event_time} onChange={(e) => set("event_time", e.target.value)} />
          <TextField
            label="Location"
            value={form.location}
            onChange={(e) => set("location", e.target.value)}
            placeholder="Parish hall"
          />
        </div>
      )}

      {form.event_type === "volunteer" && (
        <div className="grid grid-cols-[220px_1fr] items-center gap-x-4">
          <TextField
            label="Volunteers needed"
            type="number"
            min={1}
            value={form.unlimited ? "" : form.volunteers}
            disabled={form.unlimited}
            onChange={(e) => set("volunteers", e.target.value)}
            placeholder={form.unlimited ? "No limit" : "5"}
          />
          <Checkbox checked={form.unlimited} onChange={(value) => set("unlimited", value)} className="mt-3">
            No limit — accept any number of volunteers
          </Checkbox>
        </div>
      )}

      <TextField
        label="Contact info"
        value={form.contact_info}
        onChange={(e) => set("contact_info", e.target.value)}
        placeholder="Email or phone for questions"
      />

      <TextField
        label="Link"
        type="url"
        value={form.link}
        onChange={(e) => set("link", e.target.value)}
        placeholder="https://example.com"
      />
    </Dialog>
  );
}
