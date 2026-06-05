"use client";

import { motion } from "framer-motion";
import { ArrowRight, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";

type IntroScreenProps = {
  name: string;
  subtitle: string;
  label: string;
  enterLabel: string;
  skipLabel: string;
  onEnter: () => void;
};

export function IntroScreen({ name, subtitle, label, enterLabel, skipLabel, onEnter }: IntroScreenProps) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex min-h-dvh flex-col items-center justify-center bg-background px-6 text-center"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.45 } }}
    >
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="flex max-w-4xl flex-col items-center gap-8"
      >
        <p className="font-mono text-sm uppercase tracking-[0.28em] text-muted-foreground">{label}</p>
        <h1 className="text-5xl font-semibold leading-none text-foreground sm:text-7xl lg:text-8xl">{name}</h1>
        <p className="max-w-2xl text-balance text-lg leading-8 text-muted-foreground sm:text-xl">{subtitle}</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" onClick={onEnter}>
            {enterLabel}
            <ArrowRight data-icon="inline-end" />
          </Button>
          <Button size="lg" variant="ghost" onClick={onEnter}>
            <SkipForward data-icon="inline-start" />
            {skipLabel}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
