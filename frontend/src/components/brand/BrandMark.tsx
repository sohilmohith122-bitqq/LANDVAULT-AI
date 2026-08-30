/**
 * LANDVAULT AI brand mark — a shielded land-parcel glyph.
 *
 * Symbolizes the product: a vault (security, preservation, trust) containing a
 * survey parcel grid (digitised land records). Rendered in `currentColor` so it
 * adapts to any badge — accent, navy, or dark chrome.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden focusable="false">
      {/* Shield / vault outline */}
      <path
        d="M12 3.4 19.6 6.4v5.7c0 4.6-3.2 8.1-7.6 9.4C7.6 20.2 4.4 16.7 4.4 12.1V6.4L12 3.4z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      {/* Survey parcel grid */}
      <path d="M12 7.2v9.6" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" opacity="0.95" />
      <path d="M8.2 10.1h7.6M8.2 13.9h7.6" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" opacity="0.62" />
    </svg>
  )
}