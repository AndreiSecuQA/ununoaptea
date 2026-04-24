import { useMemo } from "react";
import type { CalendarConfig } from "@/types/calendar.types";
import CalendarPageCard from "./CalendarPageCard";
import { buildPreviewPages } from "@/services/previewRenderer";

interface Props {
  config: Partial<CalendarConfig>;
}

/**
 * Sticky mini-preview shown beside the wizard. Falls back to a placeholder
 * when we don't yet have enough config to render the first page.
 */
export default function LivePreviewThumbnail({ config }: Props) {
  const pages = useMemo(() => buildPreviewPages(config), [config]);
  const first = pages[0];

  return (
    <aside
      className="w-full max-w-[180px] mx-auto lg:mx-0"
      aria-label="Preview calendar"
    >
      <p className="text-[10px] uppercase tracking-widest text-muted mb-2 text-center lg:text-left">
        Preview live
      </p>
      {first ? (
        <CalendarPageCard
          page={first}
          template={config.template ?? "template1"}
          scale={0.45}
        />
      ) : (
        <div className="aspect-[1/1.414] bg-cream border border-ink/10 rounded-sm flex items-center justify-center text-xs text-muted text-center px-3">
          Preview-ul apare imediat ce completezi primii pași.
        </div>
      )}
      {config.first_name && (
        <p className="text-xs text-muted mt-2 text-center lg:text-left">
          pentru <span className="text-ink">{config.first_name}</span>
        </p>
      )}
    </aside>
  );
}
