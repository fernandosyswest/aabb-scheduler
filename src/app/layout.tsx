// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AABB Tênis — Reservas e Torneios",
  description: "Sistema de reservas de quadras e torneios da AABB",
};

// Next.js 16: themeColor moved from Metadata to Viewport
export const viewport: Viewport = {
  themeColor: "#0038A9",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
