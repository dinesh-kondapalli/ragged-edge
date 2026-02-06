import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ragged Edge. A global branding agency proudly based in London.",
  description:
    "Ragged Edge is a brand company for people who refuse to settle for average. It's time to commit to a different reality.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
