import { ShieldCheck, FileSearch, Handshake, Radio, Eye, MessageCircle, AlertTriangle, FileCheck2, Lock } from 'lucide-react'
import { getDictionary } from '@/lib/i18n/server'

/**
 * "Comment ça marche ?" — section qui explique en 3 étapes
 * 1) le pipeline des annonces vérifiées BOGBE'S
 * 2) le pipeline des offres flash WhatsApp
 * 3) le process anti-arnaque (différenciateur clé sur le marché ivoirien)
 */
export async function HowItWorks() {
  const t = await getDictionary()

  return (
    <section className="relative py-16 md:py-24 bg-[var(--surface)] border-t border-[var(--border)]">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="max-w-2xl mb-12 md:mb-16">
          <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-[var(--accent-luxury)] mb-4">
            {t.howItWorks.kicker}
          </p>
          <h2 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold text-[var(--text)] leading-[1.05] tracking-tight">
            {t.howItWorks.title1}{' '}
            <span className="italic font-light text-[var(--accent-luxury)]">{t.howItWorks.title2}</span>
          </h2>
          <p className="font-sans text-sm md:text-base text-[var(--text-muted)] mt-5 leading-relaxed max-w-xl">
            {t.howItWorks.subtitle}
          </p>
        </div>

        {/* Two pipelines side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-12 md:mb-16">
          <Pipeline
            badge={{ label: t.howItWorks.verifiedTag, icon: <ShieldCheck className="w-3 h-3" />, tint: 'success' }}
            title={t.howItWorks.verifiedTitle}
            subtitle={t.howItWorks.verifiedSubtitle}
            steps={[
              { icon: <FileSearch className="w-5 h-5" />, label: t.howItWorks.v1Label, desc: t.howItWorks.v1Desc },
              { icon: <ShieldCheck className="w-5 h-5" />, label: t.howItWorks.v2Label, desc: t.howItWorks.v2Desc },
              { icon: <Handshake className="w-5 h-5" />, label: t.howItWorks.v3Label, desc: t.howItWorks.v3Desc },
            ]}
          />

          <Pipeline
            badge={{ label: t.howItWorks.flashTag, icon: <Radio className="w-3 h-3" />, tint: 'warning' }}
            title={t.howItWorks.flashTitle}
            subtitle={t.howItWorks.flashSubtitle}
            steps={[
              { icon: <Radio className="w-5 h-5" />, label: t.howItWorks.f1Label, desc: t.howItWorks.f1Desc },
              { icon: <Eye className="w-5 h-5" />, label: t.howItWorks.f2Label, desc: t.howItWorks.f2Desc },
              { icon: <MessageCircle className="w-5 h-5" />, label: t.howItWorks.f3Label, desc: t.howItWorks.f3Desc },
            ]}
          />
        </div>

        {/* Anti-arnaque trust block */}
        <div className="rounded-3xl bg-[var(--surface-card)] border border-[var(--border)] p-6 md:p-8 lg:p-10">
          <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-start">
            <div className="md:max-w-xs">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--accent-luxury-muted)] border border-accent-luxury/30 text-[var(--accent-luxury)] text-[10px] font-bold uppercase tracking-wider mb-4">
                <AlertTriangle className="w-3 h-3" />
                {t.howItWorks.antiScamTag}
              </div>
              <h3 className="font-display text-2xl md:text-3xl font-bold text-[var(--text)] leading-tight mb-3">
                {t.howItWorks.antiScamTitle}
              </h3>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                {t.howItWorks.antiScamSubtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 flex-1">
              <TrustItem icon={<FileCheck2 className="w-5 h-5" />} title={t.howItWorks.t1Title} desc={t.howItWorks.t1Desc} />
              <TrustItem icon={<ShieldCheck className="w-5 h-5" />} title={t.howItWorks.t2Title} desc={t.howItWorks.t2Desc} />
              <TrustItem icon={<Lock className="w-5 h-5" />} title={t.howItWorks.t3Title} desc={t.howItWorks.t3Desc} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

interface PipelineProps {
  badge: { label: string; icon: React.ReactNode; tint: 'success' | 'warning' }
  title: string
  subtitle: string
  steps: { icon: React.ReactNode; label: string; desc: string }[]
}

function Pipeline({ badge, title, subtitle, steps }: PipelineProps) {
  const tintClasses =
    badge.tint === 'success'
      ? 'bg-[var(--success-soft)] text-[var(--success)] border-success/20'
      : 'bg-[var(--warning-soft)] text-[var(--warning)] border-[var(--warning-soft)]'

  return (
    <div className="rounded-3xl bg-[var(--surface-card)] border border-[var(--border)] p-6 md:p-8">
      <div className="mb-6">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${tintClasses}`}>
          {badge.icon}
          {badge.label}
        </span>
        <h3 className="font-display text-xl md:text-2xl font-bold text-[var(--text)] mt-3 leading-tight">
          {title}
        </h3>
        <p className="text-sm text-[var(--text-muted)] mt-1.5">{subtitle}</p>
      </div>

      <ol className="space-y-4 md:space-y-5">
        {steps.map((s, i) => (
          <li key={i} className="flex items-start gap-4">
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full bg-[var(--surface-hover)] border border-[var(--border)] flex items-center justify-center text-[var(--accent-luxury)]">
                {s.icon}
              </div>
              {i < steps.length - 1 && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full w-px h-5 bg-[var(--border)]" />
              )}
            </div>
            <div className="flex-1 pt-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-[10px] text-[var(--text-muted)]">
                  0{i + 1}
                </span>
                <h4 className="text-sm font-bold text-[var(--text)]">{s.label}</h4>
              </div>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">{s.desc}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

function TrustItem({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div>
      <div className="w-10 h-10 rounded-full bg-[var(--accent-luxury-muted)] border border-accent-luxury/20 flex items-center justify-center text-[var(--accent-luxury)] mb-3">
        {icon}
      </div>
      <h4 className="text-sm font-bold text-[var(--text)] mb-1.5">{title}</h4>
      <p className="text-xs text-[var(--text-muted)] leading-relaxed">{desc}</p>
    </div>
  )
}
