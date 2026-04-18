import { getLinks } from './api'

export default async function generateStaticPaths() {
  const links = await getLinks()
  return links.map((link) => {
    const slug = link.slug === 'home' ? undefined : link.slug
    return {
      props: { slug },
      params: { slug },
    }
  })
}
