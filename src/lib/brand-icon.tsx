import { ImageResponse } from "next/og"

const GRAPHITE = "#0e0f0e"
const CITRINE = "#d4f24a"

/**
 * Ícono de Bolsillo: una "b" citrina sobre grafito.
 * `padded` deja margen de seguridad para íconos "maskable" (Android recorta en círculo).
 */
export function brandIcon(size: number, { padded = false, rounded = false } = {}) {
  const glyph = Math.round(size * (padded ? 0.5 : 0.66))

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: GRAPHITE,
        borderRadius: rounded ? size * 0.22 : 0,
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: glyph,
          fontWeight: 700,
          lineHeight: 1,
          color: CITRINE,
          marginTop: -glyph * 0.08,
        }}
      >
        b
      </div>
    </div>,
    { width: size, height: size },
  )
}
