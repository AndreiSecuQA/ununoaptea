import { useState } from "react";
import { useNavigate } from "react-router-dom";
import WizardNav from "./WizardNav";
import TextField from "@/components/ui/TextField";
import LegalModal from "@/components/ui/LegalModal";
import { useWizardState } from "@/hooks/useWizardState";
import { createOrder } from "@/services/api";
import type {
  CalendarConfig,
  OrderCreateRequest,
} from "@/types/calendar.types";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// Demo mode: skips Stripe. The backend generates a real PDF and the
// "checkout_url" returned is actually the order status page. Default ON —
// to run with real Stripe checkout, set VITE_DEMO_MODE=false at build time.
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE !== "false";

export default function Step7_Payment() {
  const email = useWizardState((s) => s.email);
  const setEmail = useWizardState((s) => s.setEmail);
  const consents = useWizardState((s) => s.consents);
  const setConsent = useWizardState((s) => s.setConsent);
  const data = useWizardState((s) => s.data);
  const back = useWizardState((s) => s.back);
  const navigate = useNavigate();

  const [modal, setModal] = useState<null | "privacy" | "terms">(null);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const emailValid = EMAIL_RE.test(email);
  const canPay =
    emailValid && consents.gdpr && consents.withdrawal && !submitting;

  async function submit() {
    setErr(null);
    setSubmitting(true);
    try {
      // Validate config presence (Step 1-6 must have been completed)
      const cfg = data as CalendarConfig;
      if (
        !cfg.first_name ||
        !cfg.start_date ||
        !cfg.user_profile ||
        !cfg.icon_mapping ||
        !cfg.calendar_name
      ) {
        throw new Error("Configurația nu e completă. Întoarce-te la pașii anteriori.");
      }
      const payload: OrderCreateRequest = {
        calendar_config: cfg,
        email,
        gdpr_consent: consents.gdpr,
        marketing_consent: consents.marketing,
        withdrawal_waiver: consents.withdrawal,
      };
      const { checkout_url } = await createOrder(payload);
      // Redirect to Stripe Checkout
      window.location.href = checkout_url;
    } catch (e) {
      const anyErr = e as { response?: { data?: { detail?: string } }; message?: string };
      setErr(
        anyErr.response?.data?.detail ??
          anyErr.message ??
          "Ceva n-a mers. Încearcă din nou."
      );
      setSubmitting(false);
    }
  }

  return (
    <section className="max-w-xl">
      <h1 className="serif text-3xl sm:text-4xl mb-2">
        Un ultim pas înainte de magie.
      </h1>
      <p className="text-muted mb-8">
        {DEMO_MODE
          ? "Demo preview — fără plată. Calendarul tău PDF se generează și apare la statusul comenzii în 1–2 minute."
          : "Plata e procesată securizat de Stripe. Calendarul ajunge pe email în 1–2 minute."}
      </p>

      {DEMO_MODE && (
        <div className="mb-6 px-4 py-3 rounded-md border border-amber-300 bg-amber-50 text-sm text-amber-900">
          <strong>Mod demonstrativ activ.</strong> Nicio plată nu e colectată.
          Acest flow generează un PDF real pentru preview.
        </div>
      )}

      <div className="space-y-5">
        <TextField
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value.trim())}
          placeholder="email@domeniu.com"
          hint="Verifică atent — aici primești PDF-ul."
          error={
            email.length > 0 && !emailValid ? "Email invalid." : undefined
          }
        />

        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            className="mt-1 accent-ink"
            checked={consents.gdpr}
            onChange={(e) => setConsent("gdpr", e.target.checked)}
          />
          <span>
            Sunt de acord cu{" "}
            <button
              type="button"
              onClick={() => setModal("terms")}
              className="underline"
            >
              Termenii
            </button>{" "}
            și{" "}
            <button
              type="button"
              onClick={() => setModal("privacy")}
              className="underline"
            >
              Politica de confidențialitate
            </button>
            .
          </span>
        </label>

        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            className="mt-1 accent-ink"
            checked={consents.marketing}
            onChange={(e) => setConsent("marketing", e.target.checked)}
          />
          <span>
            Vreau să primesc ocazional noutăți și oferte de la Unu Noaptea.
          </span>
        </label>

        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            className="mt-1 accent-ink"
            checked={consents.withdrawal}
            onChange={(e) => setConsent("withdrawal", e.target.checked)}
          />
          <span>
            Înțeleg că îmi primesc calendarul imediat după plată și{" "}
            <strong className="text-ink">
              renunț la dreptul de retragere
            </strong>{" "}
            pentru produs digital.
          </span>
        </label>
      </div>

      <div className="mt-8 p-4 border border-ink/10 rounded-md bg-cream">
        <div className="flex justify-between text-sm">
          <span>Calendar digital PDF</span>
          <span className="text-ink">{DEMO_MODE ? "Gratuit (demo)" : "€15"}</span>
        </div>
        <p className="text-xs text-muted mt-1">
          Livrare instant, în email. PDF A5 — 367 pagini.
        </p>
      </div>

      {err && (
        <p className="text-xs text-red-600 mt-4" role="alert">
          {err}
        </p>
      )}

      <WizardNav
        onBack={back}
        onNext={submit}
        nextLabel={
          submitting
            ? "Procesez…"
            : DEMO_MODE
              ? "Generează calendarul demo →"
              : "Plătește €15 și generează →"
        }
        nextDisabled={!canPay}
      />

      <LegalModal
        open={modal === "privacy"}
        title="Politica de confidențialitate"
        onClose={() => setModal(null)}
      >
        <p>
          Colectăm doar datele necesare pentru a livra calendarul (nume, email,
          configurația calendarului, IP-ul în formă anonimizată pentru fraudă).
          Datele sunt păstrate maxim 3 ani, apoi șterse automat. Plata e
          gestionată de Stripe, emailul de Resend, stocarea PDF de S3.
          Îți poți șterge datele oricând din pagina{" "}
          <em>Șterge-mi datele</em>.
        </p>
      </LegalModal>

      <LegalModal
        open={modal === "terms"}
        title="Termeni și condiții"
        onClose={() => setModal(null)}
      >
        <p>
          Produs: calendar digital personalizat PDF, €15 (TVA inclus conform
          reglementării EU pentru produse digitale). Livrare instant după
          plată. Conform Art. 16(m) din Directiva 2011/83/EU, renunți la
          dreptul de retragere prin checkbox explicit la plată. Proprietatea
          intelectuală asupra template-urilor și citatelor aparține Unu
          Noaptea; păstrezi drepturile asupra personalizării tale.
        </p>
      </LegalModal>

      <button
        type="button"
        onClick={() => navigate("/")}
        className="sr-only"
        tabIndex={-1}
      />
    </section>
  );
}
