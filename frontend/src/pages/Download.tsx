import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { buildDownloadUrl } from "@/services/api";

export default function Download() {
  const { orderId } = useParams<{ orderId: string }>();
  const [params] = useSearchParams();
  const token = params.get("token");
  const [redirected, setRedirected] = useState(false);

  useEffect(() => {
    if (orderId && token) {
      const url = buildDownloadUrl(orderId, token);
      setRedirected(true);
      window.location.href = url;
    }
  }, [orderId, token]);

  return (
    <div className="max-w-xl mx-auto px-5 py-20 text-center">
      {!token && (
        <>
          <h1 className="serif text-3xl mb-3">Link invalid</h1>
          <p className="text-muted">
            Te rugăm să folosești linkul primit pe email.
          </p>
        </>
      )}
      {token && (
        <>
          <h1 className="serif text-3xl mb-3">Se descarcă…</h1>
          <p className="text-muted text-sm">
            {redirected
              ? "Te redirecționăm către PDF-ul tău. Dacă nu pornește automat, reîncarcă pagina."
              : "Pregătim linkul de descărcare."}
          </p>
        </>
      )}
    </div>
  );
}
