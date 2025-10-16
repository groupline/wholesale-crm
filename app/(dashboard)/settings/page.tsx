'use client';

import { useState } from 'react';
import { User, Bell, Shield, Database, Save } from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'security' | 'data'>('profile');
  const [saved, setSaved] = useState(false);

  const [profileData, setProfileData] = useState({
    name: 'Admin User',
    email: 'admin@pinnacle.com',
    phone: '(555) 123-4567',
    company: 'Pinnacle Realty Partners'
  });

  const [notifData, setNotifData] = useState({
    emailNotif: true,
    smsNotif: false,
    taskReminders: true,
    dealUpdates: true,
    weeklyReport: false
  });

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    alert('Settings saved successfully!');
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Configure your CRM preferences</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-4">
          {[
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'security', label: 'Security', icon: Shield },
            { id: 'data', label: 'Data', icon: Database }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 px-1 border-b-2 font-medium transition-colors flex items-center gap-2 ${
                activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Settings</h2>
          <div className="space-y-4 max-w-2xl">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input type="text" value={profileData.name} onChange={(e) => setProfileData({...profileData, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input type="email" value={profileData.email} onChange={(e) => setProfileData({...profileData, email: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input type="tel" value={profileData.phone} onChange={(e) => setProfileData({...profileData, phone: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
              <input type="text" value={profileData.company} onChange={(e) => setProfileData({...profileData, company: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <button onClick={handleSave} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 mt-6">
              <Save className="w-4 h-4" />Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Notification Preferences</h2>
          <div className="space-y-4 max-w-2xl">
            {[
              { key: 'emailNotif', label: 'Email Notifications', desc: 'Receive notifications via email' },
              { key: 'smsNotif', label: 'SMS Notifications', desc: 'Receive notifications via text message' },
              { key: 'taskReminders', label: 'Task Reminders', desc: 'Get reminders for upcoming tasks' },
              { key: 'dealUpdates', label: 'Deal Updates', desc: 'Notifications when deal status changes' },
              { key: 'weeklyReport', label: 'Weekly Summary Report', desc: 'Receive weekly performance summary' }
            ].map(item => (
              <div key={item.key} className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg">
                <input type="checkbox" checked={notifData[item.key as keyof typeof notifData]} onChange={(e) => setNotifData({...notifData, [item.key]: e.target.checked})} className="mt-1 w-4 h-4 text-blue-600 rounded" />
                <div>
                  <div className="font-medium text-gray-900">{item.label}</div>
                  <div className="text-sm text-gray-600">{item.desc}</div>
                </div>
              </div>
            ))}
            <button onClick={handleSave} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 mt-6">
              <Save className="w-4 h-4" />Save Preferences
            </button>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Security Settings</h2>
          <div className="space-y-6 max-w-2xl">
            <div>
              <h3 className="font-medium text-gray-900 mb-4">Change Password</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                  <input type="password" className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="••••••••" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                  <input type="password" className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="••••••••" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                  <input type="password" className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="••••••••" />
                </div>
              </div>
            </div>
            <div className="border-t pt-6">
              <h3 className="font-medium text-gray-900 mb-2">Two-Factor Authentication</h3>
              <p className="text-sm text-gray-600 mb-4">Add an extra layer of security to your account</p>
              <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 text-sm">Enable 2FA</button>
            </div>
            <button onClick={handleSave} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
              <Save className="w-4 h-4" />Update Security
            </button>
          </div>
        </div>
      )}

      {/* Data Tab */}
      {activeTab === 'data' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Data Management</h2>
          <div className="space-y-6 max-w-2xl">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Export Data</h3>
              <p className="text-sm text-gray-600 mb-4">Download all your CRM data in CSV format</p>
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm">Export to CSV</button>
            </div>
            <div className="border-t pt-6">
              <h3 className="font-medium text-gray-900 mb-2">Storage Usage</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">Documents:</span><span className="font-medium">245 MB</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Database Records:</span><span className="font-medium">1,234 records</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Total Storage Used:</span><span className="font-medium">245 MB / 5 GB</span></div>
              </div>
            </div>
            <div className="border-t pt-6">
              <h3 className="font-medium text-red-600 mb-2">Danger Zone</h3>
              <p className="text-sm text-gray-600 mb-4">Permanently delete all data and close account</p>
              <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm">Delete Account</button>
            </div>
          </div>
        </div>
      )}

      {saved && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg">
          ✓ Settings saved successfully
        </div>
      )}
    </div>
  );
}
