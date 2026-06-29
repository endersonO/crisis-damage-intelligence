import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sin conexión — Respuesta Venezuela",
  robots: { index: false, follow: false },
};

// Shown by the service worker when a navigation happens with no network and no
// cached copy of the requested page.
export default function OfflinePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: 420 }}>
        <h1 style={{ fontSize: 22, margin: "0 0 10px" }}>Sin conexión</h1>
        <p style={{ margin: "0 0 6px", lineHeight: 1.5 }}>
          No hay conexión a internet. El mapa de daños necesita red para cargar
          imágenes satelitales y capas.
        </p>
        <p style={{ margin: 0, lineHeight: 1.5, color: "#676b64" }}>
          You are offline. The damage map needs a connection to load imagery and
          layers. Reconnect and reload.
        </p>
      </div>
    </main>
  );
}
