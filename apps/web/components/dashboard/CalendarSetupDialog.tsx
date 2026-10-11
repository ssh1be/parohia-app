"use client";

import { updateParishCalendarId } from "@parohia/shared";
import { useEffect, useState } from "react";
import { Icon } from "../Icon";
import { Button, Dialog, Notice, TextField } from "../app/ui";
import { useToast } from "../app/toast";

const HELP_URL = "https://xfanatical.com/blog/how-to-find-your-google-calendar-id/";

export function CalendarSetupDialog({
  open,
  onClose,
  parishId,
  initialValue = "",
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  parishId: string;
  initialValue?: string;
  onSaved: (calendarId: string) => void;
}) {
  const toast = useToast();
  const [calendarId, setCalendarId] = useState(initialValue);
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setCalendarId(initialValue);
      setError(undefined);
    }
  }, [open, initialValue]);

  const save = async () => {
    const trimmed = calendarId.trim();
    if (!trimmed) {
      setError("Please enter a valid Google Calendar ID.");
      return;
    }
    setSaving(true);
    const result = await updateParishCalendarId(parishId, trimmed);
    setSaving(false);
    if (!result.success) {
      setError(result.error || "Failed to update calendar ID.");
      return;
    }
    toast("Parish calendar connected", "success");
    onSaved(trimmed);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      eyebrow="Parish admin"
      title="Connect calendar"
      description="Link your parish Google Calendar so services and events appear for everyone."
      dismissible={!saving}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button icon="checkmark" loading={saving} onClick={save}>
            Save calendar
          </Button>
        </>
      }
    >
      <Notice tone="accent" icon="calendar-outline" title="Use your calendar's ID" className="mb-5">
        Usually an address like <strong>parish@example.com</strong> or a long{" "}
        <strong>…@group.calendar.google.com</strong> ID.
      </Notice>
      <TextField
        label="Google Calendar ID"
        required
        placeholder="parish@example.com"
        value={calendarId}
        onChange={(e) => {
          setCalendarId(e.target.value);
          setError(undefined);
        }}
        error={error}
        helper="The calendar must be public so Parohia can read events."
        autoFocus
        spellCheck={false}
        onKeyDown={(e) => e.key === "Enter" && save()}
      />
      <a
        href={HELP_URL}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-red-600 hover:underline dark:text-red-400"
      >
        <Icon name="information-circle-outline" size={15} />
        How to find your Calendar ID
      </a>
    </Dialog>
  );
}

export function CalendarSetupCallout({ onSetup }: { onSetup: () => void }) {
  return (
    <Notice
      tone="accent"
      icon="calendar-outline"
      title="Set up your parish calendar"
      action={
        <Button size="sm" icon="link-outline" onClick={onSetup}>
          Set up calendar
        </Button>
      }
    >
      Connect your Google Calendar to show parish services and events in the app and on the dashboard.
    </Notice>
  );
}
