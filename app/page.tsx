import Link from "next/link";

export default function Home() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{
        background: "radial-gradient(ellipse at 50% 0%, #0d2a4e 0%, #050a14 60%)",
      }}
    >
      <div className="text-center animate-fade-in">
        <h1
          className="text-4xl font-bold tracking-widest mb-2"
          style={{ color: "#e8f4ff" }}
        >
          WiWa
        </h1>
        <p className="text-sm tracking-wider uppercase mb-8" style={{ color: "#3d6b9e" }}>
          Wisdom Waves
        </p>
        <Link
          href="/app"
          className="inline-block rounded-2xl px-8 py-4 text-sm font-semibold tracking-wider uppercase transition-all duration-300 active:scale-95"
          style={{
            background: "linear-gradient(135deg, #378ADD, #5BA3F5)",
            boxShadow: "0 4px 24px #378ADD44",
            color: "white",
          }}
        >
          Открыть плеер
        </Link>
      </div>
    </main>
  );
}
