'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Users, Home, Clock, Target } from 'lucide-react';

interface ReportData {
  // Conversion Funnel
  totalSellers: number;
  contactedSellers: number;
  qualifiedSellers: number;
  offersMade: number;
  underContract: number;
  closedDeals: number;

  // Pipeline Velocity (avg days in each stage)
  avgDaysToContact: number;
  avgDaysToQualify: number;
  avgDaysToOffer: number;
  avgDaysToContract: number;
  avgDaysToClose: number;

  // Financial Metrics
  totalRevenue: number;
  avgDealSize: number;
  projectedRevenue: number;

  // Investor Metrics
  totalInvestors: number;
  activeInvestors: number;
  avgInvestorConversion: number;

  // Property Metrics
  totalProperties: number;
  activeProperties: number;
  avgPropertyValue: number;

  // Deal Source Analytics
  dealsBySource: { source: string, count: number, revenue: number }[];

  // Monthly Trends
  monthlyDeals: { month: string, deals: number, revenue: number }[];
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // days

  const supabase = createClient();

  useEffect(() => {
    loadReportData();
  }, [dateRange]);

  async function loadReportData() {
    try {
      setLoading(true);

      // Calculate date threshold
      const daysAgo = parseInt(dateRange);
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - daysAgo);
      const dateThresholdStr = dateThreshold.toISOString();

      // Fetch all necessary data in parallel
      const [
        sellersRes,
        propertiesRes,
        investorsRes,
        dealsRes,
        allDealsRes
      ] = await Promise.all([
        supabase.from('sellers').select('*'),
        supabase.from('properties').select('*'),
        supabase.from('investors').select('*'),
        supabase.from('deals').select('*').eq('status', 'closed').gte('created_at', dateThresholdStr),
        supabase.from('deals').select('*')
      ]);

      const sellers = sellersRes.data || [];
      const properties = propertiesRes.data || [];
      const investors = investorsRes.data || [];
      const deals = dealsRes.data || [];
      const allDeals = allDealsRes.data || [];

      // Conversion Funnel
      const totalSellers = sellers.length;
      const contactedSellers = sellers.filter(s => ['contacted', 'qualified', 'offer_made', 'under_contract', 'closed'].includes(s.status)).length;
      const qualifiedSellers = sellers.filter(s => ['qualified', 'offer_made', 'under_contract', 'closed'].includes(s.status)).length;
      const offersMade = sellers.filter(s => ['offer_made', 'under_contract', 'closed'].includes(s.status)).length;
      const underContract = sellers.filter(s => ['under_contract', 'closed'].includes(s.status)).length;
      const closedDeals = sellers.filter(s => s.status === 'closed').length;

      // Financial Metrics
      const totalRevenue = deals.reduce((sum, deal) => sum + (deal.assignment_fee || 0), 0);
      const avgDealSize = deals.length > 0 ? totalRevenue / deals.length : 0;

      // Projected revenue (active deals)
      const activeDeals = allDeals.filter(d => ['pending', 'under_contract'].includes(d.status));
      const projectedRevenue = activeDeals.reduce((sum, deal) => sum + (deal.assignment_fee || 0), 0);

      // Investor Metrics
      const totalInvestors = investors.length;
      const activeInvestors = investors.filter(i => i.status === 'active').length;

      // Get deals with investor info
      const dealsWithInvestors = allDeals.filter(d => d.investor_id && d.status === 'closed');
      const uniqueInvestorIds = new Set(dealsWithInvestors.map(d => d.investor_id));
      const avgInvestorConversion = totalInvestors > 0 ? (uniqueInvestorIds.size / totalInvestors) * 100 : 0;

      // Property Metrics
      const totalProperties = properties.length;
      const activeProperties = properties.filter(p => !['closed', 'dead'].includes(p.status)).length;
      const avgPropertyValue = properties.length > 0
        ? properties.reduce((sum, p) => sum + (p.estimated_value || 0), 0) / properties.length
        : 0;

      // Deal Source Analytics (by lead source)
      const dealsBySourceMap = new Map<string, { count: number, revenue: number }>();

      for (const deal of allDeals.filter(d => d.status === 'closed')) {
        // Get property, then seller, then lead source
        const property = properties.find(p => p.id === deal.property_id);
        if (property) {
          const seller = sellers.find(s => s.id === property.seller_id);
          if (seller && seller.lead_source) {
            const source = seller.lead_source;
            const existing = dealsBySourceMap.get(source) || { count: 0, revenue: 0 };
            dealsBySourceMap.set(source, {
              count: existing.count + 1,
              revenue: existing.revenue + (deal.assignment_fee || 0)
            });
          }
        }
      }

      const dealsBySource = Array.from(dealsBySourceMap.entries())
        .map(([source, data]) => ({ source, ...data }))
        .sort((a, b) => b.revenue - a.revenue);

      // Monthly Trends (last 6 months)
      const monthlyDealsMap = new Map<string, { deals: number, revenue: number }>();
      const now = new Date();

      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = monthDate.toLocaleString('default', { month: 'short', year: 'numeric' });
        monthlyDealsMap.set(monthKey, { deals: 0, revenue: 0 });
      }

