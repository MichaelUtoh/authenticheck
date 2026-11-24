import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "AuthentiCheck · Trust what’s inside",
  description: "A simple way for shoppers to check product codes and for manufacturers to protect every product.",
};

function Mark({ className = "" }: { className?: string }) {
  return <span className={`grid size-9 place-items-center rounded-xl bg-emerald-800 text-white ${className}`}><svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m5 12 4 4L19 6" /></svg></span>;
}

function Arrow() {
  return <svg aria-hidden viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 10h12m-5-5 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export default function Home() {
  return (
    <main className="landing-page">
      <header className="landing-nav">
        <div className="landing-container flex h-[76px] items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight text-slate-900"><Mark /><span className="text-[19px]">Authenti<span className="text-emerald-800">Check</span></span></Link>
          <nav aria-label="Main navigation" className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a href="#consumers" className="hover:text-slate-950">For consumers</a><a href="#manufacturers" className="hover:text-slate-950">For manufacturers</a><a href="#how-it-works" className="hover:text-slate-950">How it works</a>
          </nav>
          <div className="flex items-center gap-4"><Link href="/login" className="hidden text-sm font-semibold text-slate-700 hover:text-emerald-800 sm:block">Sign in</Link><Link href="/register" className="landing-nav-cta">Protect your products <Arrow /></Link></div>
        </div>
      </header>

      <section className="landing-hero">
        <div className="landing-container landing-hero-grid">
          <div className="relative z-10 py-14 md:py-24">
            <div className="landing-eyebrow"><span className="size-2 rounded-full bg-emerald-500" /> Confidence, one check at a time</div>
            <h1 className="landing-title">Trust what’s<br /><span>inside.</span></h1>
            <p className="mt-6 max-w-[490px] text-lg leading-8 text-slate-600">A simple way to check a product’s registered code. And a smarter way for brands to protect the products they make.</p>
            <div className="mt-8 flex flex-wrap gap-3"><Link href="/verify" className="landing-button landing-button-dark">Check a product <Arrow /></Link><a href="#manufacturers" className="landing-button landing-button-light">For manufacturers</a></div>
            <div className="mt-8 flex items-center gap-2 text-sm text-slate-500"><svg viewBox="0 0 20 20" className="size-4 text-emerald-700" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10 2.5 16 5v4.8c0 3.4-2.5 6.1-6 7.7-3.5-1.6-6-4.3-6-7.7V5l6-2.5Z"/><path d="m7.4 9.8 1.7 1.7 3.7-3.7"/></svg>No app or account needed to check a code</div>
          </div>

          <div className="landing-visual" aria-label="Illustration of a product verification card">
            <div className="visual-glow" />
            <div className="visual-orbit orbit-one" /><div className="visual-orbit orbit-two" />
            <div className="verify-card">
              <div className="flex items-center justify-between"><div className="flex items-center gap-2.5"><Mark className="size-8 rounded-lg"/><div><p className="text-xs font-semibold text-slate-900">AuthentiCheck</p><p className="text-[10px] text-slate-400">PRODUCT CHECK</p></div></div><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-800">SAMPLE</span></div>
              <div className="my-6 flex items-center gap-4 rounded-2xl bg-[#f5f7f3] p-4"><div className="product-illustration"><div className="product-cap"/><div className="product-label"><span className="block text-[7px] font-bold tracking-widest text-emerald-900">PURE</span><span className="mt-1 block h-px bg-emerald-200"/><span className="mt-1 block text-[6px] text-slate-500">BOTANICAL CARE</span></div></div><div><p className="text-[10px] uppercase tracking-widest text-slate-400">Checking a product</p><p className="mt-1 text-sm font-semibold text-slate-800">Scan or enter the code</p><p className="mt-1 font-mono text-xs tracking-wider text-slate-500">7KQ2 — M9XW — 4PRT</p></div></div>
              <div className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50/70 p-3.5"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-emerald-700 text-white"><svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.3"><path d="m4 10 4 4 8-8" strokeLinecap="round" strokeLinejoin="round"/></svg></span><div><p className="text-sm font-semibold text-emerald-950">Code matches a registered record</p><p className="mt-1 text-xs leading-5 text-emerald-900/70">This code has not been checked before.</p></div></div>
              <p className="mt-4 text-center text-[10px] leading-4 text-slate-400">A code check is helpful information, not proof of the physical item.</p>
            </div>
            <div className="floating-note"><span className="grid size-8 place-items-center rounded-full bg-[#e4eee7] text-emerald-800"><svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 15.5 7.5 11l3 2.5L17 6" strokeLinecap="round" strokeLinejoin="round"/><path d="M12.5 6H17v4.5" strokeLinecap="round" strokeLinejoin="round"/></svg></span><span><b className="block text-xs text-slate-800">Every check tells a story</b><span className="text-[10px] text-slate-500">Useful signals for brand teams</span></span></div>
          </div>
        </div>
      </section>

      <div className="border-y border-slate-200/70 bg-white/70"><div className="landing-container flex flex-wrap justify-center gap-x-12 gap-y-4 py-5 text-sm font-medium text-slate-600 md:justify-between"><span className="flex items-center gap-2"><i className="trust-dot">✓</i> Unique codes for individual packs</span><span className="flex items-center gap-2"><i className="trust-dot">✓</i> Simple checks, right at the shelf</span><span className="flex items-center gap-2"><i className="trust-dot">✓</i> Better visibility for manufacturers</span></div></div>

      <section className="landing-container landing-audiences">
        <div className="section-intro"><span className="landing-kicker">ONE PLATFORM. TWO SIDES OF TRUST.</span><h2>Confidence for the people<br className="hidden sm:block"/> who make it and buy it.</h2></div>
        <div className="grid gap-5 lg:grid-cols-2">
          <article id="consumers" className="audience-card consumer-card"><div className="audience-icon"><svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 8.5 12 4l8 4.5v7L12 20l-8-4.5v-7Z"/><path d="m4.5 8.7 7.5 4.2 7.5-4.2M12 13v7"/></svg></div><span className="landing-kicker">FOR SHOPPERS</span><h3>A quick check before you buy.</h3><p>Scan the QR code or type the short code printed on the pack. See whether it matches a manufacturer-registered record and whether it has been checked before.</p><Link href="/verify" className="text-link">Check a product <Arrow /></Link><div className="consumer-decoration"><span className="deco-pack"/><span className="deco-ring"/></div></article>
          <article id="manufacturers" className="audience-card brand-card"><div className="audience-icon"><svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 21V8l6 3V8l6 3V5l6 3v13H3Z"/><path d="M8 16h2m3 0h2m3 0h1"/></svg></div><span className="landing-kicker">FOR MANUFACTURERS</span><h3>Protect every product, from batch to shelf.</h3><p>Register products, issue unique codes for individual packs, monitor customer checks, and investigate unusual patterns in one workspace.</p><Link href="/register" className="text-link">Get started <Arrow /></Link><div className="brand-decoration"><div className="mini-chart"><div className="chart-head"><span>Check activity</span><span className="chart-period">7 days</span></div><div className="chart-bars"><i/><i/><i/><i/><i/><i/><i/></div></div></div></article>
        </div>
      </section>

      <section id="how-it-works" className="how-section"><div className="landing-container py-20 md:py-24"><div className="section-intro"><span className="landing-kicker">HOW IT WORKS</span><h2>Simple from pack to proof.</h2><p>Give each product a code that connects the physical pack to a useful digital check.</p></div><div className="steps-grid"><article className="step-card"><span className="step-number">01</span><span className="step-icon">▧</span><h3>Register products</h3><p>Add product details and prepare your batch in the manufacturer workspace.</p></article><div className="step-connector"/><article className="step-card"><span className="step-number">02</span><span className="step-icon">⌗</span><h3>Issue unique codes</h3><p>Create unique codes for packs, then export them for your print workflow.</p></article><div className="step-connector"/><article className="step-card"><span className="step-number">03</span><span className="step-icon">↗</span><h3>Learn from checks</h3><p>Customers check codes while your team monitors activity and reviews suspicious patterns.</p></article></div></div></section>

      <section className="landing-container platform-section"><div className="platform-copy"><span className="landing-kicker">A CLEARER VIEW FOR YOUR TEAM</span><h2>Every check gives you a little more clarity.</h2><p>See issued codes and incoming checks together. Spot patterns worth a closer look and give your team the context to investigate.</p><ul><li><span>✓</span> Product and batch visibility</li><li><span>✓</span> Check activity over time</li><li><span>✓</span> Internal flags for review</li></ul><Link href="/register" className="text-link">Explore the manufacturer platform <Arrow /></Link></div><div className="dashboard-mock"><div className="mock-top"><div><span className="mock-dot"/><span className="mock-dot"/><span className="mock-dot"/></div><span className="mock-brand">WORKSPACE OVERVIEW</span><span className="mock-avatar">AC</span></div><div className="mock-body"><div className="mock-heading"><span><b>Good morning</b><small>Your products at a glance</small></span><span className="mock-filter">Last 7 days⌄</span></div><div className="mock-metrics"><div><small>ACTIVE PRODUCTS</small><b>—</b><span>Registered catalogue</span></div><div><small>ISSUED CODES</small><b>—</b><span>Across your batches</span></div><div><small>RECENT CHECKS</small><b>—</b><span>Latest activity</span></div></div><div className="mock-graph"><div className="graph-title"><b>Check activity</b><span>Example dashboard</span></div><div className="graph-lines"><i/><i/><i/><i/></div><svg viewBox="0 0 560 95" preserveAspectRatio="none" aria-label="Illustrative check activity chart"><path d="M0 78 C40 72 48 48 90 55 S145 77 185 51 230 58 270 30 330 53 370 37 425 50 465 23 520 38 560 10" fill="none" stroke="#2b8064" strokeWidth="3"/><path d="M0 78 C40 72 48 48 90 55 S145 77 185 51 230 58 270 30 330 53 370 37 425 50 465 23 520 38 560 10 L560 95 L0 95Z" fill="url(#chartFill)"/><defs><linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#78b69a" stopOpacity=".2"/><stop offset="1" stopColor="#78b69a" stopOpacity="0"/></linearGradient></defs></svg><div className="graph-days"><span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span></div></div></div></div></section>

      <section className="truth-section"><div className="landing-container truth-grid"><div><span className="landing-kicker">HONESTY BUILDS TRUST</span><h2>Know what a check can tell you.</h2><p>AuthentiCheck gives shoppers useful information about a code. We’re clear about what it can—and can’t—say about the item in your hand.</p></div><div className="truth-points"><article><span>01</span><div><h3>A code is one signal</h3><p>A registered code does not prove that the physical item is genuine. Codes can be copied.</p></div></article><article><span>02</span><div><h3>Use your judgement, too</h3><p>Check the seal and packaging, and buy from sellers you trust.</p></div></article><article><span>03</span><div><h3>Your check stays private</h3><p>Consumer checks do not show who checked a code or where.</p></div></article></div></div></section>

      <section className="landing-container final-cta"><span className="landing-kicker">A BETTER WAY TO BUILD CONFIDENCE</span><h2>Make every product<br/>easier to trust.</h2><p>A quick check for shoppers. Clearer signals for the brands behind the products.</p><div className="mt-7 flex flex-wrap justify-center gap-3"><Link href="/verify" className="landing-button landing-button-white">Check a product <Arrow /></Link><Link href="/register" className="landing-button landing-button-outline">Protect your products</Link></div><div className="cta-pattern" aria-hidden="true"/></section>

      <footer className="landing-footer"><div className="landing-container"><div className="footer-main"><Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight text-slate-900"><Mark /><span className="text-[18px]">Authenti<span className="text-emerald-800">Check</span></span></Link><p>Verify what you buy. Protect what you make.</p><nav aria-label="Footer navigation"><a href="#consumers">For consumers</a><a href="#manufacturers">For manufacturers</a><Link href="/login">Sign in</Link><Link href="/how-to-contact">Contact</Link></nav></div><div className="footer-bottom"><span>© {new Date().getFullYear()} AuthentiCheck</span><span>AuthentiCheck is a verification service, not a regulator.</span></div></div></footer>
    </main>
  );
}
