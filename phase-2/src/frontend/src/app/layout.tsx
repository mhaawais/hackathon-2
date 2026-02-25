import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeInitializer } from "@/components/ui/theme-initializer";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "TodoMate — Plan. Focus. Finish.",
  description:
    "TodoMate is a modern, secure todo app. Plan your tasks, stay focused, and get things done.",
  openGraph: {
    title: "TodoMate — Plan. Focus. Finish.",
    description: "Plan your tasks, stay focused, and get things done.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "TodoMate — Plan. Focus. Finish.",
    description: "Plan your tasks, stay focused, and get things done.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans min-h-screen antialiased`}>
        <ThemeInitializer />
        {children}
      </body>
    </html>
  );
}
