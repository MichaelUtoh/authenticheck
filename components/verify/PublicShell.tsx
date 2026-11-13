import Link from "next/link";
import { Logo } from "@/components/auth/AuthShell";
import { Icon } from "@/components/ui/Icons";

/** Frame for the anonymous consumer pages. Mobile-first; content stays in a centred column on desktop. */
export function PublicShell({ newCheck, children }: { newCheck?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
          <Logo />
          {newCheck ? (
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-hover">
              <Icon name="arrowLeft" className="size-4" /> New check
            </Link>
          ) : (
            <span className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium" title="More languages coming soon">EN</span>
          )}
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 lg:py-12">{children}</main>
      <footer className="border-t border-border px-4 py-5 text-center text-xs text-muted sm:px-6">
        AuthentiCheck is a verification service, not a regulator.
      </footer>
    </div>
  );
}
