import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

// Chemins des moteurs de rendu natifs Windows (Edge ou Chrome)
const BROWSER_PATHS = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
];

export function getBrowserExecutable(): string {
  for (const bPath of BROWSER_PATHS) {
    if (fs.existsSync(bPath)) {
      return bPath;
    }
  }
  throw new Error('Aucun navigateur Chromium (Edge ou Chrome) trouvé sur le système pour générer le PDF.');
}

export interface GeneratePdfOptions {
  url: string;
  outputPath: string;
}

/**
 * Génère un PDF haute définition A4 sans en-tête ni pied de page navigateur
 */
export async function generatePdfFromUrl({ url, outputPath }: GeneratePdfOptions): Promise<string> {
  const browser = getBrowserExecutable();
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const args = [
    '--headless=new',
    '--disable-gpu',
    '--no-pdf-header-footer',
    `--print-to-pdf=${outputPath}`,
    url,
  ];

  await execFileAsync(browser, args, { timeout: 30000 });

  if (!fs.existsSync(outputPath)) {
    throw new Error('Le fichier PDF n\'a pas pu être créé.');
  }

  return outputPath;
}
