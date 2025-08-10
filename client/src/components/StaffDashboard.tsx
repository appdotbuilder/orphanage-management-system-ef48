import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '../App';
import { DashboardOverview } from '@/components/DashboardOverview';

export function StaffDashboard() {
  const { staff } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Staff Dashboard</h2>
          <p className="text-gray-600 mt-1">Welcome back, {staff?.name}</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Staff Member</div>
          <div className="text-lg font-semibold text-green-600">{staff?.position}</div>
        </div>
      </div>

      <div className="grid gap-6">
        <DashboardOverview isStaffView />
        
        <Card className="card-warm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gradient">
              👤 My Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {staff ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Name</label>
                  <p className="font-semibold">{staff.name}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="font-semibold">{staff.email}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Phone Number</label>
                  <p className="font-semibold">{staff.phone_number || 'Not provided'}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Position</label>
                  <p className="font-semibold">{staff.position}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Member Since</label>
                  <p className="font-semibold">{staff.created_at.toLocaleDateString()}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No staff profile found</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="card-warm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gradient">
              📝 Staff Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Welcome to the Orphanage Management System!</h4>
              <p className="text-blue-800 text-sm mb-2">
                As a staff member, you have access to view system information and your profile details.
              </p>
              <p className="text-blue-700 text-sm">
                For administrative tasks like creating users or managing other staff members, 
                please contact your administrator.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}