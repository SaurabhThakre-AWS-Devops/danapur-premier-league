"use client";

import { Button } from "@/components/ui/button";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="font-display text-4xl tracking-wide text-[#f6f1e4]">Something went wrong</h1>
      <p className="mt-3 text-[#f6f1e4]/75">Reload the page and try again.</p>
      <Button type="button" className="mt-6 h-12" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
