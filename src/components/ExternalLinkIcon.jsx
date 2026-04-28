import { useMemo, useState } from 'react'

const PROVIDER_META = [
  {
    key: 'airbnb',
    hosts: ['airbnb.'],
    label: '에어비엔비',
    logoSrc: '/icons/providers/airbnb-logo.svg',
    logoClassName: 'h-4 w-4',
  },
  {
    key: 'agoda',
    hosts: ['agoda.'],
    label: '아고다',
    logoSrc: '/icons/providers/Agoda-logo.svg',
    logoClassName: 'h-4 w-6',
  },
  {
    key: 'yanolja',
    hosts: ['yanolja.'],
    label: '야놀자',
    logoSrc: '/icons/providers/NOL-logo.png',
    logoClassName: 'h-4 w-4',
  },
  {
    key: 'yeogi',
    hosts: ['goodchoice.', 'hotelnow.', 'yeogi'],
    label: '여기어때',
    logoSrc: '/icons/providers/YEOGIEOTTAE-logo.png',
    logoClassName: 'h-4 w-4',
  },
  {
    key: 'naverMap',
    hosts: ['map.naver.', 'naver.me'],
    label: '네이버 지도',
    logoSrc: '/icons/providers/NaverMap-logo.png',
    logoClassName: 'h-4 w-4',
  },
]

function normalizeUrl(url) {
  if (!url) return null
  const trimmed = url.trim()
  if (!trimmed) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function getProvider(url) {
  const normalized = normalizeUrl(url)
  if (!normalized) return null

  try {
    const host = new URL(normalized).hostname.toLowerCase()
    const provider = PROVIDER_META.find((meta) => meta.hosts.some((domain) => host.includes(domain)))
    if (provider) return provider
  } catch {
    // URL 파싱에 실패하면 기본 아이콘을 사용한다.
  }

  return { key: 'default', label: '외부 링크' }
}

export default function ExternalLinkIcon({ url, className = '' }) {
  const provider = getProvider(url)
  const normalized = normalizeUrl(url)
  const [imageLoadFailed, setImageLoadFailed] = useState(false)
  const shouldRenderLogo = useMemo(() => !!provider?.logoSrc && !imageLoadFailed, [provider?.logoSrc, imageLoadFailed])

  if (!provider || !normalized) return null

  return (
    <a
      href={normalized}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center justify-center text-sm hover:scale-105 transition-transform ${className}`.trim()}
      title={provider.label}
      aria-label={provider.label}
    >
      {shouldRenderLogo ? (
        <img
          src={provider.logoSrc}
          alt={provider.label}
          className={`object-contain ${provider.logoClassName || 'h-4 w-4'}`}
          onError={() => setImageLoadFailed(true)}
          loading="lazy"
        />
      ) : (
        <span aria-hidden>🔗</span>
      )}
    </a>
  )
}
