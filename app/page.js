'use client';

import { useRouter } from 'next/navigation';
import { Bus, CarFront, ShieldCheck } from 'lucide-react';
import Hero from '@/components/layout/Hero';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useRole } from '@/components/layout/RoleProvider';
import { ROLES } from '@/lib/constants';

const roleCards = [
  { role: ROLES.COMMUTER, title: 'Commuter', description: 'Book rides and see your trips', icon: Bus, path: '/commuter/book' },
  { role: ROLES.ADMIN, title: 'Admin', description: 'Manage bookings, drivers and routes', icon: ShieldCheck, path: '/admin' },
  { role: ROLES.DRIVER, title: 'Driver', description: 'Manage your duty and trips', icon: CarFront, path: '/driver' },
];

/** Welcome page with role selection cards. */
export default function WelcomePage() {
  const router = useRouter();
  const { selectRole } = useRole();
  const chooseRole = (role, path) => { selectRole(role); router.push(path); };

  return (
    <main className="mx-auto min-h-screen max-w-7xl space-y-8 px-4 py-6 sm:px-6 sm:py-10">
      <Hero onGetStarted={() => document.getElementById('role-selection')?.scrollIntoView({ behavior: 'smooth' })} />
      <section id="role-selection" className="space-y-4">
        <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-blue)]">Choose your workspace</p><h2 className="mt-2 text-2xl font-bold text-[var(--foreground-heading)]">How will you use CampusRide?</h2><p className="mt-1 text-sm text-[var(--foreground-muted)]">Select a role to open the right tools for your day.</p></div>
        <div className="grid gap-4 md:grid-cols-3">
          {roleCards.map(({ role, title, description, icon: Icon, path }) => <Card key={role} className="flex flex-col justify-between gap-7"><div><div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--icon-border)] bg-[var(--icon-bg)] text-[var(--icon-color)]"><Icon className="h-5 w-5" /></div><h3 className="text-lg font-semibold text-[var(--foreground-heading)]">{title}</h3><p className="mt-1 text-sm text-[var(--foreground-muted)]">{description}</p></div><Button onClick={() => chooseRole(role, path)} className="w-full">Continue as {title}</Button></Card>)}
        </div>
      </section>
    </main>
  );
}
