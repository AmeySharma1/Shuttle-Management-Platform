'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Bus, CalendarDays, CarFront, ChevronLeft, ChevronRight, ClipboardList, LayoutDashboard, LogOut, MapPinned, Menu, Users } from 'lucide-react';
import ThemeToggle from '@/components/layout/ThemeToggle';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import { useRole } from '@/components/layout/RoleProvider';
import { ROLES } from '@/lib/constants';

const navigation = {
  commuter: [{ label: 'Book a ride', href: '/commuter/book', icon: CalendarDays }, { label: 'My trips', href: '/commuter/trips', icon: ClipboardList }],
  admin: [{ label: 'Overview', href: '/admin', icon: LayoutDashboard }, { label: 'Bookings', href: '/admin/bookings', icon: ClipboardList }, { label: 'Drivers', href: '/admin/drivers', icon: Users }, { label: 'Routes', href: '/admin/routes', icon: MapPinned }],
  driver: [{ label: 'My day', href: '/driver', icon: CarFront }],
};
const roleNames = { commuter: 'Commuter', admin: 'Admin', driver: 'Driver' };
const roleHomes = { commuter: '/commuter/book', admin: '/admin', driver: '/driver' };
const pageTitles = { '/': 'Overview', '/admin': 'Overview', '/admin/bookings': 'Bookings', '/admin/drivers': 'Drivers', '/admin/routes': 'Routes', '/commuter/book': 'Book a ride', '/commuter/trips': 'My trips', '/driver': 'My day' };

/** Loading skeleton shown while the saved role is read. */
function ShellSkeleton() { return <div className="flex min-h-screen items-center justify-center p-6"><Skeleton className="h-40 w-full max-w-xl" /></div>; }

/** Friendly guard for role-specific areas. */
function RoleGuard({ expectedRole, children }) {
  const router = useRouter();
  const { role, isLoaded, selectRole } = useRole();
  useEffect(() => { if (isLoaded && !role) router.replace('/'); }, [isLoaded, role, router]);
  if (!isLoaded || !role) return <ShellSkeleton />;
  if (role !== expectedRole) return <main className="flex min-h-screen items-center justify-center p-6"><Card className="w-full max-w-md"><EmptyState title={`This page is for ${roleNames[expectedRole].toLowerCase()}s`} message={`You are currently using CampusRide as a ${roleNames[role].toLowerCase()}. Switch roles to continue.`} /><div className="flex flex-wrap justify-center gap-2"><Button onClick={() => { selectRole(expectedRole); router.push(roleHomes[expectedRole]); }}>Switch role</Button><Button variant="secondary" onClick={() => router.push(roleHomes[role])}>Go to my home</Button></div></Card></main>;
  return children;
}

/** Shared desktop sidebar and mobile bottom navigation shell. */
export default function AppShell({ expectedRole, title, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { role, user, userOptions, selectRole, selectUser, logout } = useRole();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const links = navigation[expectedRole] || [];
  const pageTitle = pageTitles[pathname] || title;
  const changeRole = (event) => { const nextRole = event.target.value; selectRole(nextRole); router.push(roleHomes[nextRole]); };
  return <RoleGuard expectedRole={expectedRole}>
    <div className="workspace-shell min-h-screen text-[var(--foreground)] md:flex">
      <aside className={`${isCollapsed ? 'md:w-20' : 'md:w-72'} workspace-sidebar hidden shrink-0 border-r border-[var(--card-border)] p-5 transition-all md:flex md:flex-col`}><Link href={roleHomes[role]} className="mb-10 flex items-center gap-3 px-2" aria-label="CampusRide home"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--icon-border)] bg-[var(--icon-bg)] text-[var(--icon-color)] shadow-[0_0_24px_var(--accent-blue-glow)]"><Bus className="h-4 w-4" /></span>{!isCollapsed && <span><span className="block font-semibold tracking-tight text-[var(--foreground-heading)]">CampusRide</span><span className="block text-[10px] uppercase tracking-[0.18em] text-[var(--foreground-muted)]">Shuttle operations</span></span>}</Link><nav className="space-y-1.5" aria-label="Main navigation">{links.map(({ label, href, icon: Icon }) => <Link key={href} href={href} title={isCollapsed ? label : undefined} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-all ${pathname === href ? 'bg-[var(--icon-bg)] font-semibold text-[var(--accent-blue)] shadow-[inset_3px_0_0_var(--accent-blue)]' : 'text-[var(--foreground-muted)] hover:bg-[var(--ghost-hover-bg)] hover:text-[var(--foreground-heading)]'}`}><Icon className="h-4 w-4 shrink-0" />{!isCollapsed && label}</Link>)}</nav><div className="mt-auto space-y-2"><button type="button" onClick={() => setIsCollapsed(!isCollapsed)} className="flex w-full items-center justify-center rounded-xl p-2 text-[var(--foreground-muted)] hover:bg-[var(--ghost-hover-bg)]" aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>{isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}</button><button type="button" onClick={() => { logout(); router.push('/'); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[var(--foreground-muted)] hover:bg-[var(--ghost-hover-bg)] hover:text-[var(--foreground-heading)]"><LogOut className="h-4 w-4 shrink-0" />{!isCollapsed && 'Leave workspace'}</button></div></aside>
      <div className="workspace-content min-w-0 flex-1 pb-20 md:pb-0"><header className="workspace-header sticky top-0 z-30 flex h-[4.5rem] items-center justify-between border-b border-[var(--card-border)] bg-[var(--header-bg)] px-4 backdrop-blur-xl sm:px-8"><div className="flex items-center gap-3"><Menu className="h-5 w-5 text-[var(--foreground-muted)] md:hidden" /><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--accent-blue)]">{roleNames[role]} workspace</p><h1 className="text-base font-semibold tracking-tight text-[var(--foreground-heading)]">{pageTitle}</h1></div></div><div className="flex items-center gap-2 sm:gap-3"><ThemeToggle /><select value={role} onChange={changeRole} aria-label="Switch role" className="h-9 max-w-24 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-1.5 text-[10px] text-[var(--foreground-heading)] transition-colors hover:border-[var(--input-border-hover)] sm:max-w-none sm:px-2 sm:text-xs">{Object.values(ROLES).map((option) => <option key={option} value={option}>{roleNames[option]}</option>)}</select>{userOptions.length > 1 && <select value={user?.id || ''} onChange={(event) => selectUser(event.target.value)} aria-label={`Select ${roleNames[role].toLowerCase()}`} className="hidden h-9 max-w-32 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-1.5 text-xs text-[var(--foreground-heading)] transition-colors hover:border-[var(--input-border-hover)] sm:block">{userOptions.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select>}<div className="flex items-center gap-2 border-l border-[var(--divider)] pl-2 sm:pl-3"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--icon-bg)] text-xs font-bold text-[var(--accent-blue)]">{user?.avatar}</span><span className="hidden text-sm font-medium text-[var(--foreground-heading)] lg:block">{user?.name}</span></div></div></header><main className="workspace-main mx-auto w-full max-w-[1440px] p-5 sm:p-8 lg:p-10">{children}</main></div>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid border-t border-[var(--card-border)] bg-[var(--header-bg)] p-2 backdrop-blur-md md:hidden" style={{ gridTemplateColumns: `repeat(${Math.min(links.length, 4)}, minmax(0, 1fr))` }} aria-label="Mobile navigation">{links.map(({ label, href, icon: Icon }) => <Link key={href} href={href} className={`flex flex-col items-center gap-1 rounded-lg p-2 text-[10px] ${pathname === href ? 'text-[var(--accent-blue)]' : 'text-[var(--foreground-muted)]'}`}><Icon className="h-4 w-4" />{label}</Link>)}</nav>
    </div>
  </RoleGuard>;
}