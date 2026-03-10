import type { Metadata } from "next";
import { AuthGate } from "@/components/auth-gate";
import { Sidebar } from "@/components/sidebar";
import "./globals.css";

const LOGO_TOKEN = process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN;
const FAVICON_URL = LOGO_TOKEN
  ? `https://img.logo.dev/instagram.com?token=${LOGO_TOKEN}&size=64&format=png`
  : undefined;

export const metadata: Metadata = {
  title: "Hasti's Caption Writer",
  description: "AI-powered Instagram captions in Hasti's style",
  icons: FAVICON_URL ? { icon: FAVICON_URL } : undefined,
  manifest: "/manifest.json",
  themeColor: "#09090b",
};

const RootLayout = ({ children }: { readonly children: React.ReactNode }) => {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-zinc-950 text-white antialiased">
        <AuthGate>
          <Sidebar />
          <main className="ml-56 min-h-screen p-8">{children}</main>
        </AuthGate>
      </body>
    </html>
  );
};

export default RootLayout;
