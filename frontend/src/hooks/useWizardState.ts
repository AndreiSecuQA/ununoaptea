import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CalendarConfig } from "@/types/calendar.types";

export type WizardStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface WizardState {
  currentStep: WizardStep;
  data: Partial<CalendarConfig>;
  email: string;
  consents: {
    gdpr: boolean;
    marketing: boolean;
    withdrawal: boolean;
  };

  setStep: (s: WizardStep) => void;
  next: () => void;
  back: () => void;
  setField: <K extends keyof CalendarConfig>(k: K, v: CalendarConfig[K]) => void;
  setEmail: (v: string) => void;
  setConsent: (k: "gdpr" | "marketing" | "withdrawal", v: boolean) => void;
  reset: () => void;
}

const initial = {
  currentStep: 1 as WizardStep,
  data: {
    template: "template1" as const,
    special_events: [],
    selected_holidays: [],
  } as Partial<CalendarConfig>,
  email: "",
  consents: { gdpr: false, marketing: false, withdrawal: false },
};

export const useWizardState = create<WizardState>()(
  persist(
    (set, get) => ({
      ...initial,
      setStep: (s) => set({ currentStep: s }),
      next: () => {
        const cur = get().currentStep;
        if (cur < 7) set({ currentStep: (cur + 1) as WizardStep });
      },
      back: () => {
        const cur = get().currentStep;
        if (cur > 1) set({ currentStep: (cur - 1) as WizardStep });
      },
      setField: (k, v) => set((s) => ({ data: { ...s.data, [k]: v } })),
      setEmail: (v) => set({ email: v }),
      setConsent: (k, v) =>
        set((s) => ({ consents: { ...s.consents, [k]: v } })),
      reset: () => set({ ...initial }),
    }),
    {
      name: "unu-noaptea-wizard-v1",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
