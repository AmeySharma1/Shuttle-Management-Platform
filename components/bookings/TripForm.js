'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Field from '@/components/ui/Field';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { getLocalDate, isTimeInPast } from '@/lib/utils';

const emptyValues = { fromStopId: '', toStopId: '', date: getLocalDate(), time: '', passengers: 1 };

/** Shared booking and edit form with commuter validation. */
export default function TripForm({ stops, initialValues = emptyValues, onSubmit, submitLabel = 'Book ride', loading = false, showPassengers = true }) {
  const [values, setValues] = useState({ ...emptyValues, ...initialValues });
  const [errors, setErrors] = useState({});

  const updateValue = (name, value) => {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!values.fromStopId) nextErrors.fromStopId = 'Choose a pickup stop.';
    if (!values.toStopId) nextErrors.toStopId = 'Choose a drop stop.';
    if (values.fromStopId && values.fromStopId === values.toStopId) nextErrors.toStopId = 'Pickup and drop stops must be different.';
    if (!values.date) nextErrors.date = 'Choose a date.';
    if (values.date && values.date < getLocalDate()) nextErrors.date = 'Choose today or a future date.';
    if (!values.time) nextErrors.time = 'Choose a time.';
    if (values.date && values.time && isTimeInPast(values.date, values.time)) nextErrors.time = "Choose a time that hasn't passed.";
    if (showPassengers && (!values.passengers || Number(values.passengers) < 1 || Number(values.passengers) > 4)) nextErrors.passengers = 'Passengers must be between 1 and 4.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (validate()) onSubmit({ ...values, passengers: Number(values.passengers) });
  };

  const swapStops = () => setValues((current) => ({ ...current, fromStopId: current.toStopId, toStopId: current.fromStopId }));

  return <form onSubmit={handleSubmit} className="space-y-4" noValidate>
    <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
      <Field label="Pickup stop" required htmlFor="pickup-stop" error={errors.fromStopId}>
        <Select id="pickup-stop" value={values.fromStopId} onChange={(event) => updateValue('fromStopId', event.target.value)}>
          <option value="">Choose pickup stop</option>
          {stops.map((stop) => <option key={stop.id} value={stop.id}>{stop.name}</option>)}
        </Select>
      </Field>
      <Button type="button" variant="secondary" size="sm" onClick={swapStops} disabled={!values.fromStopId && !values.toStopId}>Swap</Button>
      <Field label="Drop stop" required htmlFor="drop-stop" error={errors.toStopId}>
        <Select id="drop-stop" value={values.toStopId} onChange={(event) => updateValue('toStopId', event.target.value)}>
          <option value="">Choose drop stop</option>
          {stops.filter((stop) => stop.id !== values.fromStopId).map((stop) => <option key={stop.id} value={stop.id}>{stop.name}</option>)}
        </Select>
      </Field>
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Date" required htmlFor="trip-date" error={errors.date}><Input id="trip-date" type="date" min={getLocalDate()} value={values.date} onChange={(event) => updateValue('date', event.target.value)} /></Field>
      <Field label="Time" required htmlFor="trip-time" error={errors.time}><Input id="trip-time" type="time" value={values.time} onChange={(event) => updateValue('time', event.target.value)} /></Field>
    </div>
    {showPassengers && <Field label="Passengers" required htmlFor="trip-passengers" error={errors.passengers}><Input id="trip-passengers" type="number" min={1} max={4} value={values.passengers} onChange={(event) => updateValue('passengers', event.target.value)} /></Field>}
    <Button type="submit" loading={loading} disabled={loading} className="w-full">{submitLabel}</Button>
  </form>;
}