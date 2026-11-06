import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * Troca %SITE_URL% no index.html pelo domínio público (VITE_SITE_URL).
 * A capa de link (og:image) precisa de URL absoluta para aparecer no
 * WhatsApp, Instagram, Facebook e X.
 */
function siteUrl(url: string): Plugin {
  const clean = url.replace(/\/+$/, '');
  return {
    name: 'site-url',
    transformIndexHtml(html, ctx) {
      if (!clean && !ctx.server) {
        console.warn(
          '\n[site-url] VITE_SITE_URL não definida: a capa de link não vai aparecer nas redes. ' +
            'Defina o domínio público no .env ou no painel da hospedagem.\n',
        );
      }
      return html.replaceAll('%SITE_URL%', clean);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss(), siteUrl(env.VITE_SITE_URL ?? '')],
    build: {
      target: 'es2020',
      cssMinify: true,
    },
    test: {
      environment: 'node',
      include: ['src/**/*.test.ts'],
    },
  } as ReturnType<typeof defineConfig>;
});
