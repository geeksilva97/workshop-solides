import { PageHeader } from '../../components/PageHeader'
import { Card } from '../../components/ui/Card'

export function SettingsPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Configurações"
        subtitle="Preferências da conta e da organização."
      />
      <Card className="p-8 text-sm text-body">
        Em breve: gestão de membros, integrações de RH e preferências de privacidade.
      </Card>
    </div>
  )
}
