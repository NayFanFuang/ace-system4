// MapView — Leaflet map (loads lib from CDN dynamically, no npm install needed)
// <MapView markers={[{lat,lng,name,status:'on'|'off'|'office'}]} height={320} tileTone="gray" />
import { useEffect, useRef } from 'react'

let leafletPromise = null
function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L)
  if (leafletPromise) return leafletPromise
  leafletPromise = new Promise((resolve, reject) => {
    if (!document.querySelector('link[data-leaflet]')) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css'
      link.setAttribute('data-leaflet', '')
      document.head.appendChild(link)
    }
    const s = document.createElement('script')
    s.src = 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js'
    s.onload = () => resolve(window.L)
    s.onerror = reject
    document.head.appendChild(s)
  })
  return leafletPromise
}

const STATUS_COLOR = { on: '#16a34a', off: '#dc2626', office: '#2447d8' }

export function MapView({ center = [13.7563, 100.5018], zoom = 10, markers = [], height = 320, tileTone = 'default', fitToMarkers = false }) {
  const elRef = useRef(null)
  const mapRef = useRef(null)
  const layerRef = useRef(null)   // dedicated layer group for markers (so we can clear/redraw)
  const Lref = useRef(null)
  const didFit = useRef(false)

  // init map once
  useEffect(() => {
    let cancelled = false
    loadLeaflet().then(L => {
      if (cancelled || !elRef.current || mapRef.current) return
      Lref.current = L
      const map = L.map(elRef.current, { zoomControl: true }).setView(center, zoom)
      mapRef.current = map
      layerRef.current = L.layerGroup().addTo(map)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© OpenStreetMap' }).addTo(map)
      drawMarkers()                                  // draw whatever we have now
      setTimeout(() => map.invalidateSize(), 200)
      setTimeout(() => map.invalidateSize(), 800)
    }).catch(() => {
      if (elRef.current) {
        elRef.current.innerHTML = '<div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;background:#eef2f7;color:#64748b;font-size:13px"><div style="font-size:26px">🗺️</div><div>Map failed to load (CDN blocked)</div></div>'
      }
    })
    return () => { cancelled = true; if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; layerRef.current = null } }
  }, [])

  function drawMarkers() {
    const L = Lref.current, map = mapRef.current, layer = layerRef.current
    if (!L || !map || !layer) return
    layer.clearLayers()
    const valid = markers.filter(m => Number.isFinite(m.lat) && Number.isFinite(m.lng))
    valid.forEach(m => {
      const c = STATUS_COLOR[m.status] || '#2447d8'
      L.circleMarker([m.lat, m.lng], { radius: 8, color: c, fillColor: c, fillOpacity: 0.85, weight: 2 })
        .addTo(layer).bindPopup(`<b>${m.name || ''}</b>${m.status ? `<br>status: ${m.status}` : ''}`)
    })
    if (fitToMarkers && valid.length && !didFit.current) {
      const b = L.latLngBounds(valid.map(m => [m.lat, m.lng]))
      map.fitBounds(b.pad(0.15))
      didFit.current = true
    }
  }

  // redraw markers whenever they change (e.g. after async fetch / search filter)
  useEffect(() => {
    drawMarkers()
  }, [markers])

  // re-center when center prop changes (and map already exists)
  useEffect(() => {
    if (mapRef.current && Array.isArray(center)) mapRef.current.setView(center, mapRef.current.getZoom())
  }, [center?.[0], center?.[1]])

  return <div ref={elRef} className={`ds-map ${tileTone === 'gray' ? 'ds-map--gray' : ''}`} style={{ height }} />
}
