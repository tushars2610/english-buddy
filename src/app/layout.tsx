import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SpeakStar – English Learning for Kids",
  description: "Fun English speaking practice for kids aged 9–14",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        {children}
      </body>
    </html>
  );
}
