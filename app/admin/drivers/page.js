'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, MoreVertical } from 'lucide-react';
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
import { DUTY_STATUS, TRIP_DURATION_MIN } from '@/lib/constants';
import { addBreak, endBreak, endDuty, getDriverTimeline, startBreak, startDuty } from '@/services/driverService';
import { getLocalDate, timeToMinutes } from '@/lib/utils';

const startHour = 6;
const endHour = 22;
const hours = Array.from({ length: endHour - startHour + 1 }, (_, index) => startHour + index);

/** Admin driver timeline page. */
export default function DriversPage() {
  const [date, setDate] = useState(getLocalDate());
  const [search, setSearch] = useState('');
  const [openMenu, setOpenMenu] = useState(null);
  const [breakDriver, setBreakDriver] = useState(null);
  const [breakStart, setBreakStart] = useState('');
  const [breakEnd, setBreakEnd] = useState('');
  const [breakError, setBreakError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const { data: drivers, loading, error, reload } = useAsyncData(() => getDriverTimeline(date), [date]);
  const visibleDrivers = (drivers || []).filter((driver) => driver.name.toLowerCase().includes(search.toLowerCase()));

  const changeDate = (offset) => { const next = new Date(`${date}T00:00:00`); next.setDate(next.getDate() + offset); setDate(toDateInput(next)); };
  const runDriverAction = async (action, message) => { setActionLoading(true); try { await action(); toast.success(message); await reload(); } catch (serviceError) { toast.error(serviceError.message || 'The driver action could not be completed.'); } finally { setActionLoading(false); setOpenMenu(null); } };
  const saveBreak = async () => {
    setBreakError('');
    if (!breakStart || !breakEnd) { setBreakError('Choose a start and end time.'); return; }
    if (timeToMinutes(breakEnd) <= timeToMinutes(breakStart)) { setBreakError('Break end time must be after the start time.'); return; }
    setActionLoading(true);
    try { await addBreak(breakDriver.id, breakStart, breakEnd); toast.success('Break added.'); setBreakDriver(null); await reload(); } catch (serviceError) { setBreakError(serviceError.message || 'The break could not be added.'); } finally { setActionLoading(false); }
  };
  if (loading) return <section className="space-y-4"><Skeleton className="h-10 w-56" variant="text" /><CardSkeleton /><CardSkeleton /></section>;
  if (error) return <Card><EmptyState title="Driver timeline is unavailable" message="We could not load the driver timeline right now." action={<Button onClick={() => reload().catch(() => {})}>Retry</Button>} /></Card>;

  return <section className="space-y-6"><div><p className="text-sm text-[var(--foreground-muted)]">Operations workspace</p><h2 className="mt-1 text-2xl font-bold text-[var(--foreground-heading)]">Driver timeline</h2><p className="mt-2 text-sm text-[var(--foreground-muted)]">See shifts, breaks and trips across the day.</p></div><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div className="flex items-center gap-2"><Button variant="secondary" size="sm" onClick={() => changeDate(-1)} aria-label="Previous day"><ChevronLeft className="h-4 w-4" /></Button><Field label="Date"><Input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></Field><Button variant="secondary" size="sm" onClick={() => changeDate(1)} aria-label="Next day"><ChevronRight className="h-4 w-4" /></Button></div><Field label="Search drivers" className="sm:w-72"><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by driver name" /></Field></div>{visibleDrivers.length === 0 ? <Card><EmptyState title="No drivers found" message="Try a different driver name." /></Card> : <div className="space-y-3"><TimelineHeader />{visibleDrivers.map((driver) => <DriverTimelineRow key={driver.id} driver={driver} date={date} openMenu={openMenu} setOpenMenu={setOpenMenu} actionLoading={actionLoading} onStart={() => runDriverAction(() => startDuty(driver.id), 'Duty started.')} onEnd={() => runDriverAction(() => endDuty(driver.id), 'Duty ended.')} onTakeBreak={() => runDriverAction(() => startBreak(driver.id), 'Break started.')} onEndBreak={() => runDriverAction(() => endBreak(driver.id), 'Break ended.')} onAddBreak={() => { setBreakError(''); setBreakStart(''); setBreakEnd(''); setBreakDriver(driver); }} />)}</div>}<Legend /><Modal open={Boolean(breakDriver)} onClose={() => !actionLoading && setBreakDriver(null)} title={`Add break for ${breakDriver?.name || ''}`}><div className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><Field label="Start time" required htmlFor="break-start"><Input id="break-start" type="time" value={breakStart} onChange={(event) => setBreakStart(event.target.value)} /></Field><Field label="End time" required htmlFor="break-end" error={breakError}><Input id="break-end" type="time" value={breakEnd} onChange={(event) => setBreakEnd(event.target.value)} /></Field></div><Button className="w-full" loading={actionLoading} disabled={actionLoading} onClick={saveBreak}>Add break</Button></div></Modal></section>;
}
 
/** One driver row with a horizontally scrollable day track. */
function TimelineHeader() { return <div className="overflow-x-auto"><div className="flex min-w-[720px] pl-56 pr-2"><div className="flex flex-1 justify-between text-[10px] text-[var(--foreground-muted)]">{hours.map((hour) => <span key={hour}>{formatHour(hour)}</span>)}</div></div></div>; }

/** One driver row with a horizontally scrollable day track. */
function DriverTimelineRow({ driver, date, openMenu, setOpenMenu, actionLoading, onStart, onEnd, onTakeBreak, onEndBreak, onAddBreak }) {
  const shift = driver.shift;
  const isToday = date === getLocalDate();
  return <Card className="overflow-visible"><div className="flex flex-col gap-4 lg:flex-row lg:items-center"><div className="flex min-w-56 items-center justify-between gap-3"><div><p className="font-semibold text-[var(--foreground-heading)]">{driver.name}</p><p className="text-xs text-[var(--foreground-muted)]">{driver.vehicle.plate}</p><div className="mt-2"><StatusBadge status={driver.shift?.status === DUTY_STATUS.ON_DUTY ? 'On duty' : driver.shift?.status === DUTY_STATUS.ON_BREAK ? 'On break' : 'Off duty'} /></div></div><div className="relative"><button type="button" onClick={() => setOpenMenu(openMenu === driver.id ? null : driver.id)} className="rounded-lg p-2 text-[var(--foreground-muted)] hover:bg-[var(--ghost-hover-bg)]" aria-label={`Actions for ${driver.name}`}><MoreVertical className="h-4 w-4" /></button>{openMenu === driver.id && <DriverMenu driver={driver} actionLoading={actionLoading} onStart={onStart} onEnd={onEnd} onTakeBreak={onTakeBreak} onEndBreak={onEndBreak} onAddBreak={onAddBreak} />}</div></div><div className="min-w-0 flex-1 overflow-x-auto pb-2"><div className="relative min-w-[720px]"><div className="relative h-16 rounded-lg border border-[var(--card-border)] bg-[var(--surface-nested)]">{shift && <TimelineBlock start={shift.start} end={shift.end} label="Shift" type="shift" />}{shift?.breaks?.map((item, index) => <TimelineBlock key={`break-${index}`} start={item.start} end={item.end} label="Break" type="break" />)}<div className="absolute inset-x-0 bottom-0 h-7 border-t border-[var(--divider)]">{driver.trips?.map((trip) => <TimelineBlock key={trip.id} start={trip.time} end={addMinutes(trip.time, TRIP_DURATION_MIN)} label={`${trip.id} · ${trip.riderName}`} type="trip" />)}</div>{isToday && <div className="absolute bottom-0 top-0 z-10 w-px bg-red-400" style={{ left: `${timePosition(currentTime())}%` }} title="Current time" />}</div></div></div></div></Card>;
}
/** Driver action menu. */
function DriverMenu({ driver, actionLoading, onStart, onEnd, onTakeBreak, onEndBreak, onAddBreak }) { const status = driver.shift?.status || DUTY_STATUS.OFF_DUTY; return <div className="absolute right-0 top-10 z-10 w-44 rounded-xl border border-[var(--card-border)] bg-[var(--surface-card)] p-1 shadow-xl"><MenuButton label="Start duty" disabled={status !== DUTY_STATUS.OFF_DUTY || actionLoading} reason="Driver is already on duty." onClick={onStart} loading={actionLoading} /><MenuButton label="End duty" disabled={status === DUTY_STATUS.OFF_DUTY || actionLoading} reason="Driver is off duty." onClick={onEnd} loading={actionLoading} /><MenuButton label="Add break" disabled={status === DUTY_STATUS.OFF_DUTY || actionLoading} reason="Driver must be on duty." onClick={onAddBreak} loading={actionLoading} />{status === DUTY_STATUS.ON_BREAK && <MenuButton label="End break" disabled={actionLoading} onClick={onEndBreak} loading={actionLoading} />}{status === DUTY_STATUS.ON_DUTY && <MenuButton label="Take break" disabled={actionLoading} onClick={onTakeBreak} loading={actionLoading} />}</div>; }
function MenuButton({ label, disabled, reason, onClick, loading }) { return <button type="button" disabled={disabled} title={disabled ? reason : label} onClick={onClick} className="block w-full rounded-lg px-3 py-2 text-left text-xs text-[var(--foreground-heading)] hover:bg-[var(--ghost-hover-bg)] disabled:cursor-not-allowed disabled:opacity-40">{loading ? 'Working...' : label}</button>; }
function TimelineBlock({ start, end, label, type }) { const width = timePosition(end) - timePosition(start); return <div className={`absolute overflow-hidden rounded-md px-2 py-1 text-[10px] font-medium text-white ${type === 'shift' ? 'bottom-9 top-2 bg-blue-500/70' : type === 'break' ? 'bottom-9 top-2 bg-amber-500/80' : 'bottom-1 top-1 bg-violet-500/80'}`} style={{ left: `${timePosition(start)}%`, width: `${Math.max(width, 1)}%` }} title={`${label}: ${start} to ${end}`}>{width >= 8 ? label : null}</div>; }
function Legend() { return <div className="flex flex-wrap gap-4 text-xs text-[var(--foreground-muted)]"><LegendItem color="bg-blue-500/70" label="Shift" /><LegendItem color="bg-amber-500/80" label="Break" /><LegendItem color="bg-violet-500/80" label="Trip" /><LegendItem color="bg-red-400" label="Now" /></div>; }
function LegendItem({ color, label }) { return <span className="inline-flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-sm ${color}`} />{label}</span>; }
function timePosition(time) { return Math.max(0, Math.min(100, ((timeToMinutes(time) - startHour * 60) / ((endHour - startHour) * 60)) * 100)); }
function addMinutes(time, minutes) { const total = timeToMinutes(time) + minutes; return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`; }
function currentTime() { const now = new Date(); return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`; }
function formatHour(hour) { return `${hour > 12 ? hour - 12 : hour}${hour >= 12 ? ' PM' : ' AM'}`; }
function toDateInput(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
