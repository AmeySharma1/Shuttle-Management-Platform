import AppShell from '@/components/layout/AppShell';
import { ROLES } from '@/lib/constants';

/** Layout for driver pages. */
export default function DriverLayout({ children }) { return <AppShell expectedRole={ROLES.DRIVER} title="Driver home">{children}</AppShell>; }
