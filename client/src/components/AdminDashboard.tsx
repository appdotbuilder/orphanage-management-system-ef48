import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserManagement } from '@/components/UserManagement';
import { StaffManagement } from '@/components/StaffManagement';
import { DashboardOverview } from '@/components/DashboardOverview';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Admin Dashboard</h2>
          <p className="text-gray-600 mt-1">Manage users, staff, and system operations</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Administrator Panel</div>
          <div className="text-lg font-semibold text-blue-600">Full Access</div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            📊 Overview
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            👥 User Management
          </TabsTrigger>
          <TabsTrigger value="staff" className="flex items-center gap-2">
            👨‍💼 Staff Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <DashboardOverview />
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card className="card-warm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gradient">
                👥 User Account Management
              </CardTitle>
              <p className="text-sm text-gray-600">
                Create, update, and manage user accounts and their roles
              </p>
            </CardHeader>
            <CardContent>
              <UserManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff" className="space-y-6">
          <Card className="card-warm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gradient">
                👨‍💼 Staff (Pengurus) Management
              </CardTitle>
              <p className="text-sm text-gray-600">
                Manage staff member records and their information
              </p>
            </CardHeader>
            <CardContent>
              <StaffManagement />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}