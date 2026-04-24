import { useState } from "react";
import { Link } from "react-router-dom";

const FAQS: Array<{ q: string; a: string }> = [
  {
    q: "Pot comanda calendarul pentru altcineva ca cadou?",
    a: "Da — completezi formularul cu numele persoanei. Îi primești PDF-ul pe emailul tău și i-l poți redirecționa sau tipări.",
  },
  {
    q: "În ce limbi e disponibil calendarul?",
    a: "Momentan doar în limba română. Vom adăuga și alte limbi pe parcurs.",
  },
  {
    q: "Pot modifica calendarul după plată?",
    a: "PDF-ul e generat imediat după plată, deci nu se poate modifica. Dacă e ceva urgent, scrie-ne la calendare@ununoaptea.com și rezolvăm împreună.",
  },
  {
    q: "Pot printa calendarul acasă?",
    a: "Da — PDF-ul e A5, pregătit pentru printare acasă sau la orice centru de copiere.",
  },
  {
    q: "Cum funcționează rambursarea?",
    a: "Fiind produs digital livrat instant, conform legii EU renunți la dreptul de retragere prin checkbox explicit la plată. Dar dacă apare o problemă reală, ne contactezi.",
  },
  {
    q: "Cum îmi șterg datele?",
    a: "Pagina Șterge-mi datele — trimitem un magic link pe email și la confirmare ștergem tot (comandă, PDF, marketing list).",
  },
];

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="max-w-4xl mx-auto px-5 pt-10 pb-20">
      {/* Hero */}
      <section className="text-center py-12 sm:py-20">
        <h1 className="serif text-4xl sm:text-6xl leading-tight text-ink">
          Calendarul tău de 365 de zile.
        </h1>
        <p className="text-muted text-lg mt-4 max-w-xl mx-auto">
          Personalizat cu numele tău, citatele tale preferate și zilele care
          contează pentru tine. Livrat instant, în format PDF.
        </p>
        <div className="mt-8">
          <Link to="/wizard" className="btn-primary text-base px-8 py-4">
            Creează calendarul tău →
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="py-12">
        <h2 className="serif text-3xl mb-8 text-center">Cum funcționează</h2>
        <div className="grid sm:grid-cols-4 gap-6">
          {[
            { n: "1", t: "Alegi stilul", d: "Template-ul minimalist A5." },
            { n: "2", t: "Răspunzi", d: "Nume, zile, stil de citate." },
            { n: "3", t: "Vezi preview", d: "3 pagini live, înainte să plătești." },
            { n: "4", t: "Primești PDF", d: "Instant, pe email, 367 de pagini." },
          ].map((s) => (
            <div key={s.n}>
              <div className="serif text-4xl text-accent mb-2">{s.n}</div>
              <h3 className="text-ink text-base">{s.t}</h3>
              <p className="text-muted text-sm">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What you get */}
      <section className="py-12">
        <h2 className="serif text-3xl mb-6">Ce primești</h2>
        <ul className="text-sm text-ink space-y-2 list-disc pl-5">
          <li>367 pagini PDF — copertă, 365 zile, pagina de închidere.</li>
          <li>Format A5 pregătit pentru printare acasă.</li>
          <li>Citate alese din stilul tău preferat — stoic, modern, spiritual, autori români, existențialiști.</li>
          <li>Salut zilnic personalizat cu numele tău.</li>
          <li>Sărbători naționale marcate (Moldova sau România).</li>
          <li>Zilele tale speciale incluse cu un salut dedicat.</li>
        </ul>
      </section>

      {/* Price */}
      <section className="py-12 text-center bg-ink/5 rounded-lg px-6">
        <h2 className="serif text-3xl mb-2">Un singur plan</h2>
        <p className="serif text-5xl text-ink">€15</p>
        <p className="text-muted text-sm mt-2">
          PDF digital, livrat pe email. Fără abonament.
        </p>
        <p className="text-muted text-xs mt-4">
          Livrarea fizică (carte tipărită) va fi disponibilă în curând.
        </p>
        <Link to="/wizard" className="btn-primary mt-6 inline-block">
          Începe →
        </Link>
      </section>

      {/* FAQ */}
      <section className="py-12">
        <h2 className="serif text-3xl mb-6">Întrebări frecvente</h2>
        <ul className="divide-y divide-ink/10">
          {FAQS.map((f, i) => {
            const open = openFaq === i;
            return (
              <li key={i} className="py-3">
                <button
                  type="button"
                  onClick={() => setOpenFaq(open ? null : i)}
                  className="w-full flex items-center justify-between text-left"
                  aria-expanded={open}
                >
                  <span className="text-ink text-base">{f.q}</span>
                  <span className="text-muted">{open ? "−" : "+"}</span>
                </button>
                {open && (
                  <p className="text-sm text-muted mt-2 pr-6">{f.a}</p>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* Brand story */}
      <section className="py-12">
        <h2 className="serif text-3xl mb-4">Despre Unu Noaptea</h2>
        <p className="text-sm text-ink leading-relaxed max-w-2xl">
          Un podcast românesc care vorbește la unu noaptea — ora când lumea se
          liniștește și începem să ne auzim pe noi înșine. Calendarul e o
          extensie a podcastului: 365 de momente de pauză, citate alese pe
          gustul tău, spațiu pentru zilele tale speciale.
        </p>
      </section>
    </div>
  );
}
