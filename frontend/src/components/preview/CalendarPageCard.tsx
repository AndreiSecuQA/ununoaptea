import clsx from "clsx";
import TemplateBackground from "./TemplateBackground";
import IconRenderer from "./IconRenderer";
import type { PreviewPage } from "@/services/previewRenderer";

interface Props {
  page: PreviewPage;
  template: string;
  className?: string;
  /** scale factor for text — 1 = full size (A5 proportional container) */
  scale?: number;
}

/**
 * A5 proportional card (1 : 1.414). Mirrors PDF layout:
 *   top-left: weekday, top-right: month/year
 *   center-top: day number (big serif)
 *   separator line
 *   italic salutation
 *   quote text + author
 *   footer icon
 */
export default function CalendarPageCard({
  page,
  template,
  className,
  scale = 1,
}: Props) {
  const f = (px: number) => `${px * scale}px`;

  return (
    <div
      className={clsx(
        "relative aspect-[1/1.414] bg-cream overflow-hidden rounded-sm shadow-sm border border-ink/10",
        className
      )}
    >
      <TemplateBackground template={template} />
      <div className="absolute inset-0 flex flex-col justify-between px-[8%] py-[7%] text-ink">
        <div className="flex items-center justify-between uppercase tracking-widest text-muted" style={{ fontSize: f(10) }}>
          <span>{page.header.weekday}</span>
          <span>{page.header.monthYear}</span>
        </div>

        <div className="flex flex-col items-center text-center gap-3">
          <div
            className="serif leading-none text-ink"
            style={{ fontSize: f(72) }}
          >
            {page.header.day}
          </div>
          <div className="h-px w-16 bg-ink/40" />
          <p
            className="serif italic text-ink/80"
            style={{ fontSize: f(14) }}
          >
            {page.salutation}
          </p>
          <p
            className="serif text-ink leading-snug max-w-[85%]"
            style={{ fontSize: f(13) }}
          >
            “{page.quote.text}”
          </p>
          <div className="h-px w-10 bg-ink/30" />
          <p
            className="text-muted tracking-wide"
            style={{ fontSize: f(10) }}
          >
            — {page.quote.author}
          </p>
        </div>

        <div className="flex justify-center">
          <IconRenderer
            id={page.iconId}
            size={Math.round(30 * scale)}
            className="text-ink/70"
          />
        </div>
      </div>
    </div>
  );
}
