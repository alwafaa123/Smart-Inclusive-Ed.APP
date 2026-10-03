import "./globals.css";

export const metadata = {
  title: "Smart Inclusive Ed",
  description: "Ruang kelas digital yang mendukung pembelajaran inklusif.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
