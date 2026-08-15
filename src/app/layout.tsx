import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "Communication Planner",
  description: "1-to-1 communication management and reply safety app"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
