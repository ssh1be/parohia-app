"use client";

import {
  cleanDonationUrl,
  getParishMembers,
  switchUserParish,
  updateParishDetails,
  updateParishDonationSettings,
  updateParishPriestInfo,
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
  Dialog,
  EmptyState,
  Notice,
  Pill,
  Skeleton,
  TextArea,
  TextField,
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
  const [editPriest, setEditPriest] = useState(false);
  const [editDonation, setEditDonation] = useState(false);
  const [editCalendar, setEditCalendar] = useState(false);
  const [switchOpen, setSwitchOpen] = useState(false);
  const [members, setMembers] = useState<ParishMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(isAdmin);

  useEffect(() => {
    if (!isAdmin) return;
    getParishMembers(parish.id, userId)
      .then(setMembers)
      .finally(() => setMembersLoading(false));
  }, [isAdmin, parish.id, userId]);

  const address = [parish.address, parish.city, [parish.state, parish.zip_code].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${parish.name} ${address}`)}`;
  const website = parish.website ? (parish.website.startsWith("http") ? parish.website : `https://${parish.website}`) : null;

  return (
    <>
      <PageHeader
        eyebrow={isAdmin ? "Your parish · Administrator" : "Your parish"}
        title={parish.name}
        description={parish.jurisdiction}
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
          </Card>

          <Card>
            <CardHeader
              eyebrow="Clergy"
              title="Parish priest"
              action={
                isAdmin && (
                  <Button size="sm" variant="secondary" icon="create-outline" onClick={() => setEditPriest(true)}>
                    Edit
                  </Button>
                )
              }
            />
            {parish.priest_name ? (
              <div className="flex items-center gap-4">
                <Avatar name={parish.priest_name} size={56} />
                <div className="min-w-0 flex-1">
                  <p className="font-sans-bold text-[17px] text-zinc-900 dark:text-white">{parish.priest_name}</p>
                  <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-[13px]">
                    {parish.priest_phone_number && (
                      <a href={`tel:${parish.priest_phone_number}`} className="flex items-center gap-1.5 text-zinc-600 hover:text-red-600 dark:text-zinc-300">
                        <Icon name="call-outline" size={14} />
                        {formatPhone(parish.priest_phone_number)}
                      </a>
                    )}
                    {parish.priest_email && (
                      <a href={`mailto:${parish.priest_email}`} className="flex items-center gap-1.5 text-zinc-600 hover:text-red-600 dark:text-zinc-300">
                        <Icon name="mail-outline" size={14} />
                        {parish.priest_email}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState
                compact
                icon="person-outline"
                title="No priest listed"
                message={isAdmin ? "Add your priest's details so parishioners know who to contact." : undefined}
                action={
                  isAdmin && (
                    <Button size="sm" icon="add" onClick={() => setEditPriest(true)}>
                      Add priest
                    </Button>
                  )
                }
              />
            )}
          </Card>

          {isAdmin && (
            <Card>
              <CardHeader eyebrow="Community" title={`Members${members.length ? ` · ${members.length}` : ""}`} />
              {membersLoading ? (
                <Skeleton className="h-40" />
              ) : members.length === 0 ? (
                <EmptyState compact icon="people-outline" title="No members yet" message="Members appear here once they join your parish." />
              ) : (
                <table className="w-full text-left text-[13px]">
                  <thead className="text-[11px] uppercase tracking-[0.1em] text-zinc-400">
                    <tr>
                      <th className="pb-2 font-semibold">Name</th>
                      <th className="pb-2 font-semibold">Email</th>
                      <th className="pb-2 font-semibold">Phone</th>
                      <th className="pb-2 font-semibold">Role</th>
                      <th className="pb-2 text-right font-semibold">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-white/[0.06]">
                    {members.map((member) => (
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
                          <Pill
                            color={member.role === "admin" ? "#DC2626" : member.role === "manager" ? "#3B82F6" : undefined}
                          >
                            {member.role === "admin" ? "Admin" : member.role === "manager" ? "Manager" : "Member"}
                          </Pill>
                        </td>
                        <td className="py-2.5 text-right text-zinc-500">
                          {member.joined_at ? formatRelativeTime(member.joined_at) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          )}
        </div>

        <div className="col-span-4 space-y-6">
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

          {isAdmin && (
            <Card>
              <CardHeader eyebrow="Services" title="Parish calendar" />
              {parish.parish_calendar_id ? (
                <>
                  <div className="flex items-center gap-3 rounded-2xl bg-emerald-500/[0.07] p-3">
                    <Icon name="checkmark-circle" size={18} className="text-emerald-500" />
                    <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-zinc-700 dark:text-zinc-300">
                      {parish.parish_calendar_id}
                    </span>
                  </div>
                  <Button size="sm" variant="ghost" icon="link-outline" className="mt-3" onClick={() => setEditCalendar(true)}>
                    Change calendar
                  </Button>
                </>
              ) : (
                <>
                  <p className="mb-4 text-[13px] leading-5 text-zinc-500 dark:text-zinc-400">
                    Connect a public Google Calendar to show services in the app and on the dashboard.
                  </p>
                  <Button size="sm" icon="link-outline" onClick={() => setEditCalendar(true)}>
                    Connect calendar
                  </Button>
                </>
              )}
            </Card>
          )}
        </div>
      </div>

      {isAdmin && (
        <>
          <ParishDetailsDialog open={editDetails} onClose={() => setEditDetails(false)} parish={parish} onSaved={setParish} />
          <PriestDialog open={editPriest} onClose={() => setEditPriest(false)} parish={parish} onSaved={setParish} />
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
    <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className={`${className} transition-colors hover:bg-zinc-900/[0.06] dark:hover:bg-white/[0.07]`}>
      {body}
    </a>
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

function PriestDialog({
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
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(parish.priest_name ?? "");
      setPhone(parish.priest_phone_number ?? "");
      setEmail(parish.priest_email ?? "");
    }
  }, [open, parish]);

  const save = async () => {
    setSaving(true);
    const result = await updateParishPriestInfo(parish.id, {
      priest_name: name,
      priest_phone_number: phone,
      priest_email: email,
    });
    setSaving(false);
    if (!result.success) return toast(result.error || "Failed to update priest information", "error");
    onSaved({
      ...parish,
      priest_name: name.trim() || undefined,
      priest_phone_number: phone.trim() || undefined,
      priest_email: email.trim() || undefined,
    });
    toast("Priest information updated", "success");
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      eyebrow="Parish admin"
      title="Parish priest"
      width={520}
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
      <TextField label="Name" placeholder="Fr. John Smith" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      <TextField label="Phone" type="tel" placeholder="(503) 123-4567" value={phone} onChange={(e) => setPhone(e.target.value)} />
      <TextField label="Email" type="email" placeholder="frjohn@stmary.org" value={email} onChange={(e) => setEmail(e.target.value)} />
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
