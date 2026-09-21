import AppShell from '@/components/layout/AppShell';
import { ROLES } from '@/lib/constants';

/** Layout for commuter pages. */
export default function CommuterLayout({ children }) { return <AppShell expectedRole={ROLES.COMMUTER} title="Commuter home">{children}</AppShell>; }
