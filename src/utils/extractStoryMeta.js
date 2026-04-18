export const extractStoryMeta = (story, extra) => ({
	headline: story.name,
	slug: story.slug === 'home' ? '' : story.full_slug,
	summary: story.content?.metatags?.description || '',
	...extra,
})
