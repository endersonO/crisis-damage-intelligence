// Branded loading skeleton shown while the map console chunk loads, so the
// first paint resembles the app (top bar + map + thumb dock) instead of a
// blank screen with bare text. Hook-free and bilingual.
export default function BootSkeleton() {
  return (
    <main className="boot-shell" aria-busy="true" aria-label="Cargando / Loading">
      <div className="boot-topbar">
        <span className="boot-brand">Respuesta Venezuela</span>
        <span className="boot-spinner" aria-hidden="true" />
      </div>
      <div className="boot-map">
        <p className="boot-msg">
          Cargando mapa de crisis…
          <span>Loading crisis map…</span>
        </p>
      </div>
      <div className="boot-dock" aria-hidden="true">
        <span className="boot-pill" />
        <span className="boot-pill" />
        <span className="boot-pill boot-pill-wide" />
      </div>
    </main>
  );
}
