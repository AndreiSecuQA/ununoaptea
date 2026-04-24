export default function Privacy() {
  return (
    <article className="max-w-2xl mx-auto px-5 py-12 prose-sm">
      <h1 className="serif text-3xl mb-6">Politica de confidențialitate</h1>

      <p className="text-sm text-muted mb-6">
        Ultima actualizare: {new Date().toLocaleDateString("ro-RO")}.
      </p>

      <section className="space-y-4 text-sm leading-relaxed text-ink">
        <h2 className="serif text-xl mt-6">Ce date colectăm</h2>
        <p>
          Prenume, email, data de început a calendarului, zile speciale (etichete
          + zi/lună), profil de energie (zile productive / de odihnă / reflecție,
          stil de dimineață, stil de motivație, domenii focus, stiluri preferate
          de citate), configurație iconițe, mesaje personale (copertă / final),
          hash IP pentru prevenția fraudei, date de plată gestionate de Stripe.
        </p>

        <h2 className="serif text-xl mt-6">Bază legală</h2>
        <p>
          Executarea contractului (GDPR Art. 6.1.b) pentru livrarea calendarului;
          consimțământ explicit pentru marketing (Art. 6.1.a).
        </p>

        <h2 className="serif text-xl mt-6">Retenție</h2>
        <p>
          Datele se păstrează maxim 3 ani de la generarea PDF-ului, pentru
          suport tehnic. După expirare, sunt șterse automat.
        </p>

        <h2 className="serif text-xl mt-6">Subcontractori</h2>
        <p>
          Stripe (procesare plată), S3 / Cloudflare R2 (stocare PDF), Resend
          (trimitere email) — toți cu acorduri DPA semnate.
        </p>

        <h2 className="serif text-xl mt-6">Drepturile tale</h2>
        <p>
          Acces, rectificare, ștergere, portabilitate. Pagina{" "}
          <a href="/delete-my-data" className="underline">
            Șterge-mi datele
          </a>{" "}
          declanșează fluxul automat.
        </p>

        <h2 className="serif text-xl mt-6">Contact</h2>
        <p>
          <a
            className="underline"
            href="mailto:calendare@ununoaptea.com"
          >
            calendare@ununoaptea.com
          </a>
        </p>
      </section>
    </article>
  );
}
