"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  forwardRef,
  useEffect,
  useId,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import { createPortal } from "react-dom";
import { Icon, type IconName } from "../Icon";

export const cx = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(" ");

/* ------------------------------------------------------------------------------------------------
 * Buttons
 * ---------------------------------------------------------------------------------------------- */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-gradient text-white shadow-md shadow-brand-red/25 hover:brightness-[1.06] disabled:shadow-none",
  secondary:
    "bg-zinc-900/[0.05] text-zinc-800 hover:bg-zinc-900/[0.09] dark:bg-white/[0.07] dark:text-zinc-100 dark:hover:bg-white/[0.12]",
  ghost:
    "text-zinc-600 hover:bg-zinc-900/[0.05] hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-white",
  danger:
    "bg-red-600/10 text-red-700 hover:bg-red-600/15 dark:bg-red-500/15 dark:text-red-300 dark:hover:bg-red-500/25",
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: "h-8 px-3.5 text-[13px] gap-1.5",
  md: "h-10 px-5 text-sm gap-2",
  lg: "h-12 px-6 text-[15px] gap-2",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  iconRight?: IconName;
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", icon, iconRight, loading, fullWidth, className, children, disabled, type, ...rest },
  ref
) {
  const iconSize = size === "sm" ? 14 : size === "lg" ? 18 : 16;
  return (
    <button
      ref={ref}
      type={type ?? "button"}
      disabled={disabled || loading}
      className={cx(
        "inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold outline-none transition-[transform,background-color,filter,color] duration-200 ease-out-expo focus-visible:ring-2 focus-visible:ring-brand-red/50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
        BUTTON_VARIANTS[variant],
        BUTTON_SIZES[size],
        fullWidth && "w-full",
        className
      )}
      {...rest}
    >
      {loading ? <Spinner size={iconSize} /> : icon ? <Icon name={icon} size={iconSize} /> : null}
      {children}
      {iconRight && !loading ? <Icon name={iconRight} size={iconSize} /> : null}
    </button>
  );
});

export function IconButton({
  icon,
  label,
  className,
  size = 36,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { icon: IconName; label: string; size?: number }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cx(
        "inline-flex shrink-0 items-center justify-center rounded-full text-zinc-500 outline-none transition-colors hover:bg-zinc-900/[0.06] hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-brand-red/50 disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-white/[0.08] dark:hover:text-white",
        className
      )}
      style={{ width: size, height: size }}
      {...rest}
    >
      <Icon name={icon} size={Math.round(size * 0.48)} />
    </button>
  );
}

export function Spinner({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cx("inline-block shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent", className)}
      style={{ width: size, height: size }}
    />
  );
}

/* ------------------------------------------------------------------------------------------------
 * Form fields
 * ---------------------------------------------------------------------------------------------- */

const FIELD_BASE =
  "w-full rounded-2xl border border-zinc-200 bg-white px-4 text-[15px] text-zinc-900 outline-none transition-[border-color,box-shadow] placeholder:text-zinc-400 focus:border-red-400/70 focus:ring-4 focus:ring-red-500/10 disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-red-400/50";

interface FieldShellProps {
  label?: string;
  required?: boolean;
  helper?: ReactNode;
  error?: string;
  htmlFor: string;
  accessory?: ReactNode;
  children: ReactNode;
  className?: string;
}

function FieldShell({ label, required, helper, error, htmlFor, accessory, children, className }: FieldShellProps) {
  return (
    <div className={cx("mb-4", className)}>
      {(label || accessory) && (
        <div className="mb-1.5 flex items-center justify-between">
          {label ? (
            <label htmlFor={htmlFor} className="font-sans-semibold text-[13px] text-zinc-700 dark:text-zinc-300">
              {label}
              {required && <span className="text-red-600 dark:text-red-400"> *</span>}
            </label>
          ) : (
            <span />
          )}
          {accessory}
        </div>
      )}
      {children}
      {error ? (
        <p className="mt-1.5 text-[12px] text-red-600 dark:text-red-400">{error}</p>
      ) : helper ? (
        <p className="mt-1.5 text-[12px] leading-[18px] text-zinc-500 dark:text-zinc-400">{helper}</p>
      ) : null}
    </div>
  );
}

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helper?: ReactNode;
  error?: string;
  accessory?: ReactNode;
  leadingIcon?: IconName;
  trailing?: ReactNode;
  containerClassName?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, helper, error, accessory, leadingIcon, trailing, containerClassName, className, id, required, ...rest },
  ref
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <FieldShell
      label={label}
      required={required}
      helper={helper}
      error={error}
      htmlFor={inputId}
      accessory={accessory}
      className={containerClassName}
    >
      <div className="relative">
        {leadingIcon && (
          <Icon
            name={leadingIcon}
            size={17}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
          />
        )}
        <input
          ref={ref}
          id={inputId}
          required={required}
          className={cx(FIELD_BASE, "h-12", leadingIcon && "pl-11", trailing ? "pr-12" : undefined, className)}
          {...rest}
        />
        {trailing ? <div className="absolute inset-y-0 right-2 flex items-center">{trailing}</div> : null}
      </div>
    </FieldShell>
  );
});

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helper?: ReactNode;
  containerClassName?: string;
}

