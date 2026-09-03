"use client";

import { useEffect, useState } from "react";

type GalleryImage = {
  id: string;
  altText: string;
  caption: string;
  url: string;
};

export function GallerySection() {
  const [images, setImages] = useState<GalleryImage[]>([]);

  useEffect(() => {
    fetch("/api/gallery")
      .then((response) => response.json())
      .then((data: { images?: GalleryImage[] }) => setImages(data.images ?? []))
      .catch(() => undefined);
  }, []);

  if (!images.length) return null;

  return (
    <section id="gallery" className="section-shell gallery-section">
      <div className="section-heading">
        <p className="eyebrow">Recent colour work</p>
        <h2>Made for you, never copied.</h2>
      </div>
      <div className="gallery-grid">
        {images.map((image) => (
          <figure key={image.id}>
            <img src={image.url} alt={image.altText} loading="lazy" />
            {image.caption && <figcaption>{image.caption}</figcaption>}
          </figure>
        ))}
      </div>
    </section>
  );
}
