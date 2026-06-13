import Player from "@/components/Player";

export default function AppPage() {
  return (
    <main
      className="min-h-screen flex flex-col"
      style={{
        background: "radial-gradient(ellipse at 50% 0%, #0d2a4e 0%, #050a14 60%)",
      }}
    >
      <Player />
    </main>
  );
}