export function TextArea({ label, helper, containerClassName, className, id, required, ...rest }: TextAreaProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <FieldShell label={label} required={required} helper={helper} htmlFor={inputId} className={containerClassName}>
      <textarea
        id={inputId}
        required={required}
        className={cx(FIELD_BASE, "min-h-[110px] resize-y py-3 leading-relaxed", className)}
        {...rest}
      />
    </FieldShell>
  );
}

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helper?: ReactNode;
  containerClassName?: string;
}

export function SelectField({ label, helper, containerClassName, className, id, required, children, ...rest }: SelectFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <FieldShell label={label} required={required} helper={helper} htmlFor={inputId} className={containerClassName}>
      <div className="relative">
        <select
          id={inputId}
          required={required}
          className={cx(FIELD_BASE, "h-12 appearance-none pr-10", className)}
          {...rest}
        >
          {children}
        </select>
        <Icon
          name="chevron-down"
          size={14}
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400"
        />
      </div>
    </FieldShell>
  );
}

export function Checkbox({
  checked,
  onChange,
  children,
  className,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cx("flex cursor-pointer items-start gap-3", className)}>
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span
        aria-hidden
        className={cx(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-brand-red/50",
          checked
            ? "border-red-600 bg-red-600 text-white"
            : "border-zinc-300 bg-white dark:border-white/20 dark:bg-white/5"
        )}
      >
        {checked && <Icon name="checkmark" size={13} />}
      </span>
      <span className="text-[13px] leading-5 text-zinc-600 dark:text-zinc-300">{children}</span>
    </label>
  );
}

