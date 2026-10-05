"use client";

import { motion } from "motion/react";
import { Icon } from "../../Icon";
import { PARISH } from "../data";

/** iOS lock screen receiving a bulletin post as a push notification. */
export function LockScreen() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#140405]">
      <img src="/App_store_1024_1x.png" alt="" className="absolute left-1/2 top-[38%] w-[620px] max-w-none -translate-x-1/2 -translate-y-1/2 scale-110 opacity-70 blur-[70px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/60" />

      <div className="relative flex flex-col items-center pt-[84px] text-white">
        <Icon name="lock-closed" size={20} className="opacity-90" />
        <p className="mt-3 font-sans-semibold text-[21px] text-white/85">Sunday, August 30</p>
        <p className="-mt-1 font-sans-bold text-[104px] leading-[1.05] tracking-[-4px]">9:41</p>
      </div>

      <div className="absolute inset-x-3 bottom-[118px] space-y-2">
        <motion.div
          data-spot="push"
          initial={{ opacity: 0, y: -46, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", damping: 22, stiffness: 220, delay: 0.55 }}
          className="flex items-start rounded-[22px] bg-white/[0.16] p-3.5 text-white backdrop-blur-2xl"
        >
          <img src="/App_store_1024_1x.png" alt="" className="h-[38px] w-[38px] rounded-[9px]" />
          <div className="ml-3 min-w-0 flex-1">
            <div className="flex items-baseline justify-between">
              <p className="truncate font-sans-bold text-[15px]">{PARISH.name}</p>
              <p className="ml-2 shrink-0 font-sans text-[13px] text-white/60">now</p>
            </div>
            <p className="font-sans text-[15px] leading-[20px] text-white/90">Announcement: Bible study delayed until 5 PM today</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", damping: 26, stiffness: 170, delay: 0.15 }}
          className="mx-2 flex items-start rounded-[20px] bg-white/[0.10] p-3.5 text-white backdrop-blur-2xl"
        >
          <img src="/App_store_1024_1x.png" alt="" className="h-[34px] w-[34px] rounded-[8px] opacity-90" />
          <div className="ml-3 min-w-0 flex-1">
            <div className="flex items-baseline justify-between">
              <p className="font-sans-bold text-[14px]">Daily digest</p>
              <p className="ml-2 shrink-0 font-sans text-[12px] text-white/50">8:00 AM</p>
            </div>
            <p className="font-sans text-[14px] leading-[19px] text-white/80">4 events today, starting with Confession at 9:00 AM</p>
          </div>
        </motion.div>
      </div>

      <div className="absolute inset-x-[46px] bottom-[50px] flex justify-between">
        {(["flashlight", "camera"] as const).map((icon) => (
          <span key={icon} className="flex h-[50px] w-[50px] items-center justify-center rounded-full bg-white/[0.14] text-white backdrop-blur-xl">
            <Icon name={icon} size={22} />
          </span>
        ))}
      </div>
    </div>
  );
}
