"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icons";
import { codeFromScan, formatCode } from "@/lib/api/verify";

interface Detector { detect(src: CanvasImageSource): Promise<{ rawValue: string }[]> }
type DetectorCtor = new (o: { formats: string[] }) => Detector;

/** Camera scanning relies on the browser's BarcodeDetector (Chrome, Edge, Android). Elsewhere we say so and point to typing. */
export function ScanButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-xl bg-primary text-lg font-semibold text-white transition hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        <Icon name="scan" /> Scan QR code
      </button>
      {open && <Scanner onClose={() => setOpen(false)} />}
    </>
  );
}

function Scanner({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const video = useRef<HTMLVideoElement>(null);
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    const Ctor = (globalThis as { BarcodeDetector?: DetectorCtor }).BarcodeDetector;
    let stream: MediaStream | undefined;
    let timer: ReturnType<typeof setTimeout>;
    let live = true;
    const fail = (m: string) => live && setProblem(m);

    if (!Ctor || !navigator.mediaDevices?.getUserMedia) {
      fail("This browser can't scan QR codes. Type the code printed beside it instead.");
      return;
    }
    const detector = new Ctor({ formats: ["qr_code"] });
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then(
      async (s) => {
        if (!live) return s.getTracks().forEach((t) => t.stop());
        stream = s;
        const v = video.current!;
        v.srcObject = s;
        await v.play().catch(() => {});
        const tick = async () => {
          if (!live) return;
          try {
            for (const hit of await detector.detect(v)) {
              const code = codeFromScan(hit.rawValue);
              if (code) return router.push(`/verify/${formatCode(code)}`);
              fail("That QR code isn't an AuthentiCheck product code. Try the code printed beside it.");
            }
          } catch {}
          timer = setTimeout(tick, 300);
        };
        tick();
      },
      () => fail("We couldn't use the camera. Allow camera access, or type the code instead.")
    );
    return () => { live = false; clearTimeout(timer); stream?.getTracks().forEach((t) => t.stop()); };
  }, [router]);

  return (
    <div role="dialog" aria-modal="true" aria-label="Scan QR code" className="fixed inset-0 z-50 flex flex-col bg-black text-white">
      <div className="flex items-center justify-between p-4">
        <p className="font-semibold">Scan the QR code on the pack</p>
        <button onClick={onClose} className="rounded-lg px-3 py-1.5 text-sm font-semibold ring-1 ring-white/40">Close</button>
      </div>
      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        <video ref={video} muted playsInline className="h-full w-full object-cover" />
        <div className="pointer-events-none absolute size-56 rounded-2xl border-2 border-white/80" />
      </div>
      <p role="status" className="min-h-16 p-4 text-center text-sm">{problem ?? "Hold the QR code inside the frame."}</p>
    </div>
  );
}
