import { FastifyPluginAsync } from 'fastify'

export const geocodingRoutes: FastifyPluginAsync = async (fastify) => {
  // Search places proxy
  fastify.get('/search', async (request, reply) => {
    const { q } = request.query as { q?: string }
    if (!q || q.trim().length < 2) {
      return { success: true, data: [] }
    }

    try {
      const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&lat=17.385&lon=78.486&limit=6`
      const response = await fetch(url, { headers: { Accept: 'application/json' } })

      if (!response.ok) {
        return { success: true, data: [] }
      }

      const json = (await response.json()) as any
      const features = json.features || []

      const places = features.map((feat: any, idx: number) => {
        const props = feat.properties || {}
        const [lng, lat] = feat.geometry.coordinates
        const name = props.name || props.street || props.city || q
        const parts = [props.street, props.city, props.state, props.country].filter(Boolean)
        const address = parts.length > 0 ? parts.join(', ') : `${name}, Telangana`

        return {
          id: `osm-${props.osm_id || idx}`,
          name,
          address,
          lat,
          lng,
          type: props.osm_value || props.type || 'place',
        }
      })

      return { success: true, data: places }
    } catch (err: any) {
      fastify.log.warn(`Geocoding proxy error: ${err.message}`)
      return { success: true, data: [] }
    }
  })

  // Reverse geocoding proxy
  fastify.get('/reverse', async (request) => {
    const { lat, lng } = request.query as { lat?: string; lng?: string }
    if (!lat || !lng) {
      return { success: false, error: 'lat and lng required' }
    }

    try {
      const url = `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`
      const response = await fetch(url, { headers: { Accept: 'application/json' } })
      if (!response.ok) {
        return { success: false, error: 'Reverse geocode failed' }
      }

      const json = (await response.json()) as any
      const feat = json.features?.[0]
      if (!feat) {
        return {
          success: true,
          data: {
            name: `Location (${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)})`,
            address: 'Selected Location, Hyderabad',
            lat: Number(lat),
            lng: Number(lng),
          },
        }
      }

      const props = feat.properties || {}
      const name = props.name || props.street || 'Selected Point'
      const parts = [props.street, props.city, props.state].filter(Boolean)
      const address = parts.length > 0 ? parts.join(', ') : `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}`

      return {
        success: true,
        data: {
          name,
          address,
          lat: Number(lat),
          lng: Number(lng),
        },
      }
    } catch (err: any) {
      return {
        success: true,
        data: {
          name: `Location (${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)})`,
          address: 'Selected Location, Hyderabad',
          lat: Number(lat),
          lng: Number(lng),
        },
      }
    }
  })
}
