/**
 * LANDVAULT AI brand mark — a shielded land-parcel grid with a vault keyline.
 *
 * Symbolizes the product: a secure vault (preservation, trust, audit) protecting
 * a digitised survey parcel grid. Rendered in `currentColor` so it adapts to any
 * badge — accent, navy, or dark chrome. The top stem reads as a vault key.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden focusable="false">
      {/* Shield / vault body */}
      <path
        d="M12 2.7 19.7 5.7v6.5c0 5.2-3.5 9.2-7.7 10.5C7.8 21.5 4.3 17.5 4.3 12.2V5.7L12 2.7z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      {/* Survey parcel grid */}
      <path d="M12 6.6v10.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.9" />
      <path d="M7.4 10h9.2M7.4 14h9.2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" opacity="0.5" />
      {/* Vault key stem */}
      <path d="M12 2.7v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.85" />
    </svg>
  )
}