import { useState } from "react";
import TextField from "@/components/ui/TextField";
import Button from "@/components/ui/Button";
import { requestDataDeletion } from "@/services/api";

export default function DeleteMyData() {
  const [email, setEmail] = useState("");
  const [orderId, setOrderId] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    if (!email) return;
    setState("sending");
    setErr(null);
    try {
      await requestDataDeletion(email.trim(), orderId.trim() || undefined);
      setState("sent");
    } catch (e) {
      setState("error");
      const anyErr = e as { response?: { data?: { detail?: string } }; message?: string };
      setErr(
        anyErr.response?.data?.detail ??
          anyErr.message ??
          "N-am putut trimite cererea."
      );
    }
  }

  return (
    <article className="max-w-xl mx-auto px-5 py-12">
      <h1 className="serif text-3xl mb-3">Șterge-mi datele</h1>
      <p className="text-sm text-muted mb-6">
        Îți trimitem un magic link pe email. La confirmare, ștergem comanda,
        PDF-ul stocat și te scoatem din lista de marketing.
      </p>

      {state === "sent" ? (
        <div className="border border-ink/10 bg-cream rounded-md p-4 text-sm">
          Am trimis linkul de confirmare la <strong>{email}</strong>. Verifică
          inbox-ul (și spam) în următoarele minute.
        </div>
      ) : (
        <div className="space-y-4">
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@domeniu.com"
            required
          />
          <TextField
            label="ID comandă (opțional)"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="xxxx-xxxx-xxxx"
            hint="Dacă știi ID-ul comenzii, accelerează ștergerea."
          />
          <Button
            onClick={submit}
            disabled={!email || state === "sending"}
            full
          >
            {state === "sending" ? "Trimitem…" : "Trimite linkul de ștergere"}
          </Button>
          {err && <p className="text-xs text-red-600">{err}</p>}
        </div>
      )}
    </article>
  );
}
