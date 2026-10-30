"use client";

import type { UserType } from "@parohia/shared";
import { useRouter } from "next/navigation";
import { Icon, type IconName } from "../../../components/Icon";
import { useOnboarding, StepHeader } from "../OnboardingShell";

const OPTIONS: { type: UserType; title: string; description: string; icon?: IconName; points: string[] }[] = [
  {
    type: "regular_user",
    title: "Parish member",
    description: "Connect with your parish and community.",
    icon: "person",
    points: ["Follow the bulletin and RSVP", "Book confession", "Sign up to chant services"],
  },
  {
    type: "parish_admin",
    title: "Parish administrator",
    description: "Create and manage a parish on Parohia.",
    points: ["Publish posts and notify members", "Open confession times", "Manage channels and managers"],
  },
];

export default function UserTypeStep() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();

  const choose = (userType: UserType) => {
    updateData({ userType });
    router.push("/onboarding/profile");
  };

  return (
    <>
      <StepHeader eyebrow="Step 1 of 3" title="I am a…" subtitle="Choose how you'll use Parohia." />
      <div className="grid grid-cols-2 gap-4">
        {OPTIONS.map((option) => {
          const selected = data.userType === option.type;
          return (
            <button
              key={option.type}
              type="button"
              onClick={() => choose(option.type)}
              className={`group flex flex-col rounded-[28px] border p-6 text-left outline-none transition-[transform,border-color,box-shadow] duration-200 ease-out-expo hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-brand-red/50 ${
                selected
                  ? "border-red-300 bg-red-50/60 dark:border-red-500/30 dark:bg-red-500/10"
                  : "border-zinc-200/80 bg-white dark:border-white/[0.08] dark:bg-white/[0.03]"
              }`}
            >
              <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-[18px] bg-red-600 text-white">
                {option.icon ? (
                  <Icon name={option.icon} size={24} />
                ) : (
                  <img src="/parohia_icon.png" alt="" className="h-12 w-12 object-contain" />
                )}
              </span>
              <span className="font-sans-bold text-[17px] text-zinc-900 dark:text-white">{option.title}</span>
              <span className="mt-1 text-[14px] leading-relaxed text-zinc-500 dark:text-zinc-400">{option.description}</span>
              <ul className="mt-5 space-y-2">
                {option.points.map((point) => (
                  <li key={point} className="flex items-center gap-2 text-[13px] text-zinc-600 dark:text-zinc-300">
                    <Icon name="checkmark" size={13} className="text-red-500" />
                    {point}
                  </li>
                ))}
              </ul>
              <span className="mt-6 inline-flex items-center gap-1.5 text-[13px] font-semibold text-red-600 dark:text-red-400">
                Continue
                <Icon name="arrow-forward" size={13} className="transition-transform group-hover:translate-x-0.5" />
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}
