import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Video Factory",
  description: "Generate dev short-form videos from a prompt",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="bg-zinc-950 text-white antialiased">{children}</body>
    </html>
  );
}
