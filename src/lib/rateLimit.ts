// Limitador de fuerza bruta en memoria por instancia de función.
// Con Fluid Compute las instancias se reutilizan entre requests, así que
// esto mitiga ataques de un mismo cliente sin depender de infraestructura
// externa (Redis/KV). No es una defensa perfecta contra múltiples instancias
// concurrentes, pero cubre el caso común de fuerza bruta desde una IP.

const DEFAULT_MAX_ATTEMPTS = 5
const DEFAULT_WINDOW_MS = 10 * 60 * 1000 // 10 minutos

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

// Evita fuga de memoria si el proceso vive mucho tiempo.
function sweep(now: number): void {
  if (buckets.size < 5000) return
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
}

export interface RateLimitResult {
  allowed: boolean
  retryAfterSeconds: number
}

export function checkRateLimit(
  key: string,
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
  windowMs = DEFAULT_WINDOW_MS,
): RateLimitResult {
  const now = Date.now()
  sweep(now)
  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, retryAfterSeconds: 0 }
  }
  if (bucket.count >= maxAttempts) {
    return { allowed: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) }
  }
  bucket.count += 1
  return { allowed: true, retryAfterSeconds: 0 }
}

export function resetRateLimit(key: string): void {
  buckets.delete(key)
}

export function clientIp(request: Request, fallback: string): string {
  const fwd = request.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return fallback
}
