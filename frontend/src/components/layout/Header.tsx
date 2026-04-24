import { Link, useLocation } from "react-router-dom";

export default function Header() {
  const { pathname } = useLocation();
  const isWizard = pathname.startsWith("/wizard");

  return (
    <header className="w-full border-b border-ink/10 bg-cream/80 backdrop-blur sticky top-0 z-40">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-5 py-4">
        <Link
          to="/"
          className="flex items-center gap-2 select-none"
          aria-label="Unu Noaptea — acasă"
        >
          <span className="serif text-xl tracking-tight">Unu Noaptea</span>
          <span className="text-muted text-xs hidden sm:inline">
            · Calendar
          </span>
        </Link>

        {!isWizard && (
          <nav className="flex items-center gap-3 text-sm">
            <Link
              to="/wizard"
              className="btn-primary text-xs px-4 py-2"
            >
              Creează calendarul tău →
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
