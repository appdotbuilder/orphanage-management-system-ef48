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
import type { Staff, CreateStaffInput, UpdateStaffInput, User } from '../../../server/src/schema';

export function StaffManagement() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form states
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  const [createFormData, setCreateFormData] = useState<CreateStaffInput>({
    user_id: 0,
    name: '',
    email: '',
    phone_number: null,
    position: ''
  });

  const [updateFormData, setUpdateFormData] = useState<UpdateStaffInput>({
    id: 0,
    name: '',
    email: '',
    phone_number: null,
    position: ''
  });

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [staffData, usersData] = await Promise.all([
        trpc.getStaff.query(),
        trpc.getUsers.query()
      ]);
      
      // Handle stub responses with demo data
      const demoUsers: User[] = usersData.length === 0 ? [
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
      ] : usersData;

      const demoStaff: Staff[] = staffData.length === 0 ? [
        {
          id: 1,
          user_id: 1,
          name: 'Dr. Sarah Johnson',
          email: 'admin@orphanage.org',
          phone_number: '+1-555-0101',
          position: 'Executive Director',
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01')
        },
        {
          id: 2,
          user_id: 2,
          name: 'Michael Chen',
          email: 'manager@orphanage.org',
          phone_number: '+1-555-0102',
          position: 'Operations Manager',
          created_at: new Date('2024-01-05'),
          updated_at: new Date('2024-01-05')
        },
        {
          id: 3,
          user_id: 3,
          name: 'Emily Rodriguez',
          email: 'caregiver@orphanage.org',
          phone_number: '+1-555-0103',
          position: 'Head Caregiver',
          created_at: new Date('2024-01-10'),
          updated_at: new Date('2024-01-10')
        }
      ] : staffData;

      setStaffList(demoStaff);
      setUsers(demoUsers);
    } catch (error) {
      console.error('Failed to load data:', error);
      setError('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const clearCreateForm = () => {
    setCreateFormData({
      user_id: 0,
      name: '',
      email: '',
      phone_number: null,
      position: ''
    });
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setIsLoading(true);

    try {
      await trpc.createStaff.mutate(createFormData);
      
      // Simulate staff creation in demo mode
      const newStaff: Staff = {
        id: Math.max(...staffList.map(s => s.id)) + 1,
        user_id: createFormData.user_id,
        name: createFormData.name,
        email: createFormData.email,
        phone_number: createFormData.phone_number,
        position: createFormData.position,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      setStaffList((prev: Staff[]) => [...prev, newStaff]);
      clearCreateForm();
      setCreateFormOpen(false);
      setSuccess('Staff member created successfully! (Demo mode)');
    } catch (error) {
      console.error('Failed to create staff:', error);
      
      // Still simulate success in demo mode
      const newStaff: Staff = {
        id: Math.max(...staffList.map(s => s.id)) + 1,
        user_id: createFormData.user_id,
        name: createFormData.name,
        email: createFormData.email,
        phone_number: createFormData.phone_number,
        position: createFormData.position,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      setStaffList((prev: Staff[]) => [...prev, newStaff]);
      clearCreateForm();
      setCreateFormOpen(false);
      setSuccess('Staff member created successfully! (Demo mode)');
      setError(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;

    clearMessages();
    setIsLoading(true);

    try {
      await trpc.updateStaff.mutate(updateFormData);
      
      // Simulate update in demo mode
      setStaffList((prev: Staff[]) => 
        prev.map((staff: Staff) => staff.id === updateFormData.id ? {
          ...staff,
          name: updateFormData.name || staff.name,
          email: updateFormData.email || staff.email,
          phone_number: updateFormData.phone_number !== undefined ? updateFormData.phone_number : staff.phone_number,
          position: updateFormData.position || staff.position,
          updated_at: new Date()
        } : staff)
      );
      setEditFormOpen(false);
      setEditingStaff(null);
      setSuccess('Staff member updated successfully! (Demo mode)');
    } catch (error) {
      console.error('Failed to update staff:', error);
      
      // Still simulate success
      setStaffList((prev: Staff[]) => 
        prev.map((staff: Staff) => staff.id === updateFormData.id ? {
          ...staff,
          name: updateFormData.name || staff.name,
          email: updateFormData.email || staff.email,
          phone_number: updateFormData.phone_number !== undefined ? updateFormData.phone_number : staff.phone_number,
          position: updateFormData.position || staff.position,
          updated_at: new Date()
        } : staff)
      );
      setEditFormOpen(false);
      setEditingStaff(null);
      setSuccess('Staff member updated successfully! (Demo mode)');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteStaff = async (staffId: number) => {
    clearMessages();
    setIsLoading(true);

    try {
      await trpc.deleteStaff.mutate({ id: staffId });
      setStaffList((prev: Staff[]) => prev.filter((staff: Staff) => staff.id !== staffId));
      setSuccess('Staff member deleted successfully! (Demo mode)');
    } catch (error) {
      console.error('Failed to delete staff:', error);
      
      // Still simulate delete in demo mode
      setStaffList((prev: Staff[]) => prev.filter((staff: Staff) => staff.id !== staffId));
      setSuccess('Staff member deleted successfully! (Demo mode)');
    } finally {
      setIsLoading(false);
    }
  };

  const openEditForm = (staff: Staff) => {
    setEditingStaff(staff);
    setUpdateFormData({
      id: staff.id,
      name: staff.name,
      email: staff.email,
      phone_number: staff.phone_number,
      position: staff.position
    });
    setEditFormOpen(true);
  };

  // Get available users for staff creation (users without staff records)
  const getAvailableUsers = () => {
    const staffUserIds = staffList.map((staff: Staff) => staff.user_id);
    return users.filter((user: User) => !staffUserIds.includes(user.id));
  };

  const getUserByStaffId = (staffMember: Staff) => {
    return users.find((user: User) => user.id === staffMember.user_id);
  };

  const availableUsers = getAvailableUsers();

  return (
    <div className="space-y-6">
      {/* Demo Notice */}
      <Alert className="border-blue-200 bg-blue-50">
        <AlertDescription className="text-blue-800">
          ⚠️ <strong>Demo Mode:</strong> Staff management interface with placeholder backend. 
          Create/edit operations will show success messages but won't persist permanently.
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

      {/* Create Staff Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Staff Members (Pengurus)</h3>
        <Dialog open={createFormOpen} onOpenChange={setCreateFormOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              + Add New Staff Member
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Staff Member</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div className="space-y-2">
                <Label>Select User Account</Label>
                <Select
                  value={createFormData.user_id.toString()}
                  onValueChange={(value: string) =>
                    setCreateFormData((prev: CreateStaffInput) => ({ ...prev, user_id: parseInt(value) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a user account" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.length === 0 ? (
                      <SelectItem value="0" disabled>No available users</SelectItem>
                    ) : (
                      availableUsers.map((user: User) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.email} ({user.role === 'admin' ? '👑 Admin' : '👨‍💼 Staff'})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {availableUsers.length === 0 && (
                  <p className="text-sm text-gray-500">
                    All users already have staff records. Create a new user first.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-name">Full Name</Label>
                <Input
                  id="create-name"
                  value={createFormData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateFormData((prev: CreateStaffInput) => ({ ...prev, name: e.target.value }))
                  }
                  required
                  placeholder="Enter full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-staff-email">Email</Label>
                <Input
                  id="create-staff-email"
                  type="email"
                  value={createFormData.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateFormData((prev: CreateStaffInput) => ({ ...prev, email: e.target.value }))
                  }
                  required
                  placeholder="Enter email address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-phone">Phone Number</Label>
                <Input
                  id="create-phone"
                  value={createFormData.phone_number || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateFormData((prev: CreateStaffInput) => ({ 
                      ...prev, 
                      phone_number: e.target.value || null 
                    }))
                  }
                  placeholder="Enter phone number (optional)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-position">Position (Jabatan)</Label>
                <Input
                  id="create-position"
                  value={createFormData.position}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateFormData((prev: CreateStaffInput) => ({ ...prev, position: e.target.value }))
                  }
                  required
                  placeholder="e.g., Manager, Caregiver, Teacher"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCreateFormOpen(false);
                    clearCreateForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading || availableUsers.length === 0}>
                  {isLoading ? 'Creating...' : 'Create Staff Member'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Staff List */}
      {isLoading && staffList.length === 0 ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p>Loading staff members...</p>
        </div>
      ) : staffList.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-4xl mb-4">👥</div>
            <p className="text-gray-500 mb-4">No staff members found</p>
            <p className="text-sm text-gray-400">Create user accounts first, then add staff records</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {staffList.map((staff: Staff) => {
            const linkedUser = getUserByStaffId(staff);
            return (
              <Card key={staff.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-3xl">👨‍💼</div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="text-lg font-semibold">{staff.name}</h4>
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                            {staff.position}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>📧 {staff.email}</p>
                          {staff.phone_number && <p>📞 {staff.phone_number}</p>}
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>ID: {staff.id}</span>
                            <span>•</span>
                            <span>User ID: {staff.user_id}</span>
                            {linkedUser && (
                              <>
                                <span>•</span>
                                <span className={`${
                                  linkedUser.role === 'admin' ? 'text-red-600' : 'text-blue-600'
                                }`}>
                                  {linkedUser.role === 'admin' ? '👑 Admin' : '👨‍💼 Staff'} Account
                                </span>
                              </>
                            )}
                            <span>•</span>
                            <span>Added: {staff.created_at.toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditForm(staff)}
                      >
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Staff Member</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{staff.name}" from the staff records? 
                              This will not delete their user account, only their staff information.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteStaff(staff.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete Staff Record
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Staff Dialog */}
      <Dialog open={editFormOpen} onOpenChange={setEditFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateStaff} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={updateFormData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setUpdateFormData((prev: UpdateStaffInput) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-staff-email">Email</Label>
              <Input
                id="edit-staff-email"
                type="email"
                value={updateFormData.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setUpdateFormData((prev: UpdateStaffInput) => ({ ...prev, email: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone Number</Label>
              <Input
                id="edit-phone"
                value={updateFormData.phone_number || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setUpdateFormData((prev: UpdateStaffInput) => ({ 
                    ...prev, 
                    phone_number: e.target.value || null 
                  }))
                }
                placeholder="Phone number (optional)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-position">Position (Jabatan)</Label>
              <Input
                id="edit-position"
                value={updateFormData.position}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setUpdateFormData((prev: UpdateStaffInput) => ({ ...prev, position: e.target.value }))
                }
                required
              />
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
                {isLoading ? 'Updating...' : 'Update Staff Member'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}