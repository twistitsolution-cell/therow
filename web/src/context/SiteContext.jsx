import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { fallbackSite } from '../data/fallbackSite'
import { formatMoney } from '../lib/format'
import { translate } from '../i18n'

const SiteContext = createContext(null)

const STORAGE_KEYS = { currency: 'therow.currency', language: 'therow.language' }

function readStored(key, fallback) {
  if (typeof window === 'undefined') return fallback
  return window.localStorage.getItem(key) ?? fallback
}

export function SiteProvider({ children }) {
  const [site, setSite] = useState(fallbackSite)
  const [loading, setLoading] = useState(true)

  /** True when the API could not be reached and the bundled content is on screen. */
  const [isOffline, setIsOffline] = useState(false)

  const [currency, setCurrencyState] = useState(() => readStored(STORAGE_KEYS.currency, 'ETB'))
  const [language, setLanguageState] = useState(() => readStored(STORAGE_KEYS.language, 'en'))

  useEffect(() => {
    const controller = new AbortController()

    api
      .site(controller.signal)
      .then((data) => {
        // Guard against an API that answers but has not been seeded yet.
        if (data?.roomTypes?.length) {
          setSite(data)
          setIsOffline(false)
        } else {
          setIsOffline(true)
        }
      })
      .catch((error) => {
        if (error.name === 'AbortError') return
        setIsOffline(true)
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [])

  const setCurrency = useCallback((next) => {
    setCurrencyState(next)
    window.localStorage.setItem(STORAGE_KEYS.currency, next)
  }, [])

  const setLanguage = useCallback((next) => {
    setLanguageState(next)
    window.localStorage.setItem(STORAGE_KEYS.language, next)
    document.documentElement.lang = next
  }, [])

  const value = useMemo(() => {
    const settings = site.settings ?? {}
    const etbPerUsd = Number(settings['currency.etb_per_usd']) || 1

    const blocksByKey = {}
    for (const block of site.blocks ?? []) {
      blocksByKey[`${block.pageKey}.${block.sectionKey}`] = block
    }

    return {
      site,
      loading,
      isOffline,
      settings,
      blocksByKey,
      block: (key) => blocksByKey[key],
      roomTypes: site.roomTypes ?? [],
      roomTypeBySlug: (slug) => (site.roomTypes ?? []).find((rt) => rt.slug === slug),

      currency,
      setCurrency,
      etbPerUsd,
      money: (amountEtb, options) => formatMoney(amountEtb, currency, etbPerUsd, options),

      language,
      setLanguage,
      t: (key) => translate(language, key),
    }
  }, [site, loading, isOffline, currency, setCurrency, language, setLanguage])

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>
}

export function useSite() {
  const context = useContext(SiteContext)
  if (!context) throw new Error('useSite must be used inside a SiteProvider')
  return context
}
