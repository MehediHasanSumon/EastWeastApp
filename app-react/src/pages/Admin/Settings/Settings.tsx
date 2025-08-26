import Card from "../../../components/ui/Card"
import AdminLayout from "../../../layouts/Admin/AdminLayout"

const Settings = () => {
  return (
    <AdminLayout>
      <Card title="SMS Settings" description="Customize your SMS alerts and messaging options." href="/sms-settings" />
    </AdminLayout>
  )
}

export default Settings