import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "NOCHMAL! · The Night That Keeps Repeating",
  description:
    "A Berlin time-loop mystery. Change your words. Change your fate.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
