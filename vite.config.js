import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? '/guitar_mem_tool/' : '/',
});
