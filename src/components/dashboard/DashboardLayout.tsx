
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Signal, 
  Edit3, 
  Settings, 
  LogOut,
  Menu,
  X,
  MessageCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
}

const DashboardLayout = ({ children, currentPage, onPageChange }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const navigation = [
    { name: 'Signals', icon: Signal, id: 'signals' },
    { name: 'Personality', icon: Edit3, id: 'context' },
    { name: 'Settings', icon: Settings, id: 'settings' },
  ];

  const handleSignOut = async () => {
    console.log('Sign out clicked');
    try {
      await signOut();
      console.log('Sign out successful, should redirect to auth page');
      toast({
        title: "Signed out",
        description: "You have been successfully signed out"
      });
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: "Error",
        description: "Failed to sign out properly",
        variant: "destructive"
      });
    }
  };

  const handleNavigation = (pageId: string) => {
    if (pageId === 'settings') {
      navigate('/settings');
    } else {
      onPageChange(pageId);
    }
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-gradient-subtle">
      {/* Modern Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar backdrop-blur-xl transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        "border-r border-sidebar-border/50",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-sidebar-border/30">
          <div className="flex items-center">
            <div className="relative">
              <MessageCircle className="h-8 w-8 text-sidebar-primary" />
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-sidebar-primary rounded-full animate-glow"></div>
            </div>
            <h1 className="text-xl font-bold text-sidebar-foreground ml-3">Reddit Signal</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden text-sidebar-foreground hover:text-sidebar-primary hover:bg-sidebar-accent"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 px-4 py-6">
          <ul className="space-y-2">
            {navigation.map((item) => (
              <li key={item.id}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start h-12 rounded-xl font-medium transition-all duration-200",
                    currentPage === item.id
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg hover:bg-sidebar-primary/90"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-primary"
                  )}
                  onClick={() => handleNavigation(item.id)}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-sidebar-border/30">
          <div className="flex items-center mb-4 p-3 rounded-xl bg-sidebar-accent/50">
            <div className="relative">
              <div className="h-10 w-10 bg-gradient-to-br from-sidebar-primary to-sidebar-primary/70 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-sidebar-primary-foreground text-sm font-semibold">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-emerald-400 rounded-full border-2 border-sidebar-background"></div>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.email}</p>
              <p className="text-xs text-sidebar-foreground/60">Online</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start h-11 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-primary"
            onClick={handleSignOut}
          >
            <LogOut className="mr-3 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Modern Top bar */}
        <div className="bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm">
          <div className="flex items-center justify-between h-16 px-6">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden rounded-xl"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent capitalize">
              {currentPage}
            </h2>
            <div className="w-8 lg:hidden"></div>
          </div>
        </div>

        {/* Page content with improved spacing */}
        <main className="flex-1 overflow-auto p-6 animate-fade-in">
          {children}
        </main>
      </div>

      {/* Enhanced Sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default DashboardLayout;
