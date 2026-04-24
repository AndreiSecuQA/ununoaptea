import Button from "@/components/ui/Button";

interface Props {
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  showBack?: boolean;
  onSkip?: () => void;
}

export default function WizardNav({
  onBack,
  onNext,
  nextLabel = "Continuă →",
  nextDisabled,
  showBack = true,
  onSkip,
}: Props) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-8 pt-6 border-t border-ink/10">
      <div>
        {showBack && onBack && (
          <Button variant="ghost" onClick={onBack} type="button">
            ← Înapoi
          </Button>
        )}
      </div>
      <div className="flex items-center gap-3">
        {onSkip && (
          <Button variant="ghost" onClick={onSkip} type="button">
            Sari peste
          </Button>
        )}
        <Button
          variant="primary"
          onClick={onNext}
          disabled={nextDisabled}
          type="button"
        >
          {nextLabel}
        </Button>
      </div>
    </div>
  );
}