export function Switch({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cx(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand-red/50 disabled:opacity-50",
        checked ? "bg-red-600" : "bg-zinc-300 dark:bg-white/15"
      )}
    >
      <motion.span
        layout
        transition={{ type: "spring", damping: 22, stiffness: 420 }}
        className={cx("h-5 w-5 rounded-full bg-white shadow-sm", checked ? "ml-[22px]" : "ml-0.5")}
      />
    </button>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  size = "md",
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; icon?: IconName }[];
  size?: "sm" | "md";
}) {
  const groupId = useId();
  return (
    <div
      role="radiogroup"
      className="inline-flex rounded-full bg-zinc-900/[0.05] p-1 dark:bg-white/[0.06]"
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cx(
              "relative inline-flex items-center gap-1.5 rounded-full font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand-red/50",
              size === "sm" ? "h-7 px-3 text-[12px]" : "h-8 px-4 text-[13px]",
              active ? "text-zinc-900 dark:text-white" : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${groupId}`}
                transition={{ type: "spring", damping: 26, stiffness: 380 }}
                className="absolute inset-0 rounded-full bg-white shadow-sm dark:bg-white/[0.12]"
              />
            )}
            <span className="relative flex items-center gap-1.5">
              {option.icon && <Icon name={option.icon} size={13} />}
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Surfaces
 * ---------------------------------------------------------------------------------------------- */

export function Card({
  children,
  className,
  padded = true,
  as: Tag = "section",
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
  as?: "section" | "div" | "article";
}) {
  return (
    <Tag
      className={cx(
        "rounded-[28px] border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgba(9,9,11,0.04)] dark:border-white/[0.08] dark:bg-white/[0.03] dark:shadow-none",
        padded && "p-6",
        className
      )}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({
  eyebrow,
  title,
  action,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("mb-4 flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1 font-sans-semibold text-[11px] uppercase tracking-[0.14em] text-red-600 dark:text-red-400">
            {eyebrow}
          </p>
        )}
        <h2 className="font-display text-[24px] leading-tight text-zinc-900 dark:text-white">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function Pill({
  children,
  color,
  tint,
  icon,
  className,
}: {
  children: ReactNode;
  color?: string;
  tint?: string;
  icon?: IconName;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none",
        !color && "bg-zinc-900/[0.06] text-zinc-600 dark:bg-white/[0.08] dark:text-zinc-300",
        className
      )}
      style={color ? { color, backgroundColor: tint ?? `${color}1f` } : undefined}
    >
      {icon && <Icon name={icon} size={11} />}
      {children}
    </span>
  );
}

/** Caps a list at `limit` items and returns a "See more / See less" toggle when it overflows. */
export function useSeeMore<T>(items: T[], limit: number) {
  const [expanded, setExpanded] = useState(false);
  const hidden = items.length - limit;
  return {
    visible: expanded || hidden <= 0 ? items : items.slice(0, limit),
    toggle:
      hidden > 0 ? <SeeMoreButton expanded={expanded} hidden={hidden} onClick={() => setExpanded((prev) => !prev)} /> : null,
  };
}

export function SeeMoreButton({ expanded, hidden, onClick }: { expanded: boolean; hidden: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-2xl py-2 text-[13px] font-semibold text-zinc-500 outline-none transition-colors hover:bg-zinc-900/[0.04] hover:text-zinc-800 focus-visible:ring-2 focus-visible:ring-brand-red/50 dark:text-zinc-400 dark:hover:bg-white/[0.05] dark:hover:text-zinc-100"
    >
      {expanded ? "See less" : `See ${hidden} more`}
      <Icon name={expanded ? "chevron-up" : "chevron-down"} size={13} />
    </button>
  );
}

export function EmptyState({
  icon,
  title,
  message,
  action,
  compact,
}: {
  icon: IconName;
  title: string;
  message?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={cx("flex flex-col items-center text-center", compact ? "py-8" : "py-16")}>
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[20px] bg-red-600/10 text-red-600 dark:bg-red-500/15 dark:text-red-400">
        <Icon name={icon} size={24} />
      </div>
      <h3 className="font-display text-[22px] text-zinc-900 dark:text-white">{title}</h3>
      {message && (
        <p className="mt-1.5 max-w-sm text-[14px] leading-relaxed text-zinc-500 dark:text-zinc-400">{message}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Notice({
  tone = "info",
  icon,
  title,
  children,
  action,
  className,
}: {
  tone?: "info" | "warning" | "accent";
  icon?: IconName;
  title?: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  const tones = {
    info: "border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300",
    warning: "border-amber-100 bg-amber-50 text-amber-600 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300",
    accent: "border-red-100 bg-red-50 text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300",
  };
  return (
    <div className={cx("flex items-start gap-3 rounded-3xl border p-4", tones[tone], className)}>
      {icon && (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white/70 dark:bg-white/[0.06]">
          <Icon name={icon} size={17} />
        </span>
      )}
      <div className="min-w-0 flex-1">
        {title && <p className="font-sans-bold text-[14px] text-zinc-900 dark:text-white">{title}</p>}
        {children && <div className="mt-0.5 text-[13px] leading-5 text-zinc-600 dark:text-zinc-300">{children}</div>}
      </div>
      {action}
    </div>
  );
}

export function Avatar({ name, size = 36, className }: { name: string; size?: number; className?: string }) {
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?";
  return (
    <span
      aria-hidden
      className={cx(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-zinc-200 to-zinc-300 font-sans-bold text-zinc-700 dark:from-white/15 dark:to-white/5 dark:text-zinc-200",
        className
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
    >
      {initials}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("animate-pulse rounded-2xl bg-zinc-900/[0.06] dark:bg-white/[0.06]", className)} />;
}

/* ------------------------------------------------------------------------------------------------
 * Dialog
 * ---------------------------------------------------------------------------------------------- */

export function Dialog({
  open,
  onClose,
  title,
  eyebrow,
  description,
  children,
  footer,
  width = 560,
  dismissible = true,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  width?: number;
  dismissible?: boolean;
}) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && dismissible) onClose();
    };
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, dismissible, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 bg-zinc-950/40 backdrop-blur-[2px] dark:bg-black/60"
            onClick={dismissible ? onClose : undefined}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ type: "spring", damping: 28, stiffness: 340 }}
            className="relative flex max-h-[calc(100dvh-48px)] w-full flex-col overflow-hidden rounded-[30px] border border-zinc-200/80 bg-white shadow-2xl dark:border-white/10 dark:bg-zinc-950"
            style={{ maxWidth: width }}
          >
            <div className="flex items-start justify-between gap-4 px-7 pb-2 pt-6">
              <div className="min-w-0">
                {eyebrow && (
                  <p className="mb-1 font-sans-semibold text-[11px] uppercase tracking-[0.14em] text-red-600 dark:text-red-400">
                    {eyebrow}
                  </p>
                )}
                <h2 id={titleId} className="font-display text-[28px] leading-tight text-zinc-900 dark:text-white">
                  {title}
                </h2>
                {description && (
                  <p className="mt-1 text-[14px] leading-relaxed text-zinc-500 dark:text-zinc-400">{description}</p>
                )}
              </div>
              {dismissible && <IconButton icon="close" label="Close" onClick={onClose} />}
            </div>
            {children && <div className="min-h-0 flex-1 overflow-y-auto px-7 py-4">{children}</div>}
            {footer && (
              <div className="flex items-center justify-end gap-2 border-t border-zinc-100 px-7 py-4 dark:border-white/[0.06]">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  destructive,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  destructive?: boolean;
  loading?: boolean;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      width={460}
      dismissible={!loading}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant={destructive ? "danger" : "primary"} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="whitespace-pre-line text-[14px] leading-relaxed text-zinc-600 dark:text-zinc-300">{message}</div>
    </Dialog>
  );
}
