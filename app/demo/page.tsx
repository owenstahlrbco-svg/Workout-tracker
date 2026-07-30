import DemoDashboard from '@/components/DemoDashboard'

export const metadata = {
  title: 'Live Demo · Pitch HQ Dashboard',
  description: 'Explore the Pitch HQ Dashboard — calendar, training plans, and the recruiting database. A live preview with sample data.',
}

// Public, no-auth preview of the dashboard. The proxy whitelists /demo so
// prospects can browse the real product before signing up.
export default function DemoPage() {
  return <DemoDashboard />
}
