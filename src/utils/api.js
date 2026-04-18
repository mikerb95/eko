import siteSettingsData from '../data/site-settings.json'
import homePage from '../data/pages/home.json'
import reportPage from '../data/pages/report.json'

const reportModules = import.meta.glob('../data/reports/*.json', { eager: true })

const reports = Object.entries(reportModules).map(([path, mod]) => {
  const filename = path.split('/').pop().replace('.json', '')
  return {
    slug: `report/${filename}`,
    content: mod.default ?? mod,
  }
})

const pages = {
  home: homePage,
  report: reportPage,
}

export async function getStory(slug = 'home') {
  if (!slug) slug = 'home'

  if (slug.startsWith('report/')) {
    const found = reports.find((r) => r.slug === slug)
    if (!found) return null
    return {
      content: {
        ...found.content,
        slug: found.slug.replace('report/', ''),
      },
    }
  }

  const content = pages[slug]
  return content ? { content } : null
}

export async function getLinks() {
  const pageLinks = Object.keys(pages).map((slug) => ({ slug, is_folder: false }))
  const reportLinks = reports.map((r) => ({ slug: r.slug, is_folder: false }))
  return [...pageLinks, ...reportLinks]
}

export async function getSiteSettings() {
  return { content: siteSettingsData }
}

export async function getReportList() {
  return reports
}

export async function getDatasource(slug) {
  if (slug === 'colors') return { primary: '#2D6A4F' }
  return {}
}
