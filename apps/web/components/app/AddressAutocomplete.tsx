"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Spinner, cx } from "./ui";

export type AddressParts = {
  street_number?: string;
  route?: string;
  locality?: string;
  administrative_area_level_1?: string;
  postal_code?: string;
  country?: string;
};

type PlaceSuggestion = {
  placeId: string;
  primary: string;
  secondary: string;
};

type AddressAutocompleteProps = {
  label?: string;
  required?: boolean;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onAddressSelect: (parts: AddressParts) => void;
  className?: string;
};

const PLACES_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_API_KEY;

const INPUT_CLASS =
  "w-full rounded-2xl border border-zinc-200 bg-white px-4 text-[15px] text-zinc-900 outline-none transition-[border-color,box-shadow] placeholder:text-zinc-400 focus:border-red-400/70 focus:ring-4 focus:ring-red-500/10 disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-red-400/50 h-12";

function newSessionToken(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function componentOf(
  components: { longText?: string; shortText?: string; types?: string[] }[] | undefined,
  type: string,
  preferShort = false
): string {
  const match = components?.find((c) => c.types?.includes(type));
  if (!match) return "";
  return (preferShort ? match.shortText : match.longText) || match.longText || match.shortText || "";
}

export function AddressAutocomplete({
  label = "Street address",
  required,
  placeholder = "123 Main St",
  value,
  onChange,
  onAddressSelect,
  className,
}: AddressAutocompleteProps) {
  const inputId = useId();
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const sessionTokenRef = useRef(newSessionToken());
  const requestIdRef = useRef(0);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setHighlight(-1);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const searchAddresses = async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    if (!PLACES_API_KEY) {
      console.warn("AddressAutocomplete: NEXT_PUBLIC_GOOGLE_CALENDAR_API_KEY is missing");
      return;
    }

    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const response = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": PLACES_API_KEY,
        },
        body: JSON.stringify({
          input: query,
          includedRegionCodes: ["us"],
          sessionToken: sessionTokenRef.current,
        }),
      });

      if (!response.ok) {
        console.error("Places autocomplete failed:", response.status, await response.text());
        return;
      }

      const data = await response.json();
      if (requestId !== requestIdRef.current) return;

      const next: PlaceSuggestion[] = (data.suggestions || [])
        .map((item: { placePrediction?: { placeId?: string; text?: { text?: string }; structuredFormat?: { mainText?: { text?: string }; secondaryText?: { text?: string } } } }) => {
          const prediction = item.placePrediction;
          if (!prediction?.placeId) return null;
          return {
            placeId: prediction.placeId,
            primary: prediction.structuredFormat?.mainText?.text || prediction.text?.text || "",
            secondary: prediction.structuredFormat?.secondaryText?.text || "",
          };
        })
        .filter(Boolean) as PlaceSuggestion[];

      setSuggestions(next);
      setOpen(next.length > 0);
      setHighlight(-1);
    } catch (error) {
      console.error("Error fetching address suggestions:", error);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  };

  const handleChange = (text: string) => {
    onChange(text);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => searchAddresses(text), 350);
  };

  const selectSuggestion = async (suggestion: PlaceSuggestion) => {
    onChange(suggestion.primary);
    setOpen(false);
    setSuggestions([]);
    setHighlight(-1);
    setLoading(true);

    try {
      if (!PLACES_API_KEY) return;

      const response = await fetch(
        `https://places.googleapis.com/v1/places/${encodeURIComponent(suggestion.placeId)}?sessionToken=${encodeURIComponent(sessionTokenRef.current)}`,
        {
          headers: {
            "X-Goog-Api-Key": PLACES_API_KEY,
            "X-Goog-FieldMask": "formattedAddress,addressComponents",
          },
        }
      );

      sessionTokenRef.current = newSessionToken();

      if (!response.ok) {
        console.error("Places details failed:", response.status, await response.text());
        onAddressSelect({ route: suggestion.primary });
        return;
      }

      const data = await response.json();
      const components = data.addressComponents as
        | { longText?: string; shortText?: string; types?: string[] }[]
        | undefined;

      const streetNumber = componentOf(components, "street_number");
      const route = componentOf(components, "route");
      const streetLine = [streetNumber, route].filter(Boolean).join(" ").trim();

      onAddressSelect({
        street_number: streetNumber,
        route: route || suggestion.primary,
        locality:
          componentOf(components, "locality") ||
          componentOf(components, "sublocality") ||
          componentOf(components, "postal_town"),
        administrative_area_level_1: componentOf(components, "administrative_area_level_1", true),
        postal_code: componentOf(components, "postal_code"),
        country: componentOf(components, "country", true),
      });

      if (streetLine || data.formattedAddress) {
        onChange(streetLine || data.formattedAddress);
      }
    } catch (error) {
      console.error("Error getting address details:", error);
      sessionTokenRef.current = newSessionToken();
      onAddressSelect({ route: suggestion.primary });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={rootRef} className={cx("relative mb-4", className)}>
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block font-sans-semibold text-[13px] text-zinc-700 dark:text-zinc-300">
          {label}
          {required && <span className="text-red-600 dark:text-red-400"> *</span>}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          value={value}
          placeholder={placeholder}
          autoComplete="off"
          required={required}
          className={INPUT_CLASS}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setOpen(true);
          }}
          onKeyDown={(e) => {
            if (!open || suggestions.length === 0) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setHighlight((h) => (h + 1) % suggestions.length);
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlight((h) => (h <= 0 ? suggestions.length - 1 : h - 1));
            } else if (e.key === "Enter" && highlight >= 0) {
              e.preventDefault();
              void selectSuggestion(suggestions[highlight]);
            } else if (e.key === "Escape") {
              setOpen(false);
              setHighlight(-1);
            }
          }}
        />
        {loading && (
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-zinc-400">
            <Spinner size={14} />
          </div>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 z-50 mt-1.5 max-h-56 overflow-auto rounded-2xl border border-zinc-100 bg-white py-1 shadow-lg dark:border-white/10 dark:bg-zinc-900"
        >
          {suggestions.map((item, index) => (
            <li key={item.placeId}>
              <button
                type="button"
                role="option"
                aria-selected={index === highlight}
                className={cx(
                  "flex w-full flex-col px-4 py-2.5 text-left transition-colors",
                  index === highlight
                    ? "bg-red-50 dark:bg-red-500/10"
                    : "hover:bg-zinc-50 dark:hover:bg-white/[0.04]"
                )}
                onMouseEnter={() => setHighlight(index)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => void selectSuggestion(item)}
              >
                <span className="text-[13px] leading-[18px] text-zinc-900 dark:text-white">{item.primary}</span>
                {item.secondary ? (
                  <span className="mt-0.5 text-[12px] leading-[16px] text-zinc-500 dark:text-zinc-400">
                    {item.secondary}
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
