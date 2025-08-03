import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DashboardHome from '@/components/dashboard/DashboardHome';
import SignalsPage from '@/components/signals/SignalsPage';
import ContextManager from '@/components/context/ContextManager';
import AuthPage from '@/components/auth/AuthPage';

const Dashboard = () => {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('signals');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'signals':
        return <SignalsPage />;
      case 'context':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Personality Management</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Create and manage personality profiles that will be available across all your signals for better comment generation. 
                Add details about different personality types, communication styles, or character traits that should influence AI-generated comments.
              </p>
            </div>
            <ContextManager />
          </div>
        );
      case 'settings':
        return (
          <div className="text-center py-8">
            <h2 className="text-2xl font-bold mb-4">Settings</h2>
            <p className="text-gray-600">Coming soon - Configure your account and Reddit integration</p>
          </div>
        );
      default:
        return <SignalsPage />;
    }
  };

  return (
    <DashboardLayout currentPage={currentPage} onPageChange={setCurrentPage}>
      {renderCurrentPage()}
    </DashboardLayout>
  );
};

export default Dashboard;
