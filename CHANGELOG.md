# Changelog

## 2026-06-28

### Fixed
- Language toggle (EN/ES) now navigates to the equivalent page in the target language instead of always returning to the home page. The URL mapping is resolved at render time in `Layout.astro` and `LayoutEn.astro` using `Astro.url.pathname`, covering all routes: `/servicios` ↔ `/en/services`, `/quienes-somos` ↔ `/en/about`, `/normativas` ↔ `/en/regulations`, `/casos` ↔ `/en/cases`, `/blog` ↔ `/en/blog`, `/agenda-una-recoleccion` ↔ `/en/schedule-a-collection`, `/contacto` ↔ `/en/contact`, and the three service sub-pages (ekonsulting, ekoraee, ekopartner, ekotrading). Unknown routes fall back to the home of the target language.
