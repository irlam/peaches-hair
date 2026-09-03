"use client";

import { useEffect, useState } from "react";
import { formatPrice, type SalonService } from "@/lib/salon";

export function ServicesSection({
  initialServices,
}: {
  initialServices: SalonService[];
}) {
  const [services, setServices] = useState(initialServices);

  useEffect(() => {
    fetch("/api/services")
      .then((response) => response.json())
      .then((data: { services?: SalonService[] }) => {
        if (data.services?.length) setServices(data.services);
      })
      .catch(() => undefined);
  }, []);

  return (
    <section id="services" className="section-shell services-section">
      <div className="section-heading">
        <p className="eyebrow">Services</p>
        <h2>Colour with care and confidence.</h2>
        <p>
          Every colour service starts with listening. We’ll look at your hair
          history, lifestyle and goals before creating the right plan.
        </p>
      </div>
      <div className="service-grid">
        {services.map((service, index) => (
          <article className="service-card" key={service.id}>
            <span className="service-number">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div>
              <h3>{service.name}</h3>
              <p>{service.description}</p>
              <div className="service-meta">
                <span>{service.durationMinutes} mins</span>
                <span>{formatPrice(service.priceFromPence)}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
      <p className="pricing-note">
        Colour services are individually quoted following consultation and may
        require a skin test before your appointment.
      </p>
    </section>
  );
}
