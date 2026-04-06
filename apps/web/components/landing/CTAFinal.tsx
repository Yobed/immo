import Link from 'next/link'

export function CTAFinal() {
  return (
    <section className="py-24 bg-secondary/5">
      <div className="container mx-auto px-4 text-center">
        <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-primary mb-6">
          Prêt à trouver votre bien ?
        </h2>
        <p className="font-sans text-muted text-lg max-w-xl mx-auto mb-10">
          Rejoignez des milliers d&apos;ivoiriens qui font confiance à Immo CI pour leurs projets immobiliers. C&apos;est gratuit pour commencer.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/biens"
            className="inline-flex items-center justify-center gap-2 font-sans font-medium transition-colors rounded-btn bg-primary text-white hover:bg-primary/90 px-8 py-4 text-base"
          >
            Chercher un bien
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 font-sans font-medium transition-colors rounded-btn border border-primary text-primary hover:bg-primary/10 px-8 py-4 text-base"
          >
            Publier un bien
          </Link>
        </div>
      </div>
    </section>
  )
}
