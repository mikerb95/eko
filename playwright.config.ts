import { defineConfig, devices } from '@playwright/test'

// Pruebas en navegador del panel (docs/plan-asistente.md, fase 9). Solo
// desarrollo: levantan su propio servidor contra una base SQLite temporal
// (DATABASE_URL tiene prioridad sobre el TURSO_DATABASE_URL de .env.local, que
// apunta a producción) y con el modelo simulado, así que no gastan API.

const PUERTO = 4329
const BASE = 'file:./data/e2e.db'

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/preparar.ts',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PUERTO}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // Servidor en primer plano y sin el candado, para no chocar con un `astro
    // dev` que ya esté corriendo. Si las pruebas las lanza un agente de IA,
    // Astro lo detecta por estas variables y fuerza el modo en segundo plano,
    // que no admite --ignore-lock: se quitan solo para este proceso.
    command: `env -u CLAUDECODE -u AI_AGENT -u CLAUDE_CODE_ENTRYPOINT astro dev --port ${PUERTO} --ignore-lock`,
    url: `http://localhost:${PUERTO}/admin/login`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: { DATABASE_URL: BASE, ASISTENTE_MODELO_FALSO: '1' },
  },
})
