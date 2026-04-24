export default function Cookies() {
  return (
    <article className="max-w-2xl mx-auto px-5 py-12">
      <h1 className="serif text-3xl mb-6">Politica de cookies</h1>

      <p className="text-sm text-muted mb-6">
        Ultima actualizare: {new Date().toLocaleDateString("ro-RO")}.
      </p>

      <section className="space-y-4 text-sm leading-relaxed text-ink">
        <h2 className="serif text-xl mt-6">Cookies strict necesare</h2>
        <p>
          Folosim cookies de sesiune pentru funcționalitatea de bază
          (wizard-ul salvează progresul local în browserul tău, fără server).
          Aceste cookies nu necesită consimțământ separat.
        </p>

        <h2 className="serif text-xl mt-6">Analytics</h2>
        <p>
          Folosim Plausible / Umami — analytics fără cookies personale,
          GDPR-compatible. Nu urmărim utilizatori, nu construim profile.
        </p>

        <h2 className="serif text-xl mt-6">Stripe</h2>
        <p>
          Procesul de plată e găzduit de Stripe și folosește cookies
          tranzacționale pentru securitate. Termenii lor:{" "}
          <a
            href="https://stripe.com/privacy"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            stripe.com/privacy
          </a>
          .
        </p>
      </section>
    </article>
  );
}
