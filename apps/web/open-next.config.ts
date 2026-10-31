import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// ponytail: pas de cache incrémental (dummy) ; ajouter R2/KV si ISR/revalidate est requis.
export default defineCloudflareConfig();
