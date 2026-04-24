interface Props {
  template: string;
  className?: string;
}

/**
 * Visual stand-in for the PDF background. We don't bundle the A5 PNG into the
 * frontend — we approximate the cream + footer gradient so preview cards feel
 * like the real page.
 */
export default function TemplateBackground({ template, className }: Props) {
  // Only "template1" exists in MVP, but keep switching ready for v2.
  switch (template) {
    case "template1":
    default:
      return (
        <div
          className={className}
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, #FAFAF8 0%, #FAFAF8 70%, #f0e6d3 100%)",
          }}
        />
      );
  }
}
