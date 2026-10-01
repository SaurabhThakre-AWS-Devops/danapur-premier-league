"use client";

import { Button } from "@/components/ui/button";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="font-hindi text-4xl text-[#f6f1e4]">कुछ गड़बड़ हो गई</h1>
      <p className="mt-3 text-[#f6f1e4]/75">Page dubara khol ke try karo.</p>
      <Button type="button" className="mt-6 h-12" onClick={reset}>
        Dobara
      </Button>
    </div>
  );
}
