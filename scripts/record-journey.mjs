/**
 * Records a fluid walkthrough of the Solides Run journey by driving the live
 * app (web :5173 → api :3000 → PostgreSQL + Ollama) with Playwright's
 * recordVideo, then transcodes the .webm to docs/journey.mp4 + docs/journey.gif
 * with ffmpeg.
 *
 * Run with `pnpm record:journey`.
 * Prereqs: docker compose up -d, ollama running, pnpm dev (web + api), ffmpeg.
 */
import { chromium } from 'playwright'
import { execFileSync } from 'node:child_process'

const BASE = process.env.BASE_URL ?? 'http://localhost:5173'
const VIEWPORT = { width: 1280, height: 800 }

const pause = (page, ms) => page.waitForTimeout(ms)

const run = async () => {
  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: VIEWPORT,
    recordVideo: { dir: 'frames/video', size: VIEWPORT },
    deviceScaleFactor: 1,
  })
  const page = await context.newPage()

  // 1. Login
  await page.goto(`${BASE}/login`)
  await page.getByRole('heading', { name: 'Bem-vindo' }).waitFor()
  await pause(page, 800)
  await page
    .getByRole('textbox', { name: 'E-mail corporativo' })
    .pressSequentially('ana@solides.com', { delay: 55 })
  await page
    .getByRole('textbox', { name: 'Senha' })
    .pressSequentially('solides123', { delay: 55 })
  await pause(page, 600)
  await page.getByRole('button', { name: 'Entrar' }).click()

  // 2. Benchmark list
  await page.waitForURL('**/benchmarks')
  await page.getByRole('heading', { name: 'Seus benchmarks' }).waitFor()
  await pause(page, 1800)

  // 3. New benchmark form
  await page.getByRole('link', { name: 'Novo benchmark' }).click()
  await page.waitForURL('**/benchmarks/new')
  await page.getByRole('button', { name: 'Rodar benchmark' }).waitFor()
  // Wait for the API-driven catalog options to populate the native selects
  // (options in a <select> are "hidden" to Playwright, so check the DOM).
  await page.waitForFunction(() => {
    const sel = document.getElementById('setor')
    return !!sel && Array.from(sel.options).some((o) => o.value === 'Tecnologia')
  })
  await pause(page, 1200)

  // 4. Configure the cohort (Solípse · Tecnologia · Sudeste)
  await page.getByLabel('Empresa cliente').selectOption('client-solipse')
  await pause(page, 500)
  await page.getByLabel('Setor (CNAE)').selectOption('Tecnologia')
  await pause(page, 500)
  await page.getByLabel('Região').selectOption('Sudeste')
  await pause(page, 1000)

  // 5. Run — let the video capture the live pipeline progress
  await page.getByRole('button', { name: 'Rodar benchmark' }).click()
  await page.getByRole('heading', { name: 'Dashboard de resultados' }).waitFor({
    timeout: 90_000,
  })
  await pause(page, 2500)

  // 6. Cohort
  await page.getByRole('link', { name: 'Cohort' }).click()
  await page.waitForURL('**/cohort')
  await pause(page, 1500)
  await page.mouse.wheel(0, 500)
  await pause(page, 1500)
  await page.mouse.wheel(0, -500)

  // 7. Diagnosis
  await page.getByRole('link', { name: 'Diagnóstico' }).click()
  await page.waitForURL('**/diagnosis')
  await pause(page, 2200)

  // 8. Trends (real period-over-period history)
  await page.getByRole('link', { name: 'Tendências' }).click()
  await page.waitForURL('**/trends')
  await page.getByRole('heading', { name: 'Tendências' }).waitFor()
  await pause(page, 2800)

  const videoPath = await page.video()?.path()
  await context.close() // flush the video
  await browser.close()
  return videoPath
}

const transcode = (webm) => {
  // MP4 (full quality) + GIF (inline README preview).
  execFileSync('ffmpeg', [
    '-y', '-i', webm,
    '-vf', 'scale=1100:-2,format=yuv420p',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23',
    '-movflags', '+faststart', '-r', '30',
    'docs/journey.mp4',
  ], { stdio: 'ignore' })

  execFileSync('ffmpeg', [
    '-y', '-i', webm,
    '-vf', 'fps=10,scale=800:-1:flags=lanczos,palettegen=stats_mode=diff',
    'frames/video/palette.png',
  ], { stdio: 'ignore' })
  execFileSync('ffmpeg', [
    '-y', '-i', webm, '-i', 'frames/video/palette.png',
    '-lavfi', 'fps=10,scale=800:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=4',
    '-loop', '0', 'docs/journey.gif',
  ], { stdio: 'ignore' })
}

const main = async () => {
  const webm = await run()
  console.log('recorded:', webm)
  if (webm) {
    transcode(webm)
    console.log('wrote docs/journey.mp4 and docs/journey.gif')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
