"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Generate" },
  { href: "/training", label: "Training Data" },
  { href: "/fine-tune", label: "Fine-Tune" },
] as const;

export const Nav = () => {
  const pathname = usePathname();
  return (
    <nav className="border-b border-zinc-800 bg-zinc-950 px-6 py-4">
      <div className="mx-auto flex max-w-4xl items-center gap-8">
        <span className="text-lg font-bold text-white">Lincoln</span>
        <div className="flex gap-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm transition-colors ${
                pathname === link.href
                  ? "text-white font-medium"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};
