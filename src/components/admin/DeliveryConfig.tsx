'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Plus, Minus, Trash2, Truck } from 'lucide-react'

export interface DeliveryZone {
  id: string
  name: string
  districts: string[]
  charge: number
  days: string
}

interface DeliveryConfigProps {
  onChange: (patch: Record<string, any>) => void
  initialSettings?: Record<string, any>
}

const DEFAULT_ZONES: DeliveryZone[] = [
  { id: 'inside-dhaka', name: 'Inside Dhaka', districts: ['Dhaka North', 'Dhaka South'], charge: 60, days: '1-2' },
  { id: 'outside-dhaka', name: 'Outside Dhaka', districts: ['Gazipur', 'Narayanganj', 'Savar', 'Rajshahi', 'Chattogram', 'Sylhet', 'Khulna', 'Barishal', 'Rangpur', 'Mymensingh'], charge: 120, days: '3-5' },
]

export function DeliveryConfig({ onChange, initialSettings = {} }: DeliveryConfigProps) {
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>(
    initialSettings.delivery_zones || DEFAULT_ZONES
  )
  const [showZones, setShowZones] = useState(true)
  const [editingZone, setEditingZone] = useState<string | null>(null)
  const [zoneForm, setZoneForm] = useState({ name: '', districts: [] as string[], charge: 0, days: '' })

  const emit = (zones: DeliveryZone[]) => {
    setDeliveryZones(zones)
    onChange({ delivery_zones: zones })
  }

  const addZone = () => {
    const zone: DeliveryZone = {
      id: `zone-${Date.now()}`,
      name: 'New Zone',
      districts: [],
      charge: 0,
      days: '2-4',
    }
    emit([...deliveryZones, zone])
    setEditingZone(zone.id)
    setZoneForm({ name: zone.name, districts: zone.districts, charge: zone.charge, days: zone.days })
  }

  const updateZone = (id: string) => {
    emit(deliveryZones.map((z) => (z.id === id ? { ...z, ...zoneForm } : z)))
    setEditingZone(null)
  }

  const deleteZone = (id: string) => {
    if (deliveryZones.length <= 1) return
    emit(deliveryZones.filter((z) => z.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-card border-3 border-[var(--ink)] p-6 shadow-card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-input bg-primary/10 flex items-center justify-center">
              <Truck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display text-xl text-primary">Delivery Zones</h3>
              <p className="text-[var(--text-muted)]">Configure delivery charges per zone</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowZones(!showZones)}>
            {showZones ? <Minus className="w-4 h-4 mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
            {showZones ? 'Hide' : 'Manage'} Zones
          </Button>
        </div>

        {showZones && (
          <div className="space-y-4">
            {deliveryZones.map((zone) => {
              const isEditing = editingZone === zone.id

              if (isEditing) {
                return (
                  <div key={zone.id} className="bg-[var(--light)] rounded-input p-4 border-2 border-[var(--ink)] animate-scale-in">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <Input
                        label="Zone Name"
                        value={zoneForm.name}
                        onChange={(e) => setZoneForm((prev) => ({ ...prev, name: e.target.value }))}
                      />
                      <Input
                        label="Districts (comma separated)"
                        value={zoneForm.districts.join(', ')}
                        onChange={(e) => setZoneForm((prev) => ({ ...prev, districts: e.target.value.split(',').map((d) => d.trim()).filter(Boolean) }))}
                      />
                      <Input
                        type="number"
                        label="Charge (BDT)"
                        value={zoneForm.charge}
                        onChange={(e) => setZoneForm((prev) => ({ ...prev, charge: parseInt(e.target.value) || 0 }))}
                        min={0}
                      />
                      <Input
                        label="Delivery Days"
                        value={zoneForm.days}
                        onChange={(e) => setZoneForm((prev) => ({ ...prev, days: e.target.value }))}
                        placeholder="e.g., 3-5"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="primary" size="sm" onClick={() => updateZone(zone.id)}>Save</Button>
                      <Button variant="secondary" size="sm" onClick={() => setEditingZone(null)}>Cancel</Button>
                    </div>
                  </div>
                )
              }

              return (
                <div key={zone.id} className="flex items-center justify-between p-4 bg-[var(--light)] rounded-input border-2 border-[var(--ink)]">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-body text-[var(--ink)]">{zone.name}</span>
                      <Badge variant="primary" size="sm">{zone.charge} BDT</Badge>
                      <Badge variant="secondary" size="sm">{zone.days} days</Badge>
                    </div>
                    <p className="text-sm text-[var(--text-subtle)] mt-1">{zone.districts.join(', ') || 'All districts'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => {
                      setEditingZone(zone.id)
                      setZoneForm({ name: zone.name, districts: zone.districts, charge: zone.charge, days: zone.days })
                    }}>Edit</Button>
                    {deliveryZones.length > 1 && (
                      <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50" onClick={() => deleteZone(zone.id)} aria-label={`Delete ${zone.name}`}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}

            <Button variant="outline" onClick={addZone} className="w-full">
              <Plus className="w-4 h-4 mr-1" />
              Add Delivery Zone
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
