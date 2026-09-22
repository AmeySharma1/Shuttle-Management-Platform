'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { ArrowDown, ArrowUp, MapPinned, Pencil, Plus, UserRound } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import Field from '@/components/ui/Field';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import Skeleton, { CardSkeleton } from '@/components/ui/Skeleton';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAsyncData } from '@/hooks';
import { createRoute, assignDriver, getRoutes, getStops, updateRoute } from '@/services/routeService';
import { getDrivers } from '@/services/driverService';

/** Admin route management page. */
export default function RoutesPage() {
  const { data: routes, loading: routesLoading, error: routesError, reload: reloadRoutes } = useAsyncData(() => getRoutes(), []);
  const { data: stops, loading: stopsLoading, error: stopsError } = useAsyncData(() => getStops(), []);
  const { data: drivers, loading: driversLoading, error: driversError } = useAsyncData(() => getDrivers(), []);
  const [editingRoute, setEditingRoute] = useState(null);
  const [assigningRoute, setAssigningRoute] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const loading = routesLoading || stopsLoading || driversLoading;
  const error = routesError || stopsError || driversError;
  const refreshRoutes = () => reloadRoutes().catch(() => {});
  const saveRoute = async (values) => {
    setIsSaving(true);
    try {
      if (editingRoute) { await updateRoute(editingRoute.id, values); toast.success('Route updated successfully.'); } else { await createRoute(values); toast.success('Route created successfully.'); }
      setEditingRoute(null); await refreshRoutes();
    } catch (serviceError) { toast.error(serviceError.message || 'The route could not be saved.'); } finally { setIsSaving(false); }
  };
  const saveDriver = async (driverId) => {
    setIsSaving(true);
    try { await assignDriver(assigningRoute.id, driverId || null); toast.success('Driver assignment updated.'); setAssigningRoute(null); await refreshRoutes(); } catch (serviceError) { toast.error(serviceError.message || 'The driver could not be assigned.'); } finally { setIsSaving(false); }
  };
  const toggleRoute = async (route) => {
    setIsSaving(true);
    try { await updateRoute(route.id, { active: !route.active }); toast.success(route.active ? 'Route deactivated.' : 'Route activated.'); await refreshRoutes(); } catch (serviceError) { toast.error(serviceError.message || 'The route status could not be changed.'); } finally { setIsSaving(false); }
  };

  if (loading) return <section className="space-y-5"><Skeleton className="h-10 w-48" variant="text" /><div className="grid gap-4 md:grid-cols-2"><CardSkeleton /><CardSkeleton /></div></section>;
  if (error) return <Card><EmptyState icon={MapPinned} title="Routes are unavailable" message="We could not load routes right now." action={<Button onClick={refreshRoutes}>Retry</Button>} /></Card>;

  return <section className="space-y-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm text-[var(--foreground-muted)]">Operations workspace</p><h2 className="mt-1 text-2xl font-bold text-[var(--foreground-heading)]">Routes</h2><p className="mt-2 text-sm text-[var(--foreground-muted)]">Manage stops, drivers and route availability.</p></div><Button icon={<Plus className="h-4 w-4" />} onClick={() => setEditingRoute({ name: '', stopIds: [], active: true })}>Add route</Button></div>{routes?.length ? <div className="grid gap-4 lg:grid-cols-2">{routes.map((route) => <RouteCard key={route.id} route={route} stops={stops || []} drivers={drivers || []} disabled={isSaving} onEdit={() => setEditingRoute(route)} onAssign={() => setAssigningRoute(route)} onToggle={() => toggleRoute(route)} />)}</div> : <Card><EmptyState icon={MapPinned} title="No routes yet" message="Add a route to start organizing shuttle stops." action={<Button onClick={() => setEditingRoute({ name: '', stopIds: [], active: true })}>Add route</Button>} /></Card>}
    <RouteModal key={editingRoute?.id || 'new-route'} route={editingRoute} stops={stops || []} loading={isSaving} onClose={() => !isSaving && setEditingRoute(null)} onSave={saveRoute} />
    <AssignDriverModal key={assigningRoute?.id || 'assign-driver'} route={assigningRoute} drivers={drivers || []} loading={isSaving} onClose={() => !isSaving && setAssigningRoute(null)} onSave={saveDriver} />
  </section>;
}
/** Route summary card. */
function RouteCard({ route, stops, drivers, disabled, onEdit, onAssign, onToggle }) { const driver = drivers.find((item) => item.id === route.driverId); return <Card className="flex flex-col gap-5"><div className="flex items-start justify-between gap-3"><div><h3 className="text-lg font-semibold text-[var(--foreground-heading)]">{route.name}</h3><p className="mt-1 text-xs text-[var(--foreground-muted)]">{route.id}</p></div><StatusBadge status={route.active ? 'Active' : 'Inactive'} /></div><div><p className="text-xs font-medium text-[var(--foreground-muted)]">Stops in order</p><p className="mt-1 text-sm font-medium text-[var(--foreground-heading)]">{route.stopIds.map((id) => stops.find((stop) => stop.id === id)?.name || id).join(' > ')}</p></div><div><p className="text-xs font-medium text-[var(--foreground-muted)]">Assigned driver</p><p className="mt-1 text-sm text-[var(--foreground-heading)]">{driver ? `${driver.name} · ${driver.vehicle.plate}` : 'No driver assigned'}</p></div><div className="flex flex-wrap gap-2 border-t border-[var(--divider)] pt-4"><Button size="sm" variant="secondary" icon={<Pencil className="h-3.5 w-3.5" />} onClick={onEdit}>Edit</Button><Button size="sm" variant="secondary" icon={<UserRound className="h-3.5 w-3.5" />} onClick={onAssign}>Assign driver</Button><Button size="sm" variant={route.active ? 'danger' : 'primary'} onClick={onToggle} disabled={disabled}>{route.active ? 'Set inactive' : 'Set active'}</Button></div></Card>; }
/** Add and edit route modal. */
function RouteModal({ route, stops, loading, onClose, onSave }) { const [name, setName] = useState(route?.name || ''); const [stopIds, setStopIds] = useState(route?.stopIds || []); const [selectedStop, setSelectedStop] = useState(''); const [errors, setErrors] = useState({}); const open = Boolean(route); if (!open) return null; const addStop = () => { if (!selectedStop) return; setStopIds([...stopIds, selectedStop]); setSelectedStop(''); setErrors({}); }; const removeStop = (index) => setStopIds(stopIds.filter((_, itemIndex) => itemIndex !== index)); const moveStop = (index, direction) => { const nextIndex = index + direction; if (nextIndex < 0 || nextIndex >= stopIds.length) return; const next = [...stopIds]; [next[index], next[nextIndex]] = [next[nextIndex], next[index]]; setStopIds(next); }; const save = () => { const nextErrors = {}; if (!name.trim()) nextErrors.name = 'Enter a route name.'; if (stopIds.length < 2) nextErrors.stops = 'Add at least 2 stops.'; if (new Set(stopIds).size !== stopIds.length) nextErrors.stops = 'A route cannot have duplicate stops.'; setErrors(nextErrors); if (!Object.keys(nextErrors).length) onSave({ name: name.trim(), stopIds }); }; return <Modal open={open} onClose={onClose} title={route.id ? 'Edit route' : 'Add route'}><div className="space-y-5"><Field label="Route name" required htmlFor="route-name" error={errors.name}><Input id="route-name" value={name} onChange={(event) => { setName(event.target.value); setErrors({}); }} placeholder="Main campus loop" /></Field><Field label="Add stops in order" error={errors.stops}><div className="flex gap-2"><Select value={selectedStop} onChange={(event) => setSelectedStop(event.target.value)}><option value="">Choose a stop</option>{stops.filter((stop) => !stopIds.includes(stop.id)).map((stop) => <option key={stop.id} value={stop.id}>{stop.name}</option>)}</Select><Button type="button" variant="secondary" onClick={addStop}>Add</Button></div></Field><div className="space-y-2">{stopIds.map((id, index) => <div key={`${id}-${index}`} className="flex items-center gap-2 rounded-lg border border-[var(--card-border)] bg-[var(--surface-nested)] p-2"><span className="flex-1 text-sm text-[var(--foreground-heading)]">{index + 1}. {stops.find((stop) => stop.id === id)?.name || id}</span><button type="button" onClick={() => moveStop(index, -1)} disabled={index === 0} className="rounded-md p-1 text-[var(--foreground-muted)] hover:bg-[var(--ghost-hover-bg)] disabled:opacity-30" aria-label="Move stop up"><ArrowUp className="h-4 w-4" /></button><button type="button" onClick={() => moveStop(index, 1)} disabled={index === stopIds.length - 1} className="rounded-md p-1 text-[var(--foreground-muted)] hover:bg-[var(--ghost-hover-bg)] disabled:opacity-30" aria-label="Move stop down"><ArrowDown className="h-4 w-4" /></button><button type="button" onClick={() => removeStop(index)} className="rounded-md px-2 py-1 text-xs text-[var(--danger-text)] hover:bg-[var(--danger-bg)]">Remove</button></div>)}</div><Button className="w-full" loading={loading} disabled={loading} onClick={save}>{route.id ? 'Save changes' : 'Add route'}</Button></div></Modal>; }
/** Driver assignment modal. */
function AssignDriverModal({ route, drivers, loading, onClose, onSave }) { const [driverId, setDriverId] = useState(route?.driverId || ''); if (!route) return null; return <Modal open={Boolean(route)} onClose={onClose} title={`Assign driver to ${route.name}`}><div className="space-y-4"><Field label="Driver"><Select value={driverId} onChange={(event) => setDriverId(event.target.value)}><option value="">No driver assigned</option>{drivers.map((driver) => <option key={driver.id} value={driver.id}>{driver.name} · {driver.vehicle.plate}</option>)}</Select></Field><Button className="w-full" loading={loading} disabled={loading} onClick={() => onSave(driverId)}>Save assignment</Button></div></Modal>; }