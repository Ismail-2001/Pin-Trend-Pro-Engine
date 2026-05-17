export default function Home() {
  return (
    <main style={{ display: "grid", placeItems: "center", minHeight: "100vh", padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 680, textAlign: "center" }}>
        <h1 style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", marginBottom: "1rem" }}>PinTrend Pro</h1>
        <p style={{ fontSize: "1.1rem", lineHeight: 1.7, color: "#444" }}>
          Next.js API route is ready. POST to <code>/api/generate</code> with a valid OpenAI API key and request body to generate Mexican home decor Pinterest keywords.
        </p>
      </div>
    </main>
  );
}
