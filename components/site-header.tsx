"use client";

import Image from "next/image";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <a className="brand" href="#book" aria-label="Peaches Hair home">
        <Image
          src="/images/peaches-hair-logo.webp"
          width={230}
          height={130}
          priority
          alt="Peaches Hair"
        />
      </a>
      <button
        className="menu-button"
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X /> : <Menu />}
      </button>
      <nav className={open ? "nav-open" : ""} aria-label="Main navigation">
        <a href="#services" onClick={() => setOpen(false)}>Services</a>
        <a href="#salon" onClick={() => setOpen(false)}>The salon</a>
        <a href="#reviews" onClick={() => setOpen(false)}>Reviews</a>
        <a className="nav-book" href="#book" onClick={() => setOpen(false)}>
          Book appointment
        </a>
      </nav>
    </header>
  );
}
