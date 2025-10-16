'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Home,
  Briefcase,
  CheckSquare,
  TrendingUp,
  Settings,
  FileText,
  LogOut,
  MessageCircle,
  Calculator,
  BarChart3,
  Mail,
  PieChart,
  Send,
  Zap,
} from 'lucide-react';
import { useAuth } from './AuthProvider';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Sellers', href: '/sellers', icon: Users },
  { name: 'Properties', href: '/properties', icon: Home },
  { name: 'Investors', href: '/investors', icon: Briefcase },
  { name: 'Deals', href: '/deals', icon: TrendingUp },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Calendar', href: '/calendar', icon: CheckSquare },
  { name: 'Activities', href: '/activities', icon: MessageCircle },
  { name: 'Communications', href: '/communications', icon: Mail },
  { name: 'Broadcast', href: '/broadcast', icon: Send },
  { name: 'Automations', href: '/automations', icon: Zap },
  { name: 'Contracts', href: '/contracts', icon: FileText },
  { name: 'Calculators', href: '/calculators', icon: Calculator },
  { name: 'Marketing', href: '/marketing', icon: BarChart3 },
  { name: 'Reports', href: '/reports', icon: PieChart },
  { name: 'Documents', href: '/documents', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { signOut } = useAuth();

  return (
    <div className="flex flex-col w-64 bg-gray-900 h-screen">
      <div className="flex items-center justify-center h-16 bg-gray-800 flex-shrink-0">
        <h1 className="text-xl font-bold text-white">Wholesale CRM</h1>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-800 flex-shrink-0">
        <button
          onClick={() => signOut()}
          className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-300 rounded-lg hover:bg-gray-800 hover:text-white transition-colors mb-3"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Sign Out
        </button>
        <div className="text-xs text-gray-400">
          <p>Pinnacle Realty Partners</p>
          <p className="mt-1">v2.0.0</p>
        </div>
      </div>
    </div>
  );
}
