"use client";

import {
  addClergyMember,
  cleanDonationUrl,
  deleteClergyMember,
  getParishMembers,
  switchUserParish,
  updateClergyMember,
  updateParishDetails,
  updateParishDonationSettings,
  type ClergyMember,
  type Parish,
  type ParishMember,
} from "@parohia/shared";
import { useEffect, useState, type ReactNode } from "react";
import { Icon, type IconName } from "../../../components/Icon";
import {
  Avatar,
  Button,
  Card,
  CardHeader,
  Checkbox,
  ConfirmDialog,
  cx,
  Dialog,
  EmptyState,
  IconButton,
  Notice,
  Pill,
  Skeleton,
  TextArea,
  TextField,
  useSeeMore,
} from "../../../components/app/ui";
import { useToast } from "../../../components/app/toast";
import { CalendarSetupDialog } from "../../../components/dashboard/CalendarSetupDialog";
import { ParishPicker } from "../../../components/dashboard/ParishPicker";
import { formatPhone, formatRelativeTime } from "../../../lib/format";
import { useDashboard } from "../DashboardContext";
import { PageHeader } from "../DashboardShell";

export default function ParishPage() {
  const { parish, isAdmin } = useDashboard();
  if (!parish) {
    return isAdmin ? (
      <>
        <PageHeader eyebrow="Parish" title="Your parish" />
        <Card>
          <EmptyState icon="business-outline" title="No parish found" message="Contact support@parohia.app to restore your parish." />
        </Card>
      </>
    ) : (
      <JoinParish />
    );
  }
  return <ParishOverview parish={parish} />;
}

