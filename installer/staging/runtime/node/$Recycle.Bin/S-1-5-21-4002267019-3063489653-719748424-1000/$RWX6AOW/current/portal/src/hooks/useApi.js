import { useState, useEffect } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

export function usePortalConfig() {
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_BASE}/public/portal-config`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setConfig(data.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return { config, loading }
}

export function useStores() {
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_BASE}/public/stores`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setStores(data.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return { stores, loading }
}

export function usePromotions() {
  const [promotions, setPromotions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_BASE}/public/promotions`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setPromotions(data.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return { promotions, loading }
}

export function useFlyer() {
  const [flyer, setFlyer] = useState({ enabled: false, products: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_BASE}/public/flyer`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setFlyer(data.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return { flyer, loading }
}

export function useProducts(params = {}) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [meta, setMeta] = useState({})

  useEffect(() => {
    const queryString = new URLSearchParams(params).toString()
    fetch(`${API_BASE}/public/products${queryString ? '?' + queryString : ''}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProducts(data.data)
          setMeta(data.meta || {})
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [JSON.stringify(params)])

  return { products, loading, meta }
}
