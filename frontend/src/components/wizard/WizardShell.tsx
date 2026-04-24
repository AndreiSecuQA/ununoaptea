import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import ProgressBar from "@/components/ui/ProgressBar";
import LivePreviewThumbnail from "@/components/preview/LivePreviewThumbnail";
import { useWizardState } from "@/hooks/useWizardState";

const STEP_LABELS = [
  "Nume & dată start",
  "Zile speciale",
  "Sărbători",
  "Profil energie",
  "Iconițe",
  "Preview",
  "Plată",
];

interface Props {
  children: ReactNode;
}

export default function WizardShell({ children }: Props) {
  const step = useWizardState((s) => s.currentStep);
  const data = useWizardState((s) => s.data);

  return (
    <div className="max-w-5xl mx-auto px-5 py-8">
      <div className="sticky top-16 z-30 bg-cream pb-4">
        <ProgressBar step={step} labels={STEP_LABELS} />
      </div>
      <div className="grid lg:grid-cols-[1fr_220px] gap-8 mt-6">
        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
        {step >= 1 && step < 7 && (
          <div className="hidden lg:block sticky top-40 self-start">
            <LivePreviewThumbnail config={data} />
          </div>
        )}
      </div>
    </div>
  );
}
