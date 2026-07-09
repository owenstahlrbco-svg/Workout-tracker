export type ClientType = 'in_person' | 'online' | 'community'

export const CLIENT_TYPES: { value: ClientType; label: string; short: string; description: string }[] = [
  { value: 'in_person', label: 'In-Person Training', short: 'In-Person', description: 'I train with Owen in person' },
  { value: 'online', label: 'Online Coaching', short: 'Online', description: 'Owen coaches me remotely' },
  { value: 'community', label: 'Skool Community', short: 'Community', description: "I'm a Skool community member" },
]

export function clientTypeLabel(value: string | null | undefined): string {
  return CLIENT_TYPES.find(t => t.value === value)?.short ?? 'Online'
}
