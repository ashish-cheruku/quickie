import type { Metadata } from "next";
import { cn } from "@/lib/utils";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kindle Paranormal Romance — AI Chatbot",
  description: "Ask anything about the Amazon Kindle Paranormal Romance Bestsellers dataset",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={cn("min-h-screen bg-background font-sans antialiased")}>
        {children}
      </body>
    </html>
  );
}
