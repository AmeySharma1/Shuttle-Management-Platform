'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Bus, ArrowRight, Sparkles } from 'lucide-react';
import Button from '@/components/ui/Button';

/** Hero section inspired by Linear & Copilot with large crisp headline, subtle badge, and solid blue CTA. */
export default function Hero({ onGetStarted }) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="relative overflow-hidden saas-card p-6 sm:p-8 md:p-12">
      {/* Top subtle blue background glow */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-96 -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative flex flex-col-reverse items-center justify-between gap-8 lg:flex-row">
        {/* Left column */}
        <div className="flex-1 space-y-5 text-center lg:text-left">
          {/* Subtle top pill badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--card-border)] bg-[var(--surface-nested)] px-3.5 py-1 text-xs font-medium text-[var(--foreground)]">
            <Sparkles className="h-3.5 w-3.5 text-[var(--accent-blue)]" />
            <span>Campus Shuttle Management</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground-heading)] sm:text-4xl md:text-5xl lg:text-6xl">
            Campus shuttle booking
          </h1>

          <p className="max-w-xl text-sm leading-relaxed text-[var(--foreground)] sm:text-base md:text-lg">
            Navigate campus with confidence. Fast, reliable shuttle rides for students and staff.
          </p>

          <div className="pt-2 flex flex-wrap justify-center lg:justify-start gap-3">
            <Button
              size="lg"
              icon={<ArrowRight className="h-4 w-4" />}
              onClick={onGetStarted}
            >
              Get Started
            </Button>
          </div>
        </div>

        {/* Right illustration / preview card */}
        <div className="relative flex h-52 w-full max-w-sm shrink-0 items-center justify-center sm:h-64 lg:h-72 lg:w-96">
          {!imageError ? (
            <div className="relative h-full w-full overflow-hidden rounded-xl border border-[var(--card-border)] shadow-lg bg-[var(--surface-nested)]">
              <Image
                src="/illustrations/hero.png"
                alt="Campus Shuttle"
                width={400}
                height={300}
                priority
                onError={() => setImageError(true)}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center rounded-xl border border-[var(--card-border)] bg-[var(--surface-nested)] p-6 text-[var(--accent-blue)]">
              <Bus className="h-16 w-16 text-[var(--accent-blue)]" />
              <span className="mt-3 text-xs font-medium text-[var(--foreground-muted)]">
                Campus Shuttle Network
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
