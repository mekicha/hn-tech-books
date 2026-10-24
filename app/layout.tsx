import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "U-Bahn Rush · Get lost in Berlin. Find your German.",
  description:
    "A nocturnal Berlin mystery. Follow the music, find the missing recording, and find your German.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
