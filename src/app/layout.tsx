import type { Metadata } from "next";
import { Nav } from "@/components/nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lincoln - Instagram Caption Generator",
  description: "Generate Instagram captions using a fine-tuned model",
};

const RootLayout = ({ children }: { readonly children: React.ReactNode }) => {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-zinc-950 text-white antialiased">
        <Nav />
        <main className="mx-auto max-w-4xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
};

export default RootLayout;
