import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-ink/10 bg-cream mt-20">
      <div className="max-w-5xl mx-auto px-5 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-sm text-muted">
        <div>
          <p className="serif text-ink text-base">Unu Noaptea</p>
          <p className="text-xs">© {new Date().getFullYear()} — Toate drepturile rezervate.</p>
        </div>
        <nav className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
          <Link to="/privacy" className="hover:text-ink">Confidențialitate</Link>
          <Link to="/terms" className="hover:text-ink">Termeni</Link>
          <Link to="/cookies" className="hover:text-ink">Cookies</Link>
          <Link to="/delete-my-data" className="hover:text-ink">Șterge-mi datele</Link>
          <a href="mailto:calendare@ununoaptea.com" className="hover:text-ink">
            calendare@ununoaptea.com
          </a>
        </nav>
      </div>
    </footer>
  );
}
