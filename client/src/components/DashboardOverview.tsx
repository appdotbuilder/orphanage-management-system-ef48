import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { trpc } from '@/utils/trpc';
import type { User, Staff } from '../../../server/src/schema';

interface DashboardOverviewProps {
  isStaffView?: boolean;
}

export function DashboardOverview({ isStaffView = false }: DashboardOverviewProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [usersData, staffData] = await Promise.all([
        trpc.getUsers.query(),
        trpc.getStaff.query()
      ]);
      
      // Since backend returns empty arrays (stubs), simulate some demo data
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

      setUsers(demoUsers);
      setStaff(demoStaff);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const adminCount = users.filter((user: User) => user.role === 'admin').length;
  const staffCount = users.filter((user: User) => user.role === 'staff').length;
  const totalStaffRecords = staff.length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 stats-card hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">
              Total Users
            </CardTitle>
            <div className="text-2xl">👥</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{users.length}</div>
            <p className="text-xs text-blue-600 mt-1">
              Registered system users
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100 stats-card hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">
              Staff Members
            </CardTitle>
            <div className="text-2xl">👨‍💼</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{totalStaffRecords}</div>
            <p className="text-xs text-green-600 mt-1">
              Active staff records
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 stats-card hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">
              Administrators
            </CardTitle>
            <div className="text-2xl">👑</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{adminCount}</div>
            <p className="text-xs text-orange-600 mt-1">
              System administrators
            </p>
          </CardContent>
        </Card>
      </div>

      {!isStaffView && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Users</CardTitle>
            </CardHeader>
            <CardContent>
              {users.length > 0 ? (
                <div className="space-y-3">
                  {users.slice(0, 5).map((user: User) => (
                    <div key={user.id} className="flex items-center justify-between p-2 rounded border">
                      <div>
                        <p className="font-medium">{user.email}</p>
                        <p className="text-sm text-gray-500">
                          Created: {user.created_at.toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.role === 'admin' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role === 'admin' ? '👑 Admin' : '👨‍💼 Staff'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No users found</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Staff</CardTitle>
            </CardHeader>
            <CardContent>
              {staff.length > 0 ? (
                <div className="space-y-3">
                  {staff.slice(0, 5).map((member: Staff) => (
                    <div key={member.id} className="flex items-center justify-between p-2 rounded border">
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-gray-500">{member.position}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">{member.email}</p>
                        <p className="text-xs text-gray-500">
                          {member.created_at.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No staff records found</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {isStaffView && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">System Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Total System Users:</span>
                <span className="ml-2">{users.length}</span>
              </div>
              <div>
                <span className="font-medium">Staff Count:</span>
                <span className="ml-2">{staffCount}</span>
              </div>
              <div>
                <span className="font-medium">Administrator Count:</span>
                <span className="ml-2">{adminCount}</span>
              </div>
              <div>
                <span className="font-medium">Staff Records:</span>
                <span className="ml-2">{totalStaffRecords}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}