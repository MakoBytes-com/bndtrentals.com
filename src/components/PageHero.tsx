import Image from "next/image";
import { Container } from "./Container";

export function PageHero({
  eyebrow,
  title,
  description,
  imageUrl,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  imageUrl?: string;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-canvas-deep text-white">
      {imageUrl && (
        <Image
          src={imageUrl}
          alt=""
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 -z-10 object-cover opacity-30"
          aria-hidden
        />
      )}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(120deg, rgba(11,18,32,0.96), rgba(11,18,32,0.85) 55%, rgba(15,58,138,0.55))",
        }}
        aria-hidden
      />
      <Container className="py-16 lg:py-24">
        <div className="max-w-3xl">
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h1 className="mt-3 text-[36px] sm:text-5xl lg:text-[56px] leading-[1.05] font-bold text-white">
            {title}
          </h1>
          {description && (
            <p className="mt-5 max-w-2xl text-lg text-white/75">{description}</p>
          )}
        </div>
      </Container>
    </section>
  );
}
