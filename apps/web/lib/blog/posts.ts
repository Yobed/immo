/**
 * Articles du blog — contenu statique versionné dans le code (pas de CMS :
 * 4 articles évergreen, mis à jour à la main quand le marché bouge).
 *
 * Syntaxe inline dans les paragraphes : [texte](/url) devient un lien —
 * utilisé pour le maillage interne vers /location/*, /vente/* et /catalogue.
 */

export interface ArticleSection {
  h2?: string
  paragraphs?: string[]
  /** Liste à puces */
  list?: string[]
  /** Liste numérotée (étapes) */
  steps?: string[]
}

export interface BlogPost {
  slug: string
  titre: string
  description: string
  categorie: string
  datePublication: string
  minutesLecture: number
  sections: ArticleSection[]
  faq?: { question: string; reponse: string }[]
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'prix-loyers-abidjan',
    titre: 'Prix des loyers à Abidjan en 2026 : le guide commune par commune',
    description:
      'Combien coûte un studio à Cocody ? Un 3 pièces à Yopougon ? Fourchettes de loyers observées à Abidjan, commune par commune, et les facteurs qui font varier les prix.',
    categorie: 'Guide des prix',
    datePublication: '2026-07-05',
    minutesLecture: 6,
    sections: [
      {
        paragraphs: [
          "Le loyer est la première question de toute recherche de logement à Abidjan — et les écarts sont énormes d'une commune à l'autre, parfois du simple au quintuple pour une surface équivalente. Ce guide donne les fourchettes que nous observons sur les annonces publiées sur notre plateforme et sur le marché. Ce sont des ordres de grandeur indicatifs : le standing, l'étage, l'année de construction et la rue exacte peuvent faire sortir un bien de ces fourchettes.",
        ],
      },
      {
        h2: 'Cocody : la commune premium',
        paragraphs: [
          "Riviera, Angré, Deux Plateaux, Palmeraie : Cocody concentre la demande des cadres, des expatriés et des étudiants (université, grandes écoles). Comptez environ 100 000 à 250 000 FCFA pour un studio selon le quartier et le standing, 250 000 à 600 000 FCFA pour un 2-3 pièces correct, et de 800 000 FCFA à plusieurs millions pour une villa dans les quartiers résidentiels. Consultez les [biens à louer à Cocody](/location/cocody) pour voir les prix du moment.",
        ],
      },
      {
        h2: 'Marcory et Zone 4 : le choix des expatriés',
        paragraphs: [
          "La Zone 4 et Biétry offrent restaurants, commerces et proximité de l'aéroport. Les appartements meublés y sont nombreux : environ 300 000 à 700 000 FCFA pour un 2 pièces de standing, souvent charges comprises pour les meublés. Les [annonces à Marcory](/location/marcory) évoluent vite — la demande y est forte toute l'année.",
        ],
      },
      {
        h2: 'Yopougon, Abobo, Koumassi : les communes accessibles',
        paragraphs: [
          "C'est là que se loge la majorité des Abidjanais. À [Yopougon](/location/yopougon), un studio se trouve entre 40 000 et 90 000 FCFA, un 2-3 pièces entre 90 000 et 200 000 FCFA. À [Abobo](/location/abobo), les entrées de gamme descendent encore un peu, avec un marché en plein renouveau depuis l'arrivée du métro. [Koumassi](/location/koumassi) et [Treichville](/location/treichville) se situent entre les deux, avec l'avantage de la proximité du centre.",
        ],
      },
      {
        h2: 'Bingerville et la périphérie : le meilleur rapport qualité-prix',
        paragraphs: [
          "Les cités nouvelles de [Bingerville](/location/bingerville) et de [Songon](/location/songon) attirent les familles : logements récents, environnement calme, prix plus doux qu'à Cocody pour un confort équivalent. Comptez environ 60 000 à 120 000 FCFA pour un studio et 150 000 à 400 000 FCFA pour une maison en cité récente.",
        ],
      },
      {
        h2: 'Ce qui fait varier le loyer',
        list: [
          "Le standing : neuf ou ancien, carrelage, plafond, sécurité de la cour.",
          "Les compteurs : un compteur CIE/SODECI individuel évite les forfaits abusifs.",
          "L'accès : une rue bitumée et praticable en saison des pluies se paie.",
          "Le meublé : une résidence meublée se loue à la nuitée ou au mois, à des tarifs bien supérieurs au nu.",
          "L'avance demandée : à Abidjan, la pratique courante va de 2 à 4 mois d'avance plus caution — prévoyez ce budget dès le départ.",
        ],
      },
      {
        h2: 'Comparer avant de signer',
        paragraphs: [
          "Le meilleur réflexe reste de comparer plusieurs biens équivalents dans la même commune avant de vous engager. Notre [catalogue](/catalogue) regroupe les annonces vérifiées par notre équipe et les offres captées en temps réel — filtrez par commune et par budget pour voir immédiatement où se situe le marché.",
        ],
      },
    ],
    faq: [
      {
        question: 'Quel budget prévoir en plus du loyer pour emménager à Abidjan ?',
        reponse:
          "En pratique, prévoyez l'équivalent de 4 à 7 mois de loyer : 2 à 4 mois d'avance, 1 à 2 mois de caution, et d'éventuels frais d'intermédiaire. Exigez toujours une quittance pour chaque versement.",
      },
      {
        question: 'Quelle est la commune la moins chère pour se loger à Abidjan ?',
        reponse:
          "Abobo et Yopougon offrent les loyers les plus accessibles, avec des studios dès 30 000 à 50 000 FCFA. Attention toutefois à vérifier l'état du logement, l'accès à l'eau et la desserte du quartier.",
      },
      {
        question: 'Les prix affichés sont-ils négociables ?',
        reponse:
          "Souvent, oui — surtout si le bien est vacant depuis plusieurs semaines. La marge de négociation porte autant sur le loyer que sur le nombre de mois d'avance demandés.",
      },
    ],
  },
  {
    slug: 'arnaques-immobilieres-abidjan',
    titre: 'Arnaques immobilières à Abidjan : les 7 pièges et comment les éviter',
    description:
      "Faux démarcheurs, visites payantes, faux propriétaires, doubles ventes : les arnaques immobilières les plus courantes à Abidjan et les réflexes concrets pour ne jamais tomber dedans.",
    categorie: 'Conseils',
    datePublication: '2026-07-05',
    minutesLecture: 7,
    sections: [
      {
        paragraphs: [
          "L'immobilier est l'un des secteurs les plus touchés par l'arnaque à Abidjan. Chaque semaine, des chercheurs de logement perdent des dizaines voire des centaines de milliers de francs face à des escrocs bien organisés. Bonne nouvelle : presque toutes ces arnaques reposent sur les mêmes ressorts, et quelques réflexes simples suffisent à s'en protéger. Voici les 7 pièges les plus courants.",
        ],
      },
      {
        h2: '1. Les frais de visite à répétition',
        paragraphs: [
          "Le « démarcheur » vous fait payer 2 000 à 10 000 FCFA par visite… et vous promène de bien décevant en bien déjà pris, indéfiniment. C'est son vrai business : la visite, pas la location. Réflexe : refusez les frais de visite avant d'avoir vu des photos réelles et vérifiables du bien, et privilégiez les plateformes où la visite se réserve gratuitement en ligne.",
        ],
      },
      {
        h2: "2. Le bien qui n'existe pas",
        paragraphs: [
          "Photos volées sur internet, prix anormalement bas, propriétaire « en voyage » qui demande une avance par mobile money pour « réserver » : le bien n'a jamais existé. Réflexe : aucun versement, jamais, avant d'avoir visité physiquement le bien et signé un contrat. Un prix trop beau pour être vrai est un signal d'alarme, pas une aubaine.",
        ],
      },
      {
        h2: '3. Le faux propriétaire',
        paragraphs: [
          "L'escroc loue ou squatte un logement, le fait visiter, encaisse avance et caution… puis disparaît. Le vrai propriétaire découvre tout à votre emménagement. Réflexe : demandez la pièce d'identité du bailleur et un document prouvant son droit sur le bien (titre, quittances CIE/SODECI à son nom, mandat écrit s'il passe par un gérant). Croisez les noms.",
        ],
      },
      {
        h2: '4. La double location (ou double vente)',
        paragraphs: [
          "Le même bien est « loué » ou « vendu » à plusieurs personnes le même week-end. Le premier arrivé s'installe, les autres perdent leur argent. Réflexe : exigez un contrat écrit daté et une quittance nominative au moment exact du paiement, et emménagez sans tarder après la signature.",
        ],
      },
      {
        h2: "5. Le terrain sans papiers ou en litige",
        paragraphs: [
          "En zone périurbaine, des terrains sont vendus avec une simple « attestation villageoise » — qui n'est pas un titre de propriété — parfois sur des parcelles en litige familial ou déjà vendues. Réflexe : seul l'ACD (Arrêté de Concession Définitive) fait foi, et la vente doit passer par un notaire. Nous détaillons tout dans notre [guide de l'achat de terrain](/blog/acheter-terrain-cote-ivoire).",
        ],
      },
      {
        h2: "6. L'avance par mobile money avant contrat",
        paragraphs: [
          "Variante moderne du piège n°2 : la pression pour « bloquer le bien » par un transfert Wave ou Orange Money avant toute signature. Une fois l'argent envoyé, le numéro ne répond plus. Réflexe : le mobile money est parfait pour payer un loyer contractualisé avec quittance — jamais pour « réserver » un bien sans contrat.",
        ],
      },
      {
        h2: '7. Le contrat verbal',
        paragraphs: [
          "« On se fait confiance » : sans écrit, impossible de prouver le montant de l'avance versée, la durée convenue ou l'état du logement à l'entrée. Réflexe : contrat écrit systématique (durée, loyer, avance, caution, préavis) et état des lieux signé, même sommaire, avec photos datées.",
        ],
      },
      {
        h2: 'Le réflexe qui résume tout',
        paragraphs: [
          "Ne payez jamais avant d'avoir : vu le bien, vérifié l'identité et les droits du bailleur, et signé un contrat contre quittance. C'est exactement pour éliminer ces risques que chaque annonce publiée sur BOGBE'S est vérifiée par notre équipe avant mise en ligne — parcourez le [catalogue vérifié](/catalogue) ou décrivez-nous votre recherche sur WhatsApp.",
        ],
      },
    ],
    faq: [
      {
        question: "Comment vérifier qu'un bailleur est le vrai propriétaire ?",
        reponse:
          "Demandez sa pièce d'identité et un justificatif de son droit sur le bien : titre de propriété, quittances d'électricité ou d'eau à son nom, ou mandat de gestion écrit s'il agit pour le compte du propriétaire. Les noms doivent correspondre.",
      },
      {
        question: "J'ai été victime d'une arnaque immobilière, que faire ?",
        reponse:
          "Rassemblez toutes les preuves (messages, reçus de transfert, captures d'écran, contrat éventuel) et déposez plainte au commissariat ou à la brigade de gendarmerie du lieu des faits. Signalez aussi le numéro de téléphone utilisé à votre opérateur mobile money.",
      },
    ],
  },
  {
    slug: 'louer-appartement-abidjan',
    titre: "Louer un appartement à Abidjan : le guide complet (budget, documents, étapes)",
    description:
      "De la définition du budget à l'état des lieux : les 7 étapes pour louer un appartement à Abidjan sereinement, avec la checklist de visite et les documents à préparer.",
    categorie: 'Guide pratique',
    datePublication: '2026-07-05',
    minutesLecture: 6,
    sections: [
      {
        paragraphs: [
          "Louer à Abidjan peut aller très vite quand on est préparé — et devenir un parcours du combattant quand on ne l'est pas. Voici la méthode complète, étape par étape, pour trouver et sécuriser votre logement.",
        ],
      },
      {
        h2: '1. Définissez le vrai budget (pas seulement le loyer)',
        paragraphs: [
          "La pratique abidjanaise exige au départ bien plus qu'un mois de loyer : 2 à 4 mois d'avance, 1 à 2 mois de caution, et parfois un mois de frais d'intermédiaire. Pour un loyer de 150 000 FCFA, prévoyez donc 600 000 à 1 000 000 FCFA de budget d'installation. Règle de prudence : un loyer ne devrait pas dépasser un tiers de vos revenus mensuels.",
        ],
      },
      {
        h2: '2. Choisissez la commune selon votre vie quotidienne',
        paragraphs: [
          "Le bon logement est d'abord celui qui simplifie vos trajets. Travail au Plateau ? Regardez [Cocody](/location/cocody), [Adjamé](/location/adjame) ou [Attécoubé](/location/attecoube). Budget serré ? [Yopougon](/location/yopougon) et [Abobo](/location/abobo) offrent le plus de choix. Envie de neuf et de calme ? Direction [Bingerville](/location/bingerville). Notre [guide des loyers commune par commune](/blog/prix-loyers-abidjan) vous donne les fourchettes de prix.",
        ],
      },
      {
        h2: '3. La visite : la checklist qui évite les mauvaises surprises',
        list: [
          "Eau : ouvrez les robinets, vérifiez la pression et demandez si l'eau coule toute la journée.",
          "Électricité : compteur CIE individuel ou forfait imposé par le bailleur ? Le forfait est souvent un piège.",
          "Humidité : traces sur les murs et plafonds = infiltrations en saison des pluies.",
          "Accès : la rue est-elle praticable quand il pleut ? Visitez si possible après une pluie.",
          "Sécurité : éclairage, clôture, voisinage — repassez le soir avant de vous décider.",
          "Réseau : testez votre téléphone dans chaque pièce, certains rez-de-chaussée captent mal.",
        ],
      },
      {
        h2: '4. Vérifiez le bailleur avant de négocier',
        paragraphs: [
          "Pièce d'identité, justificatif de propriété ou mandat de gestion : cette vérification prend cinq minutes et élimine l'essentiel des [arnaques courantes](/blog/arnaques-immobilieres-abidjan). Un bailleur légitime ne s'en offusque jamais.",
        ],
      },
      {
        h2: '5. Négociez le loyer ET les conditions',
        paragraphs: [
          "Tout se discute : le montant du loyer, mais aussi le nombre de mois d'avance, la prise en charge de petites réparations avant l'entrée, ou la date de début du bail. Un bien vacant depuis plusieurs semaines donne une vraie marge de négociation.",
        ],
      },
      {
        h2: '6. Le contrat écrit : non négociable',
        paragraphs: [
          "Le contrat doit préciser : identité des parties, adresse du bien, loyer et date de paiement, montant de l'avance et de la caution, durée, conditions de préavis. Chaque versement donne lieu à une quittance signée — c'est votre seule preuve de paiement.",
        ],
      },
      {
        h2: "7. L'état des lieux d'entrée",
        paragraphs: [
          "Faites le tour du logement avec le bailleur, notez l'état de chaque pièce et prenez des photos datées. Ce document signé conditionne la restitution de votre caution à la sortie. Sans lui, toute dégradation antérieure pourra vous être imputée.",
          "Prêt à chercher ? Parcourez les [appartements à louer sur notre catalogue](/catalogue?type_offre=location) — chaque annonce vérifiée se visite sur réservation en ligne, gratuitement.",
        ],
      },
    ],
    faq: [
      {
        question: 'Quels documents demande-t-on à un locataire à Abidjan ?',
        reponse:
          "Le plus souvent : une pièce d'identité, et selon les bailleurs des justificatifs de revenus (bulletins de salaire, attestation de travail) ou un garant. Les meublés demandent rarement plus qu'une pièce d'identité et le paiement d'avance.",
      },
      {
        question: "L'avance de plusieurs mois est-elle légale ?",
        reponse:
          "La loi ivoirienne encadre les baux d'habitation et limite en principe l'avance exigible, mais la pratique du marché reste de 2 à 4 mois. Négociez, et surtout exigez une quittance mentionnant précisément ce que couvre chaque versement.",
      },
    ],
  },
  {
    slug: 'acheter-terrain-cote-ivoire',
    titre: "Acheter un terrain en Côte d'Ivoire : ACD, étapes et pièges à éviter",
    description:
      "ACD, attestation villageoise, notaire, bornage : ce qu'il faut absolument vérifier avant d'acheter un terrain en Côte d'Ivoire, et les étapes d'un achat sécurisé.",
    categorie: 'Guide pratique',
    datePublication: '2026-07-05',
    minutesLecture: 7,
    sections: [
      {
        paragraphs: [
          "Acheter un terrain est l'investissement préféré des Ivoiriens — et celui qui génère le plus de litiges. Doubles ventes, papiers sans valeur, parcelles en zone litigieuse : les pièges sont connus et évitables. Voici ce qu'il faut vérifier, dans l'ordre, avant de signer quoi que ce soit.",
        ],
      },
      {
        h2: "L'ACD : le seul vrai titre de propriété",
        paragraphs: [
          "En Côte d'Ivoire, l'Arrêté de Concession Définitive (ACD) est le titre qui établit définitivement la propriété d'un terrain urbain. Tout le reste — attestation villageoise, lettre d'attribution, fiche de recensement — n'est qu'une étape intermédiaire qui ne protège pas contre une revendication ultérieure.",
          "Un terrain « avec ACD en cours » se paie donc moins cher qu'un terrain avec ACD délivré, mais il embarque un risque réel : la procédure peut révéler un litige, un chevauchement de parcelles ou un déclassement de la zone.",
        ],
      },
      {
        h2: 'Les vérifications indispensables avant tout versement',
        steps: [
          "Demandez l'original de l'ACD (ou du document disponible) et la pièce d'identité du vendeur : le nom sur le titre doit être celui du vendeur.",
          "Faites vérifier l'authenticité du document et la situation de la parcelle auprès des services du Ministère de la Construction et du cadastre — votre notaire s'en charge.",
          "Faites borner le terrain par un géomètre agréé : superficie réelle, limites, absence de chevauchement avec les parcelles voisines.",
          "Enquêtez sur place : parlez aux voisins et au chef du quartier. Une parcelle déjà vendue ou disputée se sait toujours localement.",
          "Vérifiez le zonage : certaines zones sont non constructibles (emprise de route, zone inondable, réserve administrative).",
        ],
      },
      {
        h2: 'Le passage chez le notaire : obligatoire, pas optionnel',
        paragraphs: [
          "La vente d'un terrain titré doit être formalisée par acte notarié. Le notaire vérifie les titres, sécurise le paiement, rédige l'acte et accomplit les formalités de mutation. Prévoyez des frais globaux (droits d'enregistrement, honoraires, formalités) de l'ordre de 7 à 10 % du prix — c'est le coût de votre sécurité juridique.",
          "Méfiez-vous de tout vendeur qui pousse à « faire simple » avec un reçu manuscrit et deux témoins : c'est la configuration type de la double vente.",
        ],
      },
      {
        h2: 'Les pièges classiques',
        list: [
          "La double vente : le même terrain vendu à plusieurs acheteurs — seul celui qui enregistre son droit en premier est protégé.",
          "L'attestation villageoise présentée comme un titre : elle n'en est pas un.",
          "Le terrain familial vendu par un seul héritier sans l'accord des autres : le litige est garanti.",
          "Le prix anormalement bas « parce qu'il faut vendre vite » : c'est presque toujours le symptôme d'un problème de papiers.",
          "Le versement en espèces sans trace : payez par des moyens traçables, contre reçu, et idéalement via la comptabilité du notaire.",
        ],
      },
      {
        h2: 'Où chercher ?',
        paragraphs: [
          "Les zones en plein essor autour d'Abidjan — [Bingerville](/vente/bingerville), [Songon](/vente/songon), [Anyama](/vente/anyama), l'axe [Grand-Bassam](/vente/grand-bassam) — concentrent l'offre de terrains et les meilleures perspectives de plus-value. Consultez les [biens à vendre sur notre catalogue](/catalogue?type_offre=vente) : chaque annonce publiée par notre équipe est vérifiée avant mise en ligne.",
        ],
      },
    ],
    faq: [
      {
        question: "Qu'est-ce que l'ACD exactement ?",
        reponse:
          "L'Arrêté de Concession Définitive est l'acte administratif par lequel l'État ivoirien concède définitivement la pleine propriété d'un terrain urbain. C'est le seul document qui vaut titre de propriété définitif en zone urbaine.",
      },
      {
        question: "Peut-on acheter un terrain avec une simple attestation villageoise ?",
        reponse:
          "C'est risqué : l'attestation villageoise constate une occupation coutumière mais ne confère pas la propriété. Elle sert de point de départ à la procédure d'obtention de l'ACD. Si vous achetez à ce stade, faites-le avec un notaire et en intégrant le risque dans le prix.",
      },
      {
        question: "Combien coûtent les frais d'achat d'un terrain ?",
        reponse:
          "Au-delà du prix du terrain, prévoyez environ 7 à 10 % pour les droits d'enregistrement, les honoraires du notaire et les formalités, plus le coût du bornage par un géomètre agréé.",
      },
    ],
  },
]

export const BLOG_SLUGS = new Set(BLOG_POSTS.map((p) => p.slug))

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug.toLowerCase())
}
