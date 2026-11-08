/**
 * Service Heyzine Flipbook & MCP pour Agence Immo Abidjan
 * Basé sur la documentation officielle Heyzine API & MCP Server 2026
 * - Client ID : 4099cc3d6bd3641e
 * - API Key : c5643aa04516c2a1b0381043098f3044d217692e.4099cc3d6bd3641e
 * - MCP Server : https://heyzine.com/mcp
 */

export const HEY_CLIENT_ID = process.env.HEY_CLIENT_ID || '4099cc3d6bd3641e';
export const HEY_API_KEY = process.env.HEY_API_KEY || 'c5643aa04516c2a1b0381043098f3044d217692e.4099cc3d6bd3641e';
export const HEY_MCP_ENDPOINT = 'https://heyzine.com/mcp';

export interface ConvertFlipbookOptions {
  pdfUrl: string;
  title: string;
  subtitle?: string;
  description?: string;
  allowDownload?: boolean;
  pageEffect?: 'magazine' | 'book' | 'album' | 'notebook' | 'fade' | 'cards' | 'coverflow' | 'onepage';
  backgroundColor?: string;
  tags?: string;
}

export interface HeyzineFlipbookResult {
  id?: string;
  url: string;
  pdf: string;
  thumbnail?: string;
  title?: string;
  meta?: {
    num_pages?: number;
    aspect_ratio?: number;
  };
  state?: string;
}

export interface HeyzineFlipbookItem {
  id: string;
  date: string;
  title: string;
  subtitle?: string;
  description?: string;
  private?: string;
  pages?: number;
  size?: number;
  links: {
    custom?: string;
    base: string;
    thumbnail: string;
    pdf: string;
  };
}

/**
 * 1. LINK CONVERSION (Sans état côté serveur)
 * Format officiel : https://heyzine.com/api1?pdf={pdf url}&k={client id}&...
 * Rendu instantané avec palette travertin et effet magazine de prestige
 */
export function getHeyzineDirectUrl(options: ConvertFlipbookOptions): string {
  const params = new URLSearchParams();
  params.set('k', HEY_CLIENT_ID);
  params.set('pdf', options.pdfUrl);
  params.set('t', options.title);
  if (options.subtitle) params.set('s', options.subtitle);
  if (options.description) params.set('ds', options.description);
  params.set('fs', '1'); // Plein écran
  params.set('sh', '1'); // Partage
  params.set('pn', '1'); // Flèches précédent/suivant
  params.set('st', '1'); // Afficher titre/infos en arrière-plan
  params.set('pe', options.pageEffect || 'magazine'); // Effet magazine
  params.set('bg', options.backgroundColor || 'fbfaf7'); // Travertin chaud (Anti-AI slop)
  if (options.allowDownload !== false) params.set('d', '1');

  return `https://heyzine.com/api1?${params.toString()}`;
}

/**
 * 2. REST API SYNCHRONE (Endpoint officiel POST https://heyzine.com/api1/rest)
 * Retourne le lien pérenne, le thumbnail et l'identifiant du flipbook
 */
export async function convertPdfToFlipbook(options: ConvertFlipbookOptions): Promise<HeyzineFlipbookResult> {
  const endpoint = 'https://heyzine.com/api1/rest';
  
  const payload = {
    pdf: options.pdfUrl,
    client_id: HEY_CLIENT_ID,
    title: options.title,
    subtitle: options.subtitle || 'Agence Immo • Plaquette de Prestige',
    description: options.description || 'Dossier de vente avec statut foncier ACD vérifié',
    download: options.allowDownload !== false,
    full_screen: true,
    share: true,
    prev_next: true,
    show_info: true,
    page_effect: options.pageEffect || 'magazine',
    background_color: options.backgroundColor || 'fbfaf7',
    tags: options.tags || 'immobilier,abidjan,prestige,acd',
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${HEY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erreur Heyzine REST (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return {
    id: data.id,
    url: data.url || `https://heyzine.com/flip-book/${data.id}.html`,
    thumbnail: data.thumbnail,
    pdf: data.pdf || options.pdfUrl,
    title: options.title,
    meta: data.meta,
  };
}

/**
 * 3. GESTION DES FLIPBOOKS DE L'AGENCE (GET https://heyzine.com/api1/flipbook-list)
 */
export async function listAccountFlipbooks(): Promise<HeyzineFlipbookItem[]> {
  const endpoint = 'https://heyzine.com/api1/flipbook-list';
  
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${HEY_API_KEY}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erreur Heyzine list (${response.status}): ${errorText}`);
  }

  const list = await response.json();
  return Array.isArray(list) ? list : [];
}

/**
 * 4. DÉTAILS D'UN FLIPBOOK (GET https://heyzine.com/api1/flipbook-details)
 */
export async function getFlipbookDetails(flipbookId: string) {
  const endpoint = `https://heyzine.com/api1/flipbook-details?id=${encodeURIComponent(flipbookId)}`;
  
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${HEY_API_KEY}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erreur Heyzine details (${response.status}): ${errorText}`);
  }

  return await response.json();
}

/**
 * 5. OEMBED API (GET https://heyzine.com/api1/oembed?url=...)
 * Permet d'intégrer l'iframe de manière dynamique dans le site
 */
export async function getFlipbookOEmbed(flipbookUrl: string) {
  const endpoint = `https://heyzine.com/api1/oembed?url=${encodeURIComponent(flipbookUrl)}&format=json`;
  
  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error(`Erreur Heyzine oEmbed (${response.status})`);
  }

  return await response.json();
}

/**
 * 6. APPEL DIRECT MCP (Streamable HTTP JSON-RPC 2.0 sur https://heyzine.com/mcp)
 * Permet d'exécuter n'importe quel outil MCP Heyzine directement depuis le serveur
 */
export async function callHeyzineMCPTool(toolName: string, toolArguments: Record<string, unknown> = {}) {
  const payload = {
    jsonrpc: '2.0',
    id: Date.now(),
    method: 'tools/call',
    params: {
      name: toolName,
      arguments: toolArguments,
    },
  };

  const response = await fetch(HEY_MCP_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${HEY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Erreur Heyzine MCP (${response.status}): ${response.statusText}`);
  }

  const result = await response.json();
  if (result.error) {
    throw new Error(`Erreur JSON-RPC MCP : ${result.error.message || JSON.stringify(result.error)}`);
  }

  return result.result;
}
