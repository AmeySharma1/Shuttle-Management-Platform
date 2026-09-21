import AppShell from '@/components/layout/AppShell';
import { ROLES } from '@/lib/constants';

/** Layout for admin pages. */
export default function AdminLayout({ children }) { return <AppShell expectedRole={ROLES.ADMIN} title="Admin overview">{children}</AppShell>; }