function JoinParish() {
  const toast = useToast();
  const { userId, refresh } = useDashboard();
  const [selectedId, setSelectedId] = useState("");
  const [joining, setJoining] = useState(false);

  const join = async () => {
    setJoining(true);
    try {
      await switchUserParish(userId, selectedId);
      await refresh();
      toast("Welcome to your parish!", "success");
    } catch (error) {
      toast((error as Error).message || "Couldn't join this parish", "error");
    } finally {
      setJoining(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Parish"
        title="Find your parish"
        description="Join your parish to see its services, bulletin, and confession times."
      />
      <div className="grid grid-cols-12 gap-6">
        <Card className="col-span-8">
          <ParishPicker selectedId={selectedId} onSelect={setSelectedId} height={420} />
          <div className="mt-5 flex justify-end">
            <Button size="lg" icon="checkmark-circle-outline" disabled={!selectedId} loading={joining} onClick={join}>
              Join parish
            </Button>
          </div>
        </Card>
        <div className="col-span-4">
          <Notice tone="info" icon="information-circle-outline" title="Don't see your parish?">
            Let your parish priest or administrator know about Parohia so they can register.
          </Notice>
        </div>
      </div>
    </>
  );
}

function ParishOverview({ parish }: { parish: Parish }) {
  const toast = useToast();
  const { userId, isAdmin, setParish, refresh } = useDashboard();
  const [editDetails, setEditDetails] = useState(false);
  const [editDonation, setEditDonation] = useState(false);
  const [editCalendar, setEditCalendar] = useState(false);
  const [switchOpen, setSwitchOpen] = useState(false);
  const [members, setMembers] = useState<ParishMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(isAdmin);
  const memberList = useSeeMore(members, 6);

  useEffect(() => {
    if (!isAdmin) return;
    getParishMembers(parish.id, userId)
      .then(setMembers)
      .finally(() => setMembersLoading(false));
  }, [isAdmin, parish.id, userId]);

  const address = [parish.address, parish.city, [parish.state, parish.zip_code].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${parish.name} ${address}`)}`;
  const website = parish.website ? (parish.website.startsWith("http") ? parish.website : `https://${parish.website}`) : null;

  return (
    <>
      <PageHeader
        eyebrow={isAdmin ? "Your parish · Administrator" : "Your parish"}
        title={parish.name}
        description={
          <span className="inline-flex items-center gap-2">
            {parish.jurisdiction}
            {parish.is_verified && (
              <span title="Verified parish" className="inline-flex text-emerald-500">
                <Icon name="checkmark-circle" size={16} />
              </span>
            )}
          </span>
        }
        badge={parish.is_verified ? undefined : "Pending verification"}
        actions={
          isAdmin ? (
            <Button variant="secondary" icon="create-outline" onClick={() => setEditDetails(true)}>
              Edit parish
            </Button>
          ) : (
            <Button variant="secondary" icon="swap-horizontal" onClick={() => setSwitchOpen(true)}>
              Change parish
            </Button>
          )
        }
      />

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8 space-y-6">
          <Card>
            <CardHeader eyebrow="Contact" title="Visit & reach us" />
            <div className="grid grid-cols-2 gap-3">
              <InfoRow icon="location-outline" label="Address" href={mapsUrl}>
                {address || "—"}
              </InfoRow>
              <InfoRow icon="call-outline" label="Phone" href={parish.phone_number ? `tel:${parish.phone_number}` : undefined}>
                {parish.phone_number ? formatPhone(parish.phone_number) : "—"}
              </InfoRow>
              <InfoRow icon="mail-outline" label="Email" href={parish.email ? `mailto:${parish.email}` : undefined}>
                {parish.email || "—"}
              </InfoRow>
              <InfoRow icon="globe-outline" label="Website" href={website ?? undefined}>
                {parish.website || "—"}
              </InfoRow>
            </div>
            <CalendarStatusRow calendarId={parish.parish_calendar_id} isAdmin={isAdmin} onSetup={() => setEditCalendar(true)} />
          </Card>

          <ClergyCard parish={parish} isAdmin={isAdmin} onChange={setParish} />

          {isAdmin && (
            <Card>
              <CardHeader eyebrow="Community" title={`Members${members.length ? ` · ${members.length}` : ""}`} />
              {membersLoading ? (
                <Skeleton className="h-40" />
              ) : members.length === 0 ? (
                <EmptyState
                  compact
                  icon="people-outline"
                  title="No members yet"
                  message="Members appear here once they join your parish."
                />
              ) : (
                <table className="w-full text-left text-[13px]">
                  <thead className="text-[11px] uppercase tracking-[0.1em] text-zinc-400">
                    <tr>
                      <th className="pb-2 font-semibold">Name</th>
                      <th className="pb-2 font-semibold">Email</th>
                      <th className="pb-2 font-semibold">Phone</th>
                      <th className="pb-2 font-semibold">Role</th>
                      <th className="pb-2 text-right font-semibold">Joined parish</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-white/[0.06]">
                    {memberList.visible.map((member) => (
                      <tr key={member.user_id}>
                        <td className="py-2.5">
                          <span className="flex items-center gap-2.5">
                            <Avatar name={member.full_name} size={28} />
                            <span className="font-sans-semibold text-zinc-900 dark:text-white">{member.full_name}</span>
                          </span>
                        </td>
                        <td className="py-2.5 text-zinc-600 dark:text-zinc-300">{member.email}</td>
                        <td className="py-2.5 text-zinc-600 dark:text-zinc-300">
                          {member.phone_number ? formatPhone(member.phone_number) : "—"}
                        </td>
                        <td className="py-2.5">
                          <Pill color={member.role === "admin" ? "#DC2626" : member.role === "manager" ? "#3B82F6" : undefined}>
                            {member.role === "admin" ? "Admin" : member.role === "manager" ? "Manager" : "Member"}
                          </Pill>
                        </td>
                        <td className="py-2.5 text-right text-zinc-500">{member.joined_at ? formatRelativeTime(member.joined_at) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {!membersLoading && memberList.toggle}
            </Card>
          )}
        </div>

        <div className="col-span-4 flex flex-col gap-6">
          <Card className="relative overflow-hidden">
            <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-red-500/10 blur-2xl" />
            <CardHeader
              eyebrow="Support"
              title="Donations"
              action={
                isAdmin && (
                  <Button size="sm" variant="secondary" icon="create-outline" onClick={() => setEditDonation(true)}>
                    Edit
                  </Button>
                )
              }
            />
            {parish.donation_enabled && parish.paypal_donation_url ? (
              <>
                <p className="mb-4 text-[14px] leading-relaxed text-zinc-600 dark:text-zinc-300">
                  {parish.donation_message || `Support the ministry of ${parish.name}.`}
                </p>
                <a
                  href={cleanDonationUrl(parish.paypal_donation_url)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-brand-gradient text-[15px] font-semibold text-white shadow-md shadow-brand-red/25 transition-[filter] hover:brightness-[1.06]"
                >
                  <Icon name="heart-outline" size={17} />
                  Donate
                </a>
              </>
            ) : (
              <EmptyState
                compact
                icon="heart-outline"
                title="Donations not set up"
                message={isAdmin ? "Add a donation link so parishioners can give online." : "This parish hasn't added online giving yet."}
                action={
                  isAdmin && (
                    <Button size="sm" onClick={() => setEditDonation(true)}>
                      Set up donations
                    </Button>
                  )
                }
              />
            )}
          </Card>

          <MapCard query={`${parish.name} ${address}`.trim()} address={address} directionsUrl={mapsUrl} />
        </div>
      </div>

      {isAdmin && (
        <>
          <ParishDetailsDialog open={editDetails} onClose={() => setEditDetails(false)} parish={parish} onSaved={setParish} />
          <DonationDialog open={editDonation} onClose={() => setEditDonation(false)} parish={parish} onSaved={setParish} />
          <CalendarSetupDialog
            open={editCalendar}
            onClose={() => setEditCalendar(false)}
            parishId={parish.id}
            initialValue={parish.parish_calendar_id ?? ""}
            onSaved={(calendarId) => setParish({ ...parish, parish_calendar_id: calendarId })}
          />
        </>
      )}

      {!isAdmin && (
        <SwitchParishDialog
          open={switchOpen}
          onClose={() => setSwitchOpen(false)}
          currentId={parish.id}
          onSwitched={async () => {
            await refresh();
            toast("Parish changed", "success");
          }}
        />
      )}
    </>
  );
}

function MapCard({ query, address, directionsUrl }: { query: string; address: string; directionsUrl: string }) {
  return (
    <Card className="flex min-h-[320px] max-h-[440px] flex-1 flex-col overflow-hidden" padded={false}>
      <div className="flex items-start justify-between gap-4 p-6 pb-4">
        <div className="min-w-0">
          <p className="mb-1 font-sans-semibold text-[11px] uppercase tracking-[0.14em] text-red-600 dark:text-red-400">Location</p>
          <h2 className="font-display text-[24px] leading-tight text-zinc-900 dark:text-white">Find us</h2>
        </div>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-flex shrink-0 items-center gap-1.5 text-[13px] font-semibold text-red-600 hover:underline dark:text-red-400"
        >
          Directions
          <Icon name="open-outline" size={13} />
        </a>
      </div>
      <iframe
        title="Parish location map"
        src={`https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="min-h-[220px] w-full flex-1 border-0 border-t border-zinc-100 dark:border-white/[0.06] dark:[filter:invert(0.9)_hue-rotate(180deg)]"
      />
    </Card>
  );
}

function InfoRow({ icon, label, href, children }: { icon: IconName; label: string; href?: string; children: ReactNode }) {
  const body = (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-600/[0.07] text-red-600 dark:bg-red-500/[0.12] dark:text-red-400">
        <Icon name={icon} size={16} />
      </span>
      <span className="min-w-0">
        <span className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-400">{label}</span>
        <span className="mt-0.5 block break-words text-[14px] text-zinc-800 dark:text-zinc-200">{children}</span>
      </span>
    </>
  );
  const className = "flex items-start gap-3 rounded-2xl bg-zinc-900/[0.03] p-3 dark:bg-white/[0.04]";
  return href ? (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel="noreferrer"
      className={`${className} transition-colors hover:bg-zinc-900/[0.06] dark:hover:bg-white/[0.07]`}
    >
      {body}
    </a>
  ) : (
    <div className={className}>{body}</div>
  );
}

function CalendarStatusRow({ calendarId, isAdmin, onSetup }: { calendarId?: string | null; isAdmin: boolean; onSetup: () => void }) {
  const connected = !!calendarId;
  const body = (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-600/[0.07] text-red-600 dark:bg-red-500/[0.12] dark:text-red-400">
        <Icon name="calendar-outline" size={16} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-400">Parish calendar</span>
        <span className="mt-0.5 block truncate text-[14px] text-zinc-800 dark:text-zinc-200">
          {connected
            ? isAdmin
              ? calendarId
              : "Services sync from the parish calendar"
            : isAdmin
              ? "Connect a public Google Calendar to show services in the app and on the dashboard"
              : "Services aren't connected yet"}
        </span>
      </span>
      <span
        className={cx(
          "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 font-sans-bold text-[11px]",
          connected ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
        )}
      >
        <Icon name={connected ? "checkmark-circle" : "alert-circle"} size={13} />
        {connected ? "Connected" : isAdmin ? "Set up" : "Not set up"}
        {isAdmin && <Icon name="chevron-forward" size={12} />}
      </span>
    </>
  );
  const className = "mt-3 flex w-full items-center gap-3 rounded-2xl bg-zinc-900/[0.03] p-3 text-left dark:bg-white/[0.04]";
  return isAdmin ? (
    <button
      type="button"
      onClick={onSetup}
      className={`${className} outline-none transition-colors hover:bg-zinc-900/[0.06] focus-visible:ring-2 focus-visible:ring-brand-red/50 dark:hover:bg-white/[0.07]`}
    >
      {body}
    </button>
  ) : (
    <div className={className}>{body}</div>
  );
}

function SwitchParishDialog({
  open,
  onClose,
  currentId,
  onSwitched,
}: {
  open: boolean;
  onClose: () => void;
  currentId: string;
  onSwitched: () => Promise<void>;
}) {
  const toast = useToast();
  const { userId } = useDashboard();
  const [selectedId, setSelectedId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setSelectedId("");
  }, [open]);

  const save = async () => {
    setSaving(true);
    try {
      await switchUserParish(userId, selectedId);
      await onSwitched();
      onClose();
    } catch (error) {
      toast((error as Error).message || "Couldn't change parish", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      eyebrow="Change parish"
      title="Choose a new parish"
      description="Your channel subscriptions and bulletin will switch to the new parish."
      width={620}
      dismissible={!saving}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button icon="swap-horizontal" disabled={!selectedId} loading={saving} onClick={save}>
            Change parish
          </Button>
        </>
      }
    >
      {open && <ParishPicker selectedId={selectedId} onSelect={setSelectedId} excludeId={currentId} height={340} />}
    </Dialog>
  );
}

const detailsForm = (parish: Parish) => ({
  name: parish.name ?? "",
  jurisdiction: parish.jurisdiction ?? "",
  address: parish.address ?? "",
  city: parish.city ?? "",
  state: parish.state ?? "",
  zip_code: parish.zip_code ?? "",
  phone_number: parish.phone_number ?? "",
  website: parish.website ?? "",
  email: parish.email ?? "",
});

function ParishDetailsDialog({
  open,
  onClose,
  parish,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  parish: Parish;
  onSaved: (parish: Parish) => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState(() => detailsForm(parish));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(detailsForm(parish));
      setError(null);
    }
  }, [open, parish]);

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: { target: { value: string } }) => setForm((prev) => ({ ...prev, [key]: e.target.value })),
  });

  const save = async () => {
    const trimmed = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim()])) as typeof form;
    if (!trimmed.name || !trimmed.jurisdiction || !trimmed.address || !trimmed.city || !trimmed.state) {
      setError("Name, jurisdiction, address, city, and state are required.");
      return;
    }
    setSaving(true);
    const result = await updateParishDetails(parish.id, { ...trimmed, parish_calendar_id: parish.parish_calendar_id ?? null });
    setSaving(false);
    if (!result.success) {
      setError(result.error || "Failed to update parish information.");
      return;
    }
    onSaved({ ...parish, ...trimmed });
    toast("Parish information updated", "success");
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      eyebrow="Parish admin"
      title="Edit parish"
      width={680}
      dismissible={!saving}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button icon="checkmark" loading={saving} onClick={save}>
            Save changes
          </Button>
        </>
      }
    >
      {error && (
        <p role="alert" className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-[13px] text-red-700 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </p>
      )}
      <div className="grid grid-cols-2 gap-x-4">
        <TextField label="Parish name" required {...field("name")} />
        <TextField label="Jurisdiction" required {...field("jurisdiction")} />
      </div>
      <TextField label="Street address" required {...field("address")} />
      <div className="grid grid-cols-[1fr_96px_140px] gap-x-4">
        <TextField label="City" required {...field("city")} />
        <TextField label="State" required maxLength={2} className="uppercase" {...field("state")} />
        <TextField label="ZIP code" {...field("zip_code")} />
      </div>
      <div className="grid grid-cols-3 gap-x-4">
        <TextField label="Phone" type="tel" {...field("phone_number")} />
        <TextField label="Website" type="url" {...field("website")} />
        <TextField label="Email" type="email" {...field("email")} />
      </div>
    </Dialog>
  );
}

function ClergyCard({ parish, isAdmin, onChange }: { parish: Parish; isAdmin: boolean; onChange: (parish: Parish) => void }) {
  const toast = useToast();
  const clergy = parish.clergy ?? [];
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<ClergyMember | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [removing, setRemoving] = useState<ClergyMember | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);

  const openEditor = (member: ClergyMember | null) => {
    setEditing(member);
    setEditorOpen(true);
  };

  const saved = (member: ClergyMember) => {
    const exists = clergy.some((c) => c.id === member.id);
    onChange({ ...parish, clergy: exists ? clergy.map((c) => (c.id === member.id ? member : c)) : [...clergy, member] });
  };

  const remove = async () => {
    if (!removing) return;
    setRemoveLoading(true);
    const result = await deleteClergyMember(removing.id);
    setRemoveLoading(false);
    if (!result.success) return toast(result.error || "Couldn't remove clergy member", "error");
    onChange({ ...parish, clergy: clergy.filter((c) => c.id !== removing.id) });
    toast(`Removed ${removing.name}`, "success");
    setConfirmOpen(false);
  };

  return (
    <Card>
      <CardHeader
        eyebrow="Clergy"
        title="Parish clergy"
        action={
          isAdmin &&
          clergy.length > 0 && (
            <Button size="sm" variant="secondary" icon="add" onClick={() => openEditor(null)}>
              Add clergy
            </Button>
          )
        }
      />
      {clergy.length ? (
        <ul className="divide-y divide-zinc-100 dark:divide-white/[0.06]">
          {clergy.map((member) => (
            <li key={member.id} className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0">
              <Avatar name={member.name} size={48} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-sans-bold text-[16px] text-zinc-900 dark:text-white">{member.name}</p>
                {member.title && <p className="text-[13px] text-zinc-500 dark:text-zinc-400">{member.title}</p>}
                {(member.phone_number || member.email) && (
                  <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-[13px]">
                    {member.phone_number && (
                      <a
                        href={`tel:${member.phone_number}`}
                        className="flex items-center gap-1.5 text-zinc-600 hover:text-red-600 dark:text-zinc-300"
                      >
                        <Icon name="call-outline" size={14} />
                        {formatPhone(member.phone_number)}
                      </a>
                    )}
                    {member.email && (
                      <a
                        href={`mailto:${member.email}`}
                        className="flex min-w-0 items-center gap-1.5 text-zinc-600 hover:text-red-600 dark:text-zinc-300"
                      >
                        <Icon name="mail-outline" size={14} />
                        <span className="truncate">{member.email}</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
              {isAdmin && (
                <div className="flex shrink-0 items-center">
                  <IconButton icon="create-outline" label={`Edit ${member.name}`} onClick={() => openEditor(member)} />
                  <IconButton
                    icon="trash-outline"
                    label={`Remove ${member.name}`}
                    className="hover:text-red-600 dark:hover:text-red-400"
                    onClick={() => {
                      setRemoving(member);
                      setConfirmOpen(true);
                    }}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          compact
          icon="person-outline"
          title="No clergy listed"
          message={isAdmin ? "Add your priests and deacons so parishioners know who to contact." : undefined}
          action={
            isAdmin && (
              <Button size="sm" icon="add" onClick={() => openEditor(null)}>
                Add clergy
              </Button>
            )
          }
        />
      )}

      {isAdmin && (
        <>
          <ClergyDialog open={editorOpen} onClose={() => setEditorOpen(false)} parishId={parish.id} member={editing} onSaved={saved} />
          <ConfirmDialog
            open={confirmOpen}
            onClose={() => setConfirmOpen(false)}
            onConfirm={remove}
            title={`Remove ${removing?.name ?? "clergy member"}?`}
            message="They'll no longer appear on your parish page."
            confirmLabel="Remove"
            destructive
            loading={removeLoading}
          />
        </>
      )}
    </Card>
  );
}

function ClergyDialog({
  open,
  onClose,
  parishId,
  member,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  parishId: string;
  /** Null when adding someone new. */
  member: ClergyMember | null;
  onSaved: (member: ClergyMember) => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState({ name: "", title: "", phone_number: "", email: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (!open) return;
    setForm({
      name: member?.name ?? "",
      title: member?.title ?? "",
      phone_number: member?.phone_number ?? "",
      email: member?.email ?? "",
    });
    setError(undefined);
  }, [open, member]);

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: { target: { value: string } }) => setForm((prev) => ({ ...prev, [key]: e.target.value })),
  });

  const save = async () => {
    if (!form.name.trim()) return setError("Please enter a name.");
    setSaving(true);
    const result = member ? await updateClergyMember(member.id, form) : await addClergyMember(parishId, form);
    setSaving(false);
    if (!result.success || !result.clergy) return toast(result.error || "Couldn't save clergy member", "error");
    onSaved(result.clergy);
    toast(member ? "Clergy updated" : `Added ${result.clergy.name}`, "success");
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      eyebrow="Clergy"
      title={member ? "Edit clergy member" : "Add clergy member"}
      width={560}
      dismissible={!saving}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button icon="checkmark" loading={saving} onClick={save}>
            {member ? "Save" : "Add"}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-x-4">
        <TextField label="Name" required placeholder="Fr. John Smith" error={error} autoFocus {...field("name")} />
        <TextField label="Title" placeholder="Parish Priest, Deacon…" {...field("title")} />
      </div>
      <div className="grid grid-cols-2 gap-x-4">
        <TextField label="Phone" type="tel" placeholder="(503) 123-4567" {...field("phone_number")} />
        <TextField label="Email" type="email" placeholder="frjohn@stmary.org" {...field("email")} />
      </div>
    </Dialog>
  );
}

function DonationDialog({
  open,
  onClose,
  parish,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  parish: Parish;
  onSaved: (parish: Parish) => void;
}) {
  const toast = useToast();
  const [url, setUrl] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (open) {
      setUrl(parish.paypal_donation_url ?? "");
      setEnabled(!!parish.donation_enabled);
      setMessage(parish.donation_message ?? "");
      setError(undefined);
    }
  }, [open, parish]);

  const save = async () => {
    if (enabled && !url.trim()) {
      setError("Please enter a donation URL.");
      return;
    }
    setSaving(true);
    const result = await updateParishDonationSettings(parish.id, {
      paypal_donation_url: url,
      donation_enabled: enabled,
      donation_message: message,
    });
    setSaving(false);
    if (!result.success) return toast(result.error || "Failed to update donation settings", "error");
    onSaved({
      ...parish,
      paypal_donation_url: url.trim() || undefined,
      donation_enabled: enabled,
      donation_message: message.trim() || undefined,
    });
    toast("Donation settings updated", "success");
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      eyebrow="Parish admin"
      title="Online giving"
      description="Link to your parish's donation page (PayPal, Givebutter, or any provider)."
      width={560}
      dismissible={!saving}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button icon="checkmark" loading={saving} onClick={save}>
            Save
          </Button>
        </>
      }
    >
      <Checkbox checked={enabled} onChange={setEnabled} className="mb-5">
        Show a Donate button to parishioners
      </Checkbox>
      <TextField
        label="Donation URL"
        placeholder="https://www.paypal.com/donate/?hosted_button_id=…"
        value={url}
        onChange={(e) => {
          setUrl(e.target.value);
          setError(undefined);
        }}
        error={error}
        spellCheck={false}
      />
      <TextArea
        label="Message"
        placeholder="Thank you for supporting our parish community."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        helper="Optional. Shown above the Donate button."
      />
    </Dialog>
  );
}
