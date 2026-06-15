import Player from "@/components/Player";

export default function AppPage() {
  return (
    <main
      className="min-h-screen flex flex-col"
      style={{ background: "#050a14" }}
    >
      {/* Top nav */}
      <nav
        className="flex items-center gap-3 px-5 py-4 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
          style={{ background: "linear-gradient(135deg, #378ADD, #5BA3F5)", color: "white" }}
        >
          W
        </div>
        <span className="text-base font-bold tracking-widest" style={{ color: "#e8f4ff" }}>
          WiWa
        </span>
        <span className="text-xs tracking-wider uppercase" style={{ color: "#3d6b9e" }}>
          нейромузыка
        </span>
      </nav>

      <Player />
    </main>
  );
}
