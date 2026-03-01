import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import { AppShell } from "../components/AppShell";

export const metadata: Metadata = {
  title: "ASTU STEM Service Portal",
  description:
    "Complaints, analytics, and AI assistant for students and staff.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="gradient-shell min-h-screen">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
