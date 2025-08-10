import { useState, useEffect, createContext, useContext } from 'react';
import { trpc } from '@/utils/trpc';
import { LoginForm } from '@/components/LoginForm';
import { AdminDashboard } from '@/components/AdminDashboard';
import { StaffDashboard } from '@/components/StaffDashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { LoginResponse, User, Staff } from '../../server/src/schema';

// Auth context for managing user state across components
interface AuthContextType {
  user: User | null;
  staff: Staff | null;
  login: (response: LoginResponse) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [staff, setStaff] = useState<Staff | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load user from localStorage on app start
  useEffect(() => {
    const savedAuth = localStorage.getItem('orphanage_auth');
    if (savedAuth) {
      try {
        const { user: savedUser, staff: savedStaff } = JSON.parse(savedAuth);
        setUser(savedUser);
        setStaff(savedStaff);
      } catch (error) {
        console.error('Failed to load saved auth:', error);
        localStorage.removeItem('orphanage_auth');
      }
    }
    setIsInitialized(true);
  }, []);

  const login = (response: LoginResponse) => {
    setUser(response.user);
    setStaff(response.staff);
    localStorage.setItem('orphanage_auth', JSON.stringify(response));
  };

  const logout = () => {
    setUser(null);
    setStaff(null);
    localStorage.removeItem('orphanage_auth');
  };

  const authValue: AuthContextType = {
    user,
    staff,
    login,
    logout,
    isLoading
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={authValue}>
      <div className="min-h-screen orphanage-gradient">
        {!user ? (
          <LoginLayout />
        ) : (
          <AuthenticatedLayout />
        )}
      </div>
    </AuthContext.Provider>
  );
}

function LoginLayout() {
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md card-warm shadow-warm">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gradient mb-2">
            🏠 Orphanage Management System
          </CardTitle>
          <p className="text-gray-600">
            Caring for children with compassion and dedication
          </p>
          <p className="text-sm text-blue-600 mt-2">
            Please sign in to manage orphanage operations
          </p>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}

function AuthenticatedLayout() {
  const { user, staff, logout } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Navigation Header */}
      <header className="bg-white/90 backdrop-blur-sm shadow-warm border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-blue-700">
                🏠 Orphanage Management
              </h1>
              <div className="hidden sm:block">
                <span className="px-2 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
                  {user?.role === 'admin' ? '👑 Administrator' : '👨‍💼 Staff Member'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Welcome, <span className="font-medium">{staff?.name || user?.email}</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={logout}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {user?.role === 'admin' ? (
          <AdminDashboard />
        ) : (
          <StaffDashboard />
        )}
      </main>
    </div>
  );
}

export default App;