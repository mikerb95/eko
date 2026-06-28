export function getTransLink(_language, slug) {
  return slug || '/'
}

export function getLanguages() {
  return ['es', 'en']
}

export function getLanguageLabel(locale) {
  return locale === 'en' ? 'English' : 'Español'
}

export function getLanguageFlag(_locale) {
  return ''
}
