'use client'

export interface Alerte {
  id:        string
  type:      'urgent' | 'attention' | 'info'
  message:   string
  details?:  string
  lien?:     string
}

const TYPE_STYLES: Record<Alerte['type'], { badge: string; dot: string; label: string }> = {
  urgent:    { badge: 'bg-danger-light text-danger border-danger/20',    dot: 'bg-danger',   label: 'URGENT'    },
  attention: { badge: 'bg-warning/10 text-warning border-warning/20',    dot: 'bg-warning',  label: 'ATTENTION' },
  info:      { badge: 'bg-primary-light text-primary border-primary/20', dot: 'bg-primary',  label: 'INFO'      },
}

const TYPE_ORDER: Alerte['type'][] = ['urgent', 'attention', 'info']

export function AlertesSection({ alertes }: { alertes: Alerte[] }) {
  const sorted = [...alertes].sort(
    (a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type)
  )

  return (
    <div className="bg-surface-card rounded-card p-4 shadow-sm">
      <h3 className="text-sm font-medium text-text mb-3">
        Alertes
        {alertes.filter(a => a.type === 'urgent').length > 0 && (
          <span className="ml-2 bg-danger text-white text-xs px-2 py-0.5 rounded-pill">
            {alertes.filter(a => a.type === 'urgent').length}
          </span>
        )}
      </h3>

      {sorted.length === 0 ? (
        <p className="text-muted text-sm py-4 text-center">Aucune alerte</p>
      ) : (
        <ul className="space-y-2">
          {sorted.map(alerte => {
            const s = TYPE_STYLES[alerte.type]
            return (
              <li
                key={alerte.id}
                className={`flex items-start gap-3 p-3 rounded-btn border text-sm ${s.badge}`}
              >
                <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${s.dot}`} />
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-xs mr-2">{s.label}</span>
                  {alerte.message}
                  {alerte.details && (
                    <p className="text-xs opacity-75 mt-0.5 truncate">{alerte.details}</p>
                  )}
                </div>
                {alerte.lien && (
                  <a href={alerte.lien} className="text-xs underline flex-shrink-0">
                    Voir
                  </a>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
