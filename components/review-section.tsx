"use client";

import { Star } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

type Review = {
  id: string;
  customerName: string;
  rating: number;
  body: string;
};

export function ReviewSection() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/reviews")
      .then((response) => response.json())
      .then((data: { reviews?: Review[] }) => setReviews(data.reviews ?? []))
      .catch(() => undefined);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        rating,
        body: form.get("body"),
        company: form.get("company"),
      }),
    });
    const data = (await response.json()) as { message?: string; error?: string };
    setMessage(data.message ?? data.error ?? "Please try again.");
    if (response.ok) event.currentTarget.reset();
  }

  return (
    <section id="reviews" className="section-shell reviews-section">
      <div className="section-heading">
        <p className="eyebrow">Kind words</p>
        <h2>Good hair days, shared.</h2>
        <p>Reviews are published only after they’ve been checked by the salon.</p>
      </div>
      {reviews.length > 0 && (
        <div className="reviews-grid">
          {reviews.map((review) => (
            <blockquote key={review.id}>
              <div aria-label={`${review.rating} out of 5 stars`}>
                {Array.from({ length: 5 }, (_, index) => (
                  <Star key={index} className={index < review.rating ? "filled" : ""} />
                ))}
              </div>
              <p>“{review.body}”</p>
              <cite>{review.customerName}</cite>
            </blockquote>
          ))}
        </div>
      )}
      <details className="review-form-wrap">
        <summary>Leave a review</summary>
        <form onSubmit={submit}>
          <label>Your name<input name="name" required minLength={2} /></label>
          <fieldset>
            <legend>Your rating</legend>
            <div className="rating-picker">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  type="button"
                  key={value}
                  aria-label={`${value} stars`}
                  onClick={() => setRating(value)}
                >
                  <Star className={value <= rating ? "filled" : ""} />
                </button>
              ))}
            </div>
          </fieldset>
          <label>Your review<textarea name="body" required minLength={20} rows={4} /></label>
          <input className="honeypot" name="company" tabIndex={-1} autoComplete="off" />
          <button className="primary-button" type="submit">Send review</button>
          {message && <p aria-live="polite">{message}</p>}
        </form>
      </details>
    </section>
  );
}
