import Link from "next/link";

export default function Home() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{
        background: "radial-gradient(ellipse at 50% 0%, #0d2a4e 0%, #050a14 60%)",
      }}
    >
      <div className="text-center animate-fade-in flex flex-col items-center gap-2">
        <h1
          className="text-5xl font-bold tracking-widest"
          style={{ color: "#e8f4ff" }}
        >
          WiWa
        </h1>
        <p
          className="text-base tracking-widest"
          style={{ color: "#7fb3e8" }}
        >
          Wisdom Waves
        </p>

        {/* Автор */}
        <a
          href="https://t.me/jan_ofliyan"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm mt-1 transition-colors duration-200 hover:opacity-80"
          style={{ color: "#3d6b9e" }}
        >
          Проект Жана Офлияна
        </a>

        {/* О проекте */}
        <div
          className="mt-8 max-w-sm text-center rounded-2xl px-6 py-5"
          style={{
            background: "rgba(13,31,60,0.6)",
            border: "1px solid rgba(55,138,221,0.2)",
          }}
        >
          <p className="text-sm leading-relaxed" style={{ color: "#7fb3e8" }}>
            WiWa — нейромузыкальный сервис для управления состоянием мозга
            через бинауральные биения. Выбери режим, надень наушники — и
            мозг сам войдёт в нужное состояние: фокус, медитация, сон или
            пиковая осознанность.
          </p>
        </div>

        <Link
          href="/app"
          className="mt-8 inline-block rounded-2xl px-8 py-4 text-sm font-semibold tracking-wider uppercase transition-all duration-300 active:scale-95"
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
