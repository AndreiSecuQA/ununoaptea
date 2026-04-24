import { useParams } from "react-router-dom";
import { useOrderStatus } from "@/hooks/useOrderStatus";

export default function OrderStatus() {
  const { orderId } = useParams<{ orderId: string }>();
  const { status, stopped } = useOrderStatus(orderId);

  return (
    <div className="max-w-xl mx-auto px-5 py-16 text-center">
      {!status && (
        <>
          <div className="mx-auto w-10 h-10 border-2 border-ink border-t-transparent rounded-full animate-spin" />
          <p className="text-muted mt-6">Verificăm statusul comenzii…</p>
        </>
      )}

      {status?.status === "pending_payment" && (
        <>
          <h1 className="serif text-3xl mb-3">Aștept plata…</h1>
          <p className="text-muted">
            Finalizează plata pentru a începe generarea calendarului tău.
          </p>
        </>
      )}

      {status?.status === "generating" && (
        <>
          <div className="mx-auto w-10 h-10 border-2 border-ink border-t-transparent rounded-full animate-spin" />
          <h1 className="serif text-3xl mt-6 mb-3">
            Calendarul tău se pregătește…
          </h1>
          <p className="text-muted">
            Estimare: 30–45 de secunde. Poți închide pagina — îți trimitem
            email când e gata.
          </p>
        </>
      )}

      {status?.status === "ready" && (
        <>
          <h1 className="serif text-3xl mb-3">Calendarul tău e gata ✨</h1>
          <p className="text-muted mb-6">
            Verifică și inbox-ul — ți-am trimis linkul de descărcare.
          </p>
          {status.download_url ? (
            <a href={status.download_url} className="btn-primary">
              Descarcă calendarul →
            </a>
          ) : (
            <p className="text-xs text-muted">
              Linkul sigur ajunge pe email în câteva secunde.
            </p>
          )}
        </>
      )}

      {status?.status === "failed" && (
        <>
          <h1 className="serif text-3xl mb-3">Ceva n-a mers bine.</h1>
          <p className="text-muted">
            {status.error_message ??
              "Te-am contactat pe email și îți răspundem în cel mult 24h."}
          </p>
          <p className="text-xs text-muted mt-4">
            Scrie-ne direct la{" "}
            <a
              className="underline"
              href="mailto:calendare@ununoaptea.com"
            >
              calendare@ununoaptea.com
            </a>
          </p>
        </>
      )}

      {stopped && status?.status !== "ready" && status?.status !== "failed" && (
        <p className="text-xs text-muted mt-6">
          Îți trimitem email imediat ce calendarul e gata.
        </p>
      )}
    </div>
  );
}
