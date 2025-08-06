import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface AdminDashboardPageProps {
  onLogout: () => void;
}

function AdminDashboardPage({ onLogout }: AdminDashboardPageProps) {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Card className="p-12 text-center">
        <div className="text-6xl mb-6">⚙️</div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Admin Dashboard</h2>
        <p className="text-gray-600 mb-8">
          Welcome to the administrative panel. Here you can manage polls, view detailed results, and more.
        </p>
        <div className="text-sm text-gray-500 mb-8">
          <strong>Coming Soon:</strong> Poll creation, editing, and detailed analytics will be available here.
        </div>
        <Button onClick={onLogout} variant="outline" className="mx-auto">
          Logout
        </Button>
      </Card>
    </div>
  );
}

export default AdminDashboardPage;