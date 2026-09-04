"use client";

import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  LoaderCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { SalonService } from "@/lib/salon";

type BookingFlowProps = {
  initialServices: SalonService[];
  bookingEnabled: boolean;
  whatsappConfirmationsEnabled: boolean;
  whatsappRemindersEnabled: boolean;
};
type Result = {
  reference: string;
  appointment: { service: string; date: string; time: string };
};

const STEP_LABELS = ["Service", "Date & time", "Your details"];

function localDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateChoices() {
  return Array.from({ length: 21 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    return date;
  });
}

export function BookingFlow({
  initialServices,
  bookingEnabled,
  whatsappConfirmationsEnabled,
  whatsappRemindersEnabled,
}: BookingFlowProps) {
  const [services, setServices] = useState(initialServices);
  const [step, setStep] = useState(0);
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const choices = useMemo(() => dateChoices(), []);
  const selectedService = services.find((service) => service.id === serviceId);
  const whatsappEnabled =
    whatsappConfirmationsEnabled || whatsappRemindersEnabled;
  const whatsappConsentText = whatsappConfirmationsEnabled
    ? whatsappRemindersEnabled
      ? "Send my booking confirmation and friendly reminder by WhatsApp."
      : "Send my booking confirmation by WhatsApp."
    : "Send me a friendly appointment reminder by WhatsApp.";

  useEffect(() => {
    if (!bookingEnabled) return;
    fetch("/api/services")
      .then((response) => response.json())
      .then((data: { services?: SalonService[] }) => {
        if (data.services?.length) setServices(data.services);
      })
      .catch(() => undefined);
  }, [bookingEnabled]);

  useEffect(() => {
    if (!bookingEnabled || !date || !serviceId) return;
    fetch(
      `/api/availability?date=${encodeURIComponent(date)}&service=${encodeURIComponent(serviceId)}`,
    )
      .then(async (response) => {
        const data = (await response.json()) as { slots?: string[]; error?: string };
        if (!response.ok) throw new Error(data.error || "Unable to load times.");
        setSlots(data.slots ?? []);
      })
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setLoadingSlots(false));
  }, [bookingEnabled, date, serviceId]);

  if (!bookingEnabled) {
    return (
      <section className="booking-card booking-coming-soon">
        <p className="eyebrow">Online booking</p>
        <h2>Appointments are opening soon.</h2>
        <p>
          We’re putting the finishing touches to the Peaches Hair diary. Please
          check back shortly to choose your appointment.
        </p>
        <a className="secondary-button" href="#contact">
          Contact Peaches Hair
        </a>
      </section>
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceId,
        date,
        time,
        name: form.get("name"),
        email: form.get("email"),
        phone: form.get("phone"),
        notes: form.get("notes"),
        whatsappConsent: form.get("whatsappConsent") === "on",
        company: form.get("company"),
      }),
    });
    const data = (await response.json()) as Result & { error?: string };
    setSubmitting(false);
    if (!response.ok) {
      setError(data.error || "We couldn’t complete the booking.");
      if (response.status === 409) setStep(1);
      return;
    }
    setResult(data);
  }

  if (result) {
    return (
      <section className="booking-card booking-success" aria-live="polite">
        <span className="success-icon"><Check aria-hidden="true" /></span>
        <p className="eyebrow">You’re booked</p>
        <h2>We’ll see you soon.</h2>
        <p>
          Your {result.appointment.service} is booked for{" "}
          <strong>
            {new Date(`${result.appointment.date}T12:00:00`).toLocaleDateString(
              "en-GB",
              { weekday: "long", day: "numeric", month: "long" },
            )}{" "}
            at {result.appointment.time}
          </strong>
          .
        </p>
        <div className="reference">Booking reference <b>{result.reference}</b></div>
        <p className="small-copy">
          We’ve sent confirmation to your email.
          {whatsappEnabled && " If you opted in, your selected WhatsApp messages will follow too."}
        </p>
        <button
          className="secondary-button"
          type="button"
          onClick={() => {
            setResult(null);
            setStep(0);
            setServiceId("");
            setDate("");
            setTime("");
          }}
        >
          Make another booking
        </button>
      </section>
    );
  }

  return (
    <section className="booking-card" aria-label="Book an appointment">
      <div className="booking-topline">
        <div>
          <p className="eyebrow">Book online</p>
          <h2>Find your appointment</h2>
        </div>
        <span className="booking-badge"><ShieldCheck /> Secure booking</span>
      </div>
      <ol className="booking-steps" aria-label="Booking progress">
        {STEP_LABELS.map((label, index) => (
          <li className={index <= step ? "active" : ""} key={label}>
            <span>{index < step ? <Check /> : index + 1}</span>
            <small>{label}</small>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <div className="booking-panel">
          <h3>What would you like to book?</h3>
          <div className="booking-services">
            {services.map((service) => (
              <button
                type="button"
                key={service.id}
                className={serviceId === service.id ? "selected" : ""}
                onClick={() => {
                  setServiceId(service.id);
                  setDate("");
                  setTime("");
                  setSlots([]);
                  setError("");
                }}
              >
                <span>
                  <strong>{service.name}</strong>
                  <small>{service.durationMinutes} minutes</small>
                </span>
                {serviceId === service.id ? <Check /> : <ArrowRight />}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="primary-button"
            disabled={!serviceId}
            onClick={() => setStep(1)}
          >
            Choose a date <ArrowRight />
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="booking-panel">
          <button className="back-button" type="button" onClick={() => setStep(0)}>
            <ArrowLeft /> Change service
          </button>
          <h3>{selectedService?.name}</h3>
          <p className="panel-help">Choose a date, then select an available time.</p>
          <div className="date-strip">
            {choices.map((choice) => {
              const value = localDateString(choice);
              return (
                <button
                  type="button"
                  key={value}
                  className={date === value ? "selected" : ""}
                  onClick={() => {
                    setDate(value);
                    setTime("");
                    setSlots([]);
                    setError("");
                    setLoadingSlots(true);
                  }}
                >
                  <small>{choice.toLocaleDateString("en-GB", { weekday: "short" })}</small>
                  <strong>{choice.getDate()}</strong>
                  <span>{choice.toLocaleDateString("en-GB", { month: "short" })}</span>
                </button>
              );
            })}
          </div>
          <div className="time-grid" aria-live="polite">
            {loadingSlots && (
              <p className="loading-state"><LoaderCircle className="spin" /> Checking the diary…</p>
            )}
            {!loadingSlots && date && slots.length === 0 && (
              <p className="empty-state">No times are available on this date. Try another day.</p>
            )}
            {!loadingSlots &&
              slots.map((slot) => (
                <button
                  type="button"
                  key={slot}
                  className={time === slot ? "selected" : ""}
                  onClick={() => setTime(slot)}
                >
                  <Clock3 /> {slot}
                </button>
              ))}
          </div>
          <button
            type="button"
            className="primary-button"
            disabled={!time}
            onClick={() => setStep(2)}
          >
            Add your details <ArrowRight />
          </button>
        </div>
      )}

      {step === 2 && (
        <form className="booking-panel booking-form" onSubmit={submit}>
          <button className="back-button" type="button" onClick={() => setStep(1)}>
            <ArrowLeft /> Change time
          </button>
          <div className="booking-summary">
            <CalendarDays />
            <span>
              <strong>{selectedService?.name}</strong>
              <small>{date} at {time}</small>
            </span>
          </div>
          <label>
            Your name
            <input name="name" autoComplete="name" required minLength={2} />
          </label>
          <div className="form-row">
            <label>
              Email
              <input name="email" type="email" autoComplete="email" required />
            </label>
            <label>
              Mobile number
              <input name="phone" type="tel" autoComplete="tel" required />
            </label>
          </div>
          <label>
            Anything we should know? <small>Optional</small>
            <textarea
              name="notes"
              rows={3}
              placeholder="Tell us about your current colour, hair length or anything that will help."
            />
          </label>
          <input className="honeypot" name="company" tabIndex={-1} autoComplete="off" />
          {whatsappEnabled && (
            <label className="check-label">
              <input name="whatsappConsent" type="checkbox" />
              <span>{whatsappConsentText}</span>
            </label>
          )}
          {error && <p className="form-error">{error}</p>}
          <button className="primary-button" type="submit" disabled={submitting}>
            {submitting ? <><LoaderCircle className="spin" /> Booking…</> : <><Sparkles /> Confirm appointment</>}
          </button>
          <p className="privacy-copy">
            Your details are used only to manage this appointment and salon communications.
          </p>
        </form>
      )}
      {error && step !== 2 && <p className="form-error">{error}</p>}
    </section>
  );
}
