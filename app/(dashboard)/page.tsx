import { createClient } from '@/lib/supabase-server';
import { Users, Home, Briefcase, TrendingUp, DollarSign, Clock } from 'lucide-react';

async function getDashboardStats() {
  const supabase = await createClient();

  // Initialize with zeros - tables may not exist yet
  let stats = {
    sellersCount: 0,
    propertiesCount: 0,
    investorsCount: 0,
    activeDealsCount: 0,
    closedDealsCount: 0,
    totalRevenue: 0
  };

  try {
    const [
      { count: sellersCount },
      { count: propertiesCount },
      { count: investorsCount },
      { count: activeDealsCount },
      { count: closedDealsCount }
    ] = await Promise.all([
      supabase.from('sellers').select('*', { count: 'exact', head: true }),
      supabase.from('properties').select('*', { count: 'exact', head: true }),
      supabase.from('investors').select('*', { count: 'exact', head: true }),
      supabase.from('deals').select('*', { count: 'exact', head: true }).in('status', ['pending', 'under_contract']),
      supabase.from('deals').select('*', { count: 'exact', head: true }).eq('status', 'closed')
    ]);

    // Get recent deals for revenue calculation
    const { data: closedDeals } = await supabase
      .from('deals')
      .select('assignment_fee')
      .eq('status', 'closed');

    const totalRevenue = closedDeals?.reduce((sum, deal) => sum + (deal.assignment_fee || 0), 0) || 0;

    stats = {
      sellersCount: sellersCount || 0,
      propertiesCount: propertiesCount || 0,
      investorsCount: investorsCount || 0,
      activeDealsCount: activeDealsCount || 0,
      closedDealsCount: closedDealsCount || 0,
      totalRevenue
    };
  } catch (error) {
    console.log('Dashboard stats error (tables may not exist yet):', error);
  }

  return stats;
}

export default async function Dashboard() {
  const stats = await getDashboardStats();

  const metrics = [
    { name: 'Total Sellers', value: stats.sellersCount, icon: Users, color: 'bg-blue-500' },
    { name: 'Properties', value: stats.propertiesCount, icon: Home, color: 'bg-green-500' },
    { name: 'Investors', value: stats.investorsCount, icon: Briefcase, color: 'bg-purple-500' },
    { name: 'Active Deals', value: stats.activeDealsCount, icon: Clock, color: 'bg-yellow-500' },
    { name: 'Closed Deals', value: stats.closedDealsCount, icon: TrendingUp, color: 'bg-indigo-500' },
    {
      name: 'Total Revenue',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-emerald-500'
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Welcome to your Wholesale Realty CRM</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => (
          <div
            key={metric.name}
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-center">
                <div className={`flex-shrink-0 rounded-md p-3 ${metric.color}`}>
                  <metric.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {metric.name}
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {metric.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <a
              href="/sellers"
              className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
            >
              <div className="flex items-center">
                <Users className="h-5 w-5 text-blue-500 mr-3" />
                <div>
                  <h3 className="font-medium text-gray-900">Add New Seller</h3>
                  <p className="text-sm text-gray-500">Add a new property seller lead</p>
                </div>
              </div>
            </a>
            <a
              href="/investors"
              className="block p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:shadow-md transition-all"
            >
              <div className="flex items-center">
                <Briefcase className="h-5 w-5 text-purple-500 mr-3" />
                <div>
                  <h3 className="font-medium text-gray-900">Add New Investor</h3>
                  <p className="text-sm text-gray-500">Add an investor to your buyer list</p>
                </div>
              </div>
            </a>
            <a
              href="/properties"
              className="block p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:shadow-md transition-all"
            >
              <div className="flex items-center">
                <Home className="h-5 w-5 text-green-500 mr-3" />
                <div>
                  <h3 className="font-medium text-gray-900">Add New Property</h3>
                  <p className="text-sm text-gray-500">List a new property opportunity</p>
                </div>
              </div>
            </a>
          </div>
        </div>

        {/* Pipeline Overview */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pipeline Overview</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Active Properties</span>
                <span className="font-medium">{stats.propertiesCount}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '70%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Active Deals</span>
                <span className="font-medium">{stats.activeDealsCount}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '50%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Closed Deals</span>
                <span className="font-medium">{stats.closedDealsCount}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '30%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
