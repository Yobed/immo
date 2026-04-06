const partners = [
  { name: 'Wave', color: '#1E90FF', bg: '#EBF5FF' },
  { name: 'Orange Money', color: '#FF6600', bg: '#FFF3EB' },
  { name: 'MTN', color: '#FFCC00', bg: '#FFFCE0' },
  { name: 'Moov Money', color: '#0066CC', bg: '#EBF0FF' },
  { name: 'CinetPay', color: '#E10F28', bg: '#FFEBEE' },
  { name: 'Cloudinary', color: '#3448C5', bg: '#ECEEFF' },
]

export function Partners() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary mb-4">
            Nos partenaires
          </h2>
          <p className="font-sans text-muted text-lg max-w-xl mx-auto">
            Nous intégrons les solutions de paiement et services les plus utilisés en Côte d&apos;Ivoire.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 max-w-5xl mx-auto">
          {partners.map((partner) => (
            <div
              key={partner.name}
              className="flex items-center justify-center h-16 rounded-card border border-gray-100 hover:shadow-sm transition-shadow"
              style={{ backgroundColor: partner.bg }}
            >
              <span
                className="font-mono text-sm font-bold tracking-tight"
                style={{ color: partner.color }}
              >
                {partner.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