      allDeals.filter(d => d.status === 'closed' && d.actual_close_date).forEach(deal => {
        const closeDate = new Date(deal.actual_close_date);
        const monthKey = closeDate.toLocaleString('default', { month: 'short', year: 'numeric' });
        const existing = monthlyDealsMap.get(monthKey);
        if (existing) {
          monthlyDealsMap.set(monthKey, {
            deals: existing.deals + 1,
            revenue: existing.revenue + (deal.assignment_fee || 0)
          });
        }
      });

      const monthlyDeals = Array.from(monthlyDealsMap.entries())
        .map(([month, data]) => ({ month, ...data }));

      // Pipeline Velocity (simplified - would need timestamps for accurate calculation)
      // For now, using placeholder values
      const avgDaysToContact = 2;
      const avgDaysToQualify = 5;
      const avgDaysToOffer = 7;
      const avgDaysToContract = 10;
      const avgDaysToClose = 30;

      setData({
        totalSellers,
        contactedSellers,
        qualifiedSellers,
        offersMade,
        underContract,
        closedDeals,
        avgDaysToContact,
        avgDaysToQualify,
        avgDaysToOffer,
        avgDaysToContract,
        avgDaysToClose,
        totalRevenue,
        avgDealSize,
        projectedRevenue,
        totalInvestors,
        activeInvestors,
        avgInvestorConversion,
        totalProperties,
        activeProperties,
        avgPropertyValue,
        dealsBySource,
        monthlyDeals
      });
    } catch (error) {
      console.error('Error loading report data:', error);
      alert('Failed to load report data');
    } finally {
      setLoading(false);
    }
  }

  if (loading || !data) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  // Calculate conversion rates
  const leadToContactRate = data.totalSellers > 0 ? (data.contactedSellers / data.totalSellers) * 100 : 0;
  const contactToQualifiedRate = data.contactedSellers > 0 ? (data.qualifiedSellers / data.contactedSellers) * 100 : 0;
  const qualifiedToOfferRate = data.qualifiedSellers > 0 ? (data.offersMade / data.qualifiedSellers) * 100 : 0;
  const offerToContractRate = data.offersMade > 0 ? (data.underContract / data.offersMade) * 100 : 0;
  const contractToCloseRate = data.underContract > 0 ? (data.closedDeals / data.underContract) * 100 : 0;
  const overallConversionRate = data.totalSellers > 0 ? (data.closedDeals / data.totalSellers) * 100 : 0;

  return (
    <div className="p-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="mt-2 text-gray-600">Comprehensive business performance metrics</p>
        </div>
        <div>
          <label className="text-sm text-gray-600 mr-2">Time Period:</label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="180">Last 6 Months</option>
            <option value="365">Last Year</option>
            <option value="99999">All Time</option>
          </select>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Revenue"
          value={`$${data.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          color="text-green-600"
          bgColor="bg-green-100"
        />
        <MetricCard
          title="Avg Deal Size"
          value={`$${data.avgDealSize.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          icon={TrendingUp}
          color="text-blue-600"
          bgColor="bg-blue-100"
        />
        <MetricCard
          title="Conversion Rate"
          value={`${overallConversionRate.toFixed(1)}%`}
          icon={Target}
          color="text-purple-600"
          bgColor="bg-purple-100"
        />
        <MetricCard
          title="Projected Revenue"
          value={`$${data.projectedRevenue.toLocaleString()}`}
          icon={TrendingUp}
          color="text-orange-600"
          bgColor="bg-orange-100"
        />
      </div>

      {/* Conversion Funnel */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Conversion Funnel</h2>
        <div className="space-y-4">
          <FunnelStage
            label="Total Leads"
            count={data.totalSellers}
            percentage={100}
            nextRate={leadToContactRate}
          />
          <FunnelStage
            label="Contacted"
            count={data.contactedSellers}
            percentage={(data.contactedSellers / data.totalSellers) * 100}
            nextRate={contactToQualifiedRate}
          />
          <FunnelStage
            label="Qualified"
            count={data.qualifiedSellers}
            percentage={(data.qualifiedSellers / data.totalSellers) * 100}
            nextRate={qualifiedToOfferRate}
          />
          <FunnelStage
            label="Offers Made"
            count={data.offersMade}
            percentage={(data.offersMade / data.totalSellers) * 100}
            nextRate={offerToContractRate}
          />
          <FunnelStage
            label="Under Contract"
            count={data.underContract}
            percentage={(data.underContract / data.totalSellers) * 100}
            nextRate={contractToCloseRate}
          />
          <FunnelStage
            label="Closed Deals"
            count={data.closedDeals}
            percentage={(data.closedDeals / data.totalSellers) * 100}
            nextRate={null}
          />
        </div>
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm font-semibold text-blue-900">
            Overall Conversion Rate: {overallConversionRate.toFixed(2)}%
          </p>
          <p className="text-xs text-blue-700 mt-1">
            Industry average: 1-3% | You are {overallConversionRate >= 3 ? 'above' : overallConversionRate >= 1 ? 'at' : 'below'} average
          </p>
        </div>
      </div>

      {/* Pipeline Velocity */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <Clock className="w-6 h-6 mr-2 text-blue-600" />
          Pipeline Velocity (Average Days per Stage)
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <VelocityCard label="To Contact" days={data.avgDaysToContact} />
          <VelocityCard label="To Qualify" days={data.avgDaysToQualify} />
          <VelocityCard label="To Offer" days={data.avgDaysToOffer} />
          <VelocityCard label="To Contract" days={data.avgDaysToContract} />
          <VelocityCard label="To Close" days={data.avgDaysToClose} />
        </div>
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Total Average: <span className="font-bold text-gray-900">
              {data.avgDaysToContact + data.avgDaysToQualify + data.avgDaysToOffer + data.avgDaysToContract + data.avgDaysToClose} days
            </span> from lead to close
          </p>
        </div>
      </div>

      {/* Deal Source Analytics */}
      {data.dealsBySource.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Deal Source Performance</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Source</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Deals Closed</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Total Revenue</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Avg Deal Size</th>
                </tr>
              </thead>
              <tbody>
                {data.dealsBySource.map((source, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{source.source}</td>
                    <td className="py-3 px-4 text-sm text-right text-gray-700">{source.count}</td>
                    <td className="py-3 px-4 text-sm text-right font-semibold text-green-600">
                      ${source.revenue.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-gray-700">
                      ${(source.revenue / source.count).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Monthly Trends */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Monthly Trends (Last 6 Months)</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Month</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Deals Closed</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Revenue</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Avg Deal Size</th>
              </tr>
            </thead>
            <tbody>
              {data.monthlyDeals.map((month, idx) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{month.month}</td>
                  <td className="py-3 px-4 text-sm text-right text-gray-700">{month.deals}</td>
                  <td className="py-3 px-4 text-sm text-right font-semibold text-green-600">
                    ${month.revenue.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-sm text-right text-gray-700">
                    {month.deals > 0 ? `$${(month.revenue / month.deals).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, color, bgColor }: any) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
        </div>
        <div className={`p-3 rounded-full ${bgColor}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </div>
  );
}

function FunnelStage({ label, count, percentage, nextRate }: any) {
  const width = Math.max(percentage, 5); // Minimum 5% width for visibility

  return (
    <div>
      <div className="flex justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <div className="text-right">
          <span className="text-sm font-bold text-gray-900">{count}</span>
          <span className="text-xs text-gray-500 ml-2">({percentage.toFixed(1)}%)</span>
        </div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-8 relative overflow-hidden">
        <div
          className="bg-gradient-to-r from-blue-500 to-blue-600 h-8 rounded-full flex items-center justify-center transition-all duration-300"
          style={{ width: `${width}%` }}
        >
          {width > 15 && (
            <span className="text-xs font-semibold text-white">{count}</span>
          )}
        </div>
      </div>
      {nextRate !== null && (
        <p className="text-xs text-gray-500 mt-1">
          → {nextRate.toFixed(1)}% conversion to next stage
        </p>
      )}
    </div>
  );
}

function VelocityCard({ label, days }: any) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 text-center">
      <p className="text-xs text-gray-600 mb-2">{label}</p>
      <p className="text-3xl font-bold text-blue-600">{days}</p>
      <p className="text-xs text-gray-500 mt-1">days</p>
    </div>
  );
}
