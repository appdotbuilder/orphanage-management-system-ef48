import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { useAuth } from '../App';
import type { LoginInput, UserRole } from '../../../server/src/schema';

export function LoginForm() {
  const { login } = useAuth();
  const [formData, setFormData] = useState<LoginInput>({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Since backend is using stubs, we'll simulate login based on email pattern
      const response = await trpc.loginUser.mutate(formData);
      
      // Override stub response with demo-appropriate data
      const role: UserRole = formData.email.toLowerCase().includes('admin') ? 'admin' : 'staff';
      const userId = Math.floor(Math.random() * 1000) + 1;
      const demoResponse = {
        user: {
          ...response.user,
          id: userId,
          email: formData.email,
          role: role,
          created_at: new Date(),
          updated_at: new Date()
        },
        staff: {
          id: Math.floor(Math.random() * 1000) + 1,
          user_id: userId,
          name: role === 'admin' ? 'Administrator' : 'Staff Member',
          email: formData.email,
          phone_number: null,
          position: role === 'admin' ? 'System Administrator' : 'Staff Member',
          created_at: new Date(),
          updated_at: new Date()
        }
      };
      
      login(demoResponse);
    } catch (error) {
      console.error('Login failed:', error);
      setError('Demo login failed. Try any email address with any password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          value={formData.email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: LoginInput) => ({ ...prev, email: e.target.value }))
          }
          required
          disabled={isLoading}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Enter your password"
          value={formData.password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: LoginInput) => ({ ...prev, password: e.target.value }))
          }
          required
          disabled={isLoading}
        />
      </div>
      
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Signing In...' : 'Sign In'}
      </Button>
      
      <div className="text-sm text-gray-600 text-center mt-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="mb-2 text-yellow-800 font-medium">⚠️ Demo Mode - Backend Stubs</p>
          <div className="space-y-1 text-xs text-yellow-700">
            <p>This is a frontend demo with placeholder backend.</p>
            <p>Enter any email/password to simulate login:</p>
            <p><strong>Admin:</strong> Any email containing "admin"</p>
            <p><strong>Staff:</strong> Any other email address</p>
          </div>
        </div>
      </div>
    </form>
  );
}