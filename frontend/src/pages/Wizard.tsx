import WizardShell from "@/components/wizard/WizardShell";
import Step1 from "@/components/wizard/Step1_BasicInfo";
import Step2 from "@/components/wizard/Step2_SpecialEvents";
import Step3 from "@/components/wizard/Step3_Holidays";
import Step4 from "@/components/wizard/Step4_EnergyProfile";
import Step5 from "@/components/wizard/Step5_Icons";
import Step6 from "@/components/wizard/Step6_Preview";
import Step7 from "@/components/wizard/Step7_Payment";
import { useWizardState } from "@/hooks/useWizardState";

export default function Wizard() {
  const step = useWizardState((s) => s.currentStep);

  return (
    <WizardShell>
      {step === 1 && <Step1 />}
      {step === 2 && <Step2 />}
      {step === 3 && <Step3 />}
      {step === 4 && <Step4 />}
      {step === 5 && <Step5 />}
      {step === 6 && <Step6 />}
      {step === 7 && <Step7 />}
    </WizardShell>
  );
}
