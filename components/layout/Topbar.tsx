import { Icon } from "@/components/ui/Icons";

export function Topbar() {
  return (
    <header className="flex items-center gap-3 border-b border-border bg-white px-4 py-4 sm:px-8">
      <label className="relative max-w-xl flex-1">
        <span className="sr-only">Search</span>
        <Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-muted" />
        <input
          type="search"
          placeholder="Search products, batches or codes"
          className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </label>
      <div className="ml-auto flex items-center gap-3">
        <span className="hidden rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary sm:inline">Production</span>
        <button type="button" aria-label="Notifications" className="grid size-11 place-items-center rounded-xl border border-border bg-white">
          <Icon name="bell" />
        </button>
      </div>
    </header>
  );
}
