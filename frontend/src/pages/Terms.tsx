export default function Terms() {
  return (
    <article className="max-w-2xl mx-auto px-5 py-12">
      <h1 className="serif text-3xl mb-6">Termeni și condiții</h1>

      <p className="text-sm text-muted mb-6">
        Ultima actualizare: {new Date().toLocaleDateString("ro-RO")}.
      </p>

      <section className="space-y-4 text-sm leading-relaxed text-ink">
        <h2 className="serif text-xl mt-6">Produs</h2>
        <p>
          Calendar digital PDF personalizat de 367 pagini (copertă + 365 zile +
          pagina de închidere), format A5, în limba română.
        </p>

        <h2 className="serif text-xl mt-6">Preț</h2>
        <p>
          €15, TVA inclus conform reglementărilor EU pentru servicii digitale.
          Plată procesată de Stripe.
        </p>

        <h2 className="serif text-xl mt-6">Livrare</h2>
        <p>
          Instant post-plată: PDF-ul e generat în 30–90 de secunde și linkul de
          descărcare e trimis pe emailul indicat. Valabilitate link: 90 de zile.
        </p>

        <h2 className="serif text-xl mt-6">Dreptul de retragere</h2>
        <p>
          Conform Art. 16(m) din Directiva 2011/83/EU (produse digitale),
          renunți la dreptul de retragere prin checkbox explicit la plată.
          Pentru probleme reale, ne poți scrie oricând.
        </p>

        <h2 className="serif text-xl mt-6">Proprietate intelectuală</h2>
        <p>
          Template-urile, pool-ul de citate și iconițele aparțin Unu Noaptea.
          Păstrezi drepturile asupra personalizării (nume, mesaje, iconițe alese).
        </p>

        <h2 className="serif text-xl mt-6">Jurisdicție</h2>
        <p>
          Legea română / moldovenească, conform sediului operatorului.
        </p>
      </section>
    </article>
  );
}
