import L from 'leaflet'
import { MapPoint, VehicleData } from '../types'

/**
 * Creates custom styled HTML DivIcons matching the Tailwind UI/UX Pro Max tokens.
 * This completely prevents 404 errors for standard Leaflet PNG marker assets.
 */

export function createPickupIcon(point: MapPoint, idx: number): L.DivIcon {
  const order = point.stopOrder !== undefined ? point.stopOrder : idx + 1
  return L.divIcon({
    className: 'custom-pickup-marker',
    html: `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        width: 30px;
        height: 30px;
        background: #0284c7;
        color: white;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 4px 10px rgba(2, 132, 199, 0.4);
        font-family: system-ui, -apple-system, sans-serif;
        font-weight: 700;
        font-size: 12px;
        transition: transform 0.2s ease;
      ">
        ${order}
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -16],
  })
}

export function createDestinationIcon(point: MapPoint): L.DivIcon {
  return L.divIcon({
    className: 'custom-destination-marker',
    html: `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        width: 34px;
        height: 34px;
        background: #16a34a;
        color: white;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(22, 163, 74, 0.45);
        font-family: system-ui, -apple-system, sans-serif;
        font-weight: 700;
        font-size: 14px;
      ">
        ★
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  })
}

export function createVehicleIcon(
  vehicle: Partial<VehicleData> & { heading?: number }
): L.DivIcon {
  const isAlert = vehicle.isAlert || vehicle.isDeviated
  const bg = isAlert ? '#ef4444' : '#0284c7'
  const ringColor = isAlert ? 'rgba(239, 68, 68, 0.4)' : 'rgba(2, 132, 199, 0.35)'
  const heading = typeof vehicle.heading === 'number' ? vehicle.heading : 0
  const capacityLabel =
    vehicle.bookedSeats !== undefined && vehicle.capacity !== undefined
      ? `${vehicle.bookedSeats}/${vehicle.capacity}`
      : ''

  return L.divIcon({
    className: 'custom-vehicle-marker',
    html: `
      <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
        <div style="
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          background: ${ringColor};
          animation: ping 1.4s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>
        <div style="
          position: relative;
          width: 38px;
          height: 38px;
          background: ${bg};
          color: white;
          border-radius: 12px;
          border: 2.5px solid white;
          box-shadow: 0 4px 14px rgba(0,0,0,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        ">
          <!-- Heading Oriented Arrow -->
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            transform: rotate(${heading}deg);
            transition: transform 0.25s ease-out;
            width: 24px;
            height: 24px;
          ">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 19 21 12 17 5 21 12 2" fill="white" fill-opacity="0.3"/>
            </svg>
          </div>
        </div>
        ${
          capacityLabel
            ? `
          <div style="
            position: absolute;
            bottom: -5px;
            right: -5px;
            background: #0f172a;
            color: white;
            font-size: 9px;
            font-weight: 700;
            padding: 1px 4px;
            border-radius: 6px;
            border: 1px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            font-family: ui-monospace, SFMono-Regular, monospace;
          ">
            ${capacityLabel}
          </div>
        `
            : ''
        }
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22],
  })
}

export function createRouteStopIcon(stop: any, index: number): L.DivIcon {
  const isDropoff = stop.type === 'DROPOFF'
  const isBoarded = stop.status === 'BOARDED' || stop.status === 'COMPLETED'
  const isArrived = stop.status === 'ARRIVED'
  const isArriving = stop.status === 'ARRIVING'

  let bg = '#0284c7'
  let label: string = String(stop.sequence || index + 1)
  let ring = ''

  if (isDropoff) {
    bg = '#16a34a'
    label = '★'
  } else if (isBoarded) {
    bg = '#10b981'
    label = '✓'
  } else if (isArrived) {
    bg = '#f59e0b'
    ring = `
      <div style="
        position: absolute;
        inset: -4px;
        border-radius: 50%;
        background: rgba(245, 158, 11, 0.4);
        animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;
      "></div>
    `
  } else if (isArriving) {
    bg = '#0284c7'
    ring = `
      <div style="
        position: absolute;
        inset: -4px;
        border-radius: 50%;
        background: rgba(2, 132, 199, 0.4);
        animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;
      "></div>
    `
  }

  return L.divIcon({
    className: 'custom-route-stop-marker',
    html: `
      <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
        ${ring}
        <div style="
          position: relative;
          width: 28px;
          height: 28px;
          background: ${bg};
          color: white;
          border-radius: 50%;
          border: 2.5px solid white;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);
          font-family: system-ui, -apple-system, sans-serif;
          font-weight: 700;
          font-size: ${label === '✓' || label === '★' ? '14px' : '11px'};
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          ${label}
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  })
}

export function createLocationPickerIcon(): L.DivIcon {
  return L.divIcon({
    className: 'custom-picker-marker',
    html: `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        background: #f59e0b;
        color: white;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(245, 158, 11, 0.5);
        font-size: 15px;
        cursor: grab;
      ">
        📍
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  })
}

export function createUserLocationIcon(): L.DivIcon {
  return L.divIcon({
    className: 'custom-gps-marker',
    html: `
      <div style="position: relative; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center;">
        <div style="
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: rgba(59, 130, 246, 0.4);
          animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>
        <div style="
          width: 14px;
          height: 14px;
          background: #2563eb;
          border-radius: 50%;
          border: 2.5px solid white;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.6);
        "></div>
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -14],
  })
}
