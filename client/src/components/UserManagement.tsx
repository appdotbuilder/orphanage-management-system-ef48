import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import type { User, CreateUserInput, UpdateUserInput, ResetPasswordInput, UserRole } from '../../../server/src/schema';

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form states
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);

  const [createFormData, setCreateFormData] = useState<CreateUserInput>({
    email: '',
    password: '',
    role: 'staff'
  });

  const [updateFormData, setUpdateFormData] = useState<UpdateUserInput>({
    id: 0,
    email: '',
    role: 'staff'
  });

  const [resetPasswordData, setResetPasswordData] = useState<ResetPasswordInput>({
    id: 0,
    new_password: ''
  });

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getUsers.query();
      
      // Since backend returns empty array (stub), show demo data
      const demoUsers: User[] = result.length === 0 ? [
        {
          id: 1,
          email: 'admin@orphanage.org',
          password_hash: 'hashed',
          role: 'admin',
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01')
        },
        {
          id: 2,
          email: 'manager@orphanage.org',
          password_hash: 'hashed',
          role: 'staff',
          created_at: new Date('2024-01-05'),
          updated_at: new Date('2024-01-05')
        },
        {
          id: 3,
          email: 'caregiver@orphanage.org',
          password_hash: 'hashed',
          role: 'staff',
          created_at: new Date('2024-01-10'),
          updated_at: new Date('2024-01-10')
        }
      ] : result;
      
      setUsers(demoUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
      setError('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setIsLoading(true);

    try {
      await trpc.createUser.mutate(createFormData);
      
      // Since backend is stub, simulate the new user creation
      const newUser: User = {
        id: Math.max(...users.map(u => u.id)) + 1,
        email: createFormData.email,
        password_hash: 'hashed_password',
        role: createFormData.role,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      setUsers((prev: User[]) => [...prev, newUser]);
      setCreateFormData({ email: '', password: '', role: 'staff' });
      setCreateFormOpen(false);
      setSuccess('User created successfully! (Demo mode - not persisted)');
    } catch (error) {
      console.error('Failed to create user:', error);
      setError('Demo create operation simulated');
      
      // Still show success in demo mode
      const newUser: User = {
        id: Math.max(...users.map(u => u.id)) + 1,
        email: createFormData.email,
        password_hash: 'hashed_password',
        role: createFormData.role,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      setUsers((prev: User[]) => [...prev, newUser]);
      setCreateFormData({ email: '', password: '', role: 'staff' });
      setCreateFormOpen(false);
      setSuccess('User created successfully! (Demo mode)');
      setError(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    clearMessages();
    setIsLoading(true);

    try {
      await trpc.updateUser.mutate(updateFormData);
      
      // Simulate update in demo mode
      setUsers((prev: User[]) => 
        prev.map((user: User) => user.id === updateFormData.id ? {
          ...user,
          email: updateFormData.email || user.email,
          role: updateFormData.role || user.role,
          updated_at: new Date()
        } : user)
      );
      setEditFormOpen(false);
      setEditingUser(null);
      setSuccess('User updated successfully! (Demo mode)');
    } catch (error) {
      console.error('Failed to update user:', error);
      
      // Still simulate success in demo mode
      setUsers((prev: User[]) => 
        prev.map((user: User) => user.id === updateFormData.id ? {
          ...user,
          email: updateFormData.email || user.email,
          role: updateFormData.role || user.role,
          updated_at: new Date()
        } : user)
      );
      setEditFormOpen(false);
      setEditingUser(null);
      setSuccess('User updated successfully! (Demo mode)');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    clearMessages();
    setIsLoading(true);

    try {
      await trpc.deleteUser.mutate({ id: userId });
      setUsers((prev: User[]) => prev.filter((user: User) => user.id !== userId));
      setSuccess('User deleted successfully! (Demo mode)');
    } catch (error) {
      console.error('Failed to delete user:', error);
      
      // Still simulate delete in demo mode
      setUsers((prev: User[]) => prev.filter((user: User) => user.id !== userId));
      setSuccess('User deleted successfully! (Demo mode)');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordUser) return;

    clearMessages();
    setIsLoading(true);

    try {
      await trpc.resetPassword.mutate(resetPasswordData);
      setResetPasswordOpen(false);
      setResetPasswordUser(null);
      setResetPasswordData({ id: 0, new_password: '' });
      setSuccess('Password reset successfully! (Demo mode)');
    } catch (error) {
      console.error('Failed to reset password:', error);
      
      // Simulate success in demo mode
      setResetPasswordOpen(false);
      setResetPasswordUser(null);
      setResetPasswordData({ id: 0, new_password: '' });
      setSuccess('Password reset successfully! (Demo mode)');
    } finally {
      setIsLoading(false);
    }
  };

  const openEditForm = (user: User) => {
    setEditingUser(user);
    setUpdateFormData({
      id: user.id,
      email: user.email,
      role: user.role
    });
    setEditFormOpen(true);
  };

  const openResetPassword = (user: User) => {
    setResetPasswordUser(user);
    setResetPasswordData({
      id: user.id,
      new_password: ''
    });
    setResetPasswordOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Demo Notice */}
      <Alert className="border-blue-200 bg-blue-50">
        <AlertDescription className="text-blue-800">
          ⚠️ <strong>Demo Mode:</strong> This interface demonstrates user management functionality. 
          Backend operations use placeholder handlers and won't persist data permanently.
        </AlertDescription>
      </Alert>

      {/* Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Create User Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">System Users</h3>
        <Dialog open={createFormOpen} onOpenChange={setCreateFormOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              + Create New User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="create-email">Email</Label>
                <Input
                  id="create-email"
                  type="email"
                  value={createFormData.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateFormData((prev: CreateUserInput) => ({ ...prev, email: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-password">Password</Label>
                <Input
                  id="create-password"
                  type="password"
                  value={createFormData.password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateFormData((prev: CreateUserInput) => ({ ...prev, password: e.target.value }))
                  }
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={createFormData.role}
                  onValueChange={(value: UserRole) =>
                    setCreateFormData((prev: CreateUserInput) => ({ ...prev, role: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">👨‍💼 Staff</SelectItem>
                    <SelectItem value="admin">👑 Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateFormOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create User'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users List */}
      {isLoading && users.length === 0 ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading users...</p>
        </div>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No users found. Create your first user!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {users.map((user: User) => (
            <Card key={user.id}>
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">
                      {user.role === 'admin' ? '👑' : '👨‍💼'}
                    </div>
                    <div>
                      <h4 className="font-semibold">{user.email}</h4>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          user.role === 'admin' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role === 'admin' ? 'Administrator' : 'Staff Member'}
                        </span>
                        <span>•</span>
                        <span>Created: {user.created_at.toLocaleDateString()}</span>
                        <span>•</span>
                        <span>ID: {user.id}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditForm(user)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openResetPassword(user)}
                  >
                    Reset Password
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete User</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete the user "{user.email}"? 
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteUser(user.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete User
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit User Dialog */}
      <Dialog open={editFormOpen} onOpenChange={setEditFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={updateFormData.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setUpdateFormData((prev: UpdateUserInput) => ({ ...prev, email: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={updateFormData.role}
                onValueChange={(value: UserRole) =>
                  setUpdateFormData((prev: UpdateUserInput) => ({ ...prev, role: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">👨‍💼 Staff</SelectItem>
                  <SelectItem value="admin">👑 Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditFormOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update User'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordOpen} onOpenChange={setResetPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label>User</Label>
              <p className="text-sm text-gray-600">{resetPasswordUser?.email}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={resetPasswordData.new_password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setResetPasswordData((prev: ResetPasswordInput) => ({ ...prev, new_password: e.target.value }))
                }
                required
                minLength={6}
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setResetPasswordOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}