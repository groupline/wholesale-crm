'use client';

import { useState } from 'react';
import { Calculator, DollarSign, Home, TrendingUp, Wrench, FileText } from 'lucide-react';

type CalculatorType = 'seventy-rule' | 'profit' | 'cash-on-cash' | 'brrrr' | 'repair-estimator';

export default function CalculatorsPage() {
  const [activeCalculator, setActiveCalculator] = useState<CalculatorType>('seventy-rule');

  const calculators = [
    { id: 'seventy-rule', name: '70% Rule', icon: Home, color: 'bg-blue-500' },
    { id: 'profit', name: 'Profit Calculator', icon: DollarSign, color: 'bg-green-500' },
    { id: 'cash-on-cash', name: 'Cash-on-Cash Return', icon: TrendingUp, color: 'bg-purple-500' },
    { id: 'brrrr', name: 'BRRRR Calculator', icon: Calculator, color: 'bg-orange-500' },
    { id: 'repair-estimator', name: 'Repair Estimator', icon: Wrench, color: 'bg-red-500' }
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Deal Analysis Calculators</h1>
        <p className="mt-2 text-gray-600">Analyze deals quickly with professional calculators</p>
      </div>

      {/* Calculator Tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {calculators.map((calc) => {
          const Icon = calc.icon;
          return (
            <button
              key={calc.id}
              onClick={() => setActiveCalculator(calc.id as CalculatorType)}
              className={`flex items-center px-4 py-3 rounded-lg font-medium text-sm whitespace-nowrap transition ${
                activeCalculator === calc.id
                  ? `${calc.color} text-white shadow-lg`
                  : 'bg-white text-gray-700 hover:bg-gray-50 shadow'
              }`}
            >
              <Icon className="w-5 h-5 mr-2" />
              {calc.name}
            </button>
          );
        })}
      </div>

      {/* Calculator Content */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        {activeCalculator === 'seventy-rule' && <SeventyRuleCalculator />}
        {activeCalculator === 'profit' && <ProfitCalculator />}
        {activeCalculator === 'cash-on-cash' && <CashOnCashCalculator />}
        {activeCalculator === 'brrrr' && <BRRRRCalculator />}
        {activeCalculator === 'repair-estimator' && <RepairEstimator />}
      </div>
    </div>
  );
}

// 70% Rule Calculator
function SeventyRuleCalculator() {
  const [arv, setArv] = useState('');
  const [repairs, setRepairs] = useState('');

  const arvNum = parseFloat(arv) || 0;
  const repairsNum = parseFloat(repairs) || 0;
  const maxOffer = (arvNum * 0.7) - repairsNum;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">70% Rule Calculator</h2>
        <p className="text-gray-600">
          The 70% Rule: Maximum purchase price = (ARV × 70%) - Repair Costs
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Used by wholesalers and fix-and-flip investors to quickly determine maximum acquisition price
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            After Repair Value (ARV)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-gray-500">$</span>
            <input
              type="number"
              value={arv}
              onChange={(e) => setArv(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">Fair market value after all repairs are complete</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estimated Repair Costs
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-gray-500">$</span>
            <input
              type="number"
              value={repairs}
              onChange={(e) => setRepairs(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">Total cost to renovate the property</p>
        </div>
      </div>

      <div className="mt-8 p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
        <div className="text-center">
          <p className="text-sm font-medium text-blue-900 mb-2">Maximum Allowable Offer (MAO)</p>
          <p className="text-4xl font-bold text-blue-600">
            ${maxOffer > 0 ? maxOffer.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '0'}
          </p>
          <p className="mt-3 text-sm text-blue-800">
            This is the maximum you should pay to maintain a 30% profit margin
          </p>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-white rounded">
            <p className="text-xs text-gray-600">ARV × 70%</p>
            <p className="text-lg font-semibold text-gray-900">
              ${(arvNum * 0.7).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="p-3 bg-white rounded">
            <p className="text-xs text-gray-600">Repairs</p>
            <p className="text-lg font-semibold text-gray-900">
              ${repairsNum.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="p-3 bg-white rounded">
            <p className="text-xs text-gray-600">Profit Margin</p>
            <p className="text-lg font-semibold text-green-600">30%</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Profit Calculator
function ProfitCalculator() {
  const [purchasePrice, setPurchasePrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [assignmentFee, setAssignmentFee] = useState('');
  const [closingCosts, setClosingCosts] = useState('');
  const [marketingCosts, setMarketingCosts] = useState('');
  const [otherCosts, setOtherCosts] = useState('');

  const purchase = parseFloat(purchasePrice) || 0;
  const sale = parseFloat(salePrice) || 0;
  const assignment = parseFloat(assignmentFee) || 0;
  const closing = parseFloat(closingCosts) || 0;
  const marketing = parseFloat(marketingCosts) || 0;
  const other = parseFloat(otherCosts) || 0;

  const totalCosts = purchase + closing + marketing + other;
  const grossProfit = sale + assignment - totalCosts;
  const roi = purchase > 0 ? ((grossProfit / purchase) * 100) : 0;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Profit Calculator</h2>
        <p className="text-gray-600">
          Calculate net profit and ROI for wholesale and double-close deals
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Purchase Price
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-gray-500">$</span>
            <input
              type="number"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="0"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sale Price (to end buyer)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-gray-500">$</span>
            <input
              type="number"
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="0"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Assignment Fee
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-gray-500">$</span>
            <input
              type="number"
              value={assignmentFee}
              onChange={(e) => setAssignmentFee(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="0"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">For assignment deals only</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Closing Costs
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-gray-500">$</span>
            <input
              type="number"
              value={closingCosts}
              onChange={(e) => setClosingCosts(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="0"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Marketing Costs
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-gray-500">$</span>
            <input
              type="number"
              value={marketingCosts}
              onChange={(e) => setMarketingCosts(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="0"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Other Costs
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-gray-500">$</span>
            <input
              type="number"
              value={otherCosts}
              onChange={(e) => setOtherCosts(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="0"
            />
          </div>
        </div>
      </div>

      <div className="mt-8 p-6 bg-green-50 rounded-lg border-2 border-green-200">
        <div className="grid md:grid-cols-3 gap-6 text-center">
          <div>
            <p className="text-sm font-medium text-green-900 mb-2">Net Profit</p>
            <p className={`text-3xl font-bold ${grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${grossProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-green-900 mb-2">Total Costs</p>
            <p className="text-3xl font-bold text-gray-700">
              ${totalCosts.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-green-900 mb-2">ROI</p>
            <p className={`text-3xl font-bold ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {roi.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Cash-on-Cash Return Calculator
function CashOnCashCalculator() {
  const [annualCashFlow, setAnnualCashFlow] = useState('');
  const [totalCashInvested, setTotalCashInvested] = useState('');

  const cashFlow = parseFloat(annualCashFlow) || 0;
  const invested = parseFloat(totalCashInvested) || 0;
  const cocReturn = invested > 0 ? ((cashFlow / invested) * 100) : 0;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Cash-on-Cash Return Calculator</h2>
        <p className="text-gray-600">
          Measure annual return on cash invested - key metric for rental properties
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Annual Cash Flow
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-gray-500">$</span>
            <input
              type="number"
              value={annualCashFlow}
              onChange={(e) => setAnnualCashFlow(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="0"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">Net income after all expenses (yearly)</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Total Cash Invested
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-gray-500">$</span>
            <input
              type="number"
              value={totalCashInvested}
              onChange={(e) => setTotalCashInvested(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="0"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">Down payment + closing costs + repairs</p>
        </div>
      </div>

      <div className="mt-8 p-6 bg-purple-50 rounded-lg border-2 border-purple-200">
        <div className="text-center">
          <p className="text-sm font-medium text-purple-900 mb-2">Cash-on-Cash Return</p>
          <p className={`text-5xl font-bold ${cocReturn >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
            {cocReturn.toFixed(2)}%
          </p>
          <p className="mt-4 text-sm text-purple-800">
            {cocReturn >= 12 && 'Excellent return - above industry average!'}
            {cocReturn >= 8 && cocReturn < 12 && 'Good return - solid investment'}
            {cocReturn >= 5 && cocReturn < 8 && 'Fair return - consider other opportunities'}
            {cocReturn < 5 && cocReturn > 0 && 'Below average - may not be worth the effort'}
            {cocReturn <= 0 && 'Negative return - avoid this investment'}
          </p>
        </div>

        <div className="mt-6 p-4 bg-white rounded-lg">
          <p className="text-xs text-gray-600 mb-2">Industry Benchmarks:</p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-green-600 font-semibold">12%+</span>
              <span className="text-gray-600"> - Excellent</span>
            </div>
            <div>
              <span className="text-blue-600 font-semibold">8-12%</span>
              <span className="text-gray-600"> - Good</span>
            </div>
            <div>
              <span className="text-orange-600 font-semibold">5-8%</span>
              <span className="text-gray-600"> - Fair</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// BRRRR Calculator
function BRRRRCalculator() {
  const [purchasePrice, setPurchasePrice] = useState('');
  const [rehabCost, setRehabCost] = useState('');
  const [arv, setArv] = useState('');
  const [ltvPercent, setLtvPercent] = useState('75');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [expenses, setExpenses] = useState('');

  const purchase = parseFloat(purchasePrice) || 0;
  const rehab = parseFloat(rehabCost) || 0;
  const arvNum = parseFloat(arv) || 0;
  const ltv = parseFloat(ltvPercent) || 75;
  const rent = parseFloat(monthlyRent) || 0;
  const exp = parseFloat(expenses) || 0;

  const totalInvested = purchase + rehab;
  const refinanceAmount = arvNum * (ltv / 100);
  const cashRecovered = refinanceAmount;
  const cashLeftIn = totalInvested - cashRecovered;
  const monthlyProfit = rent - exp;
  const annualCashFlow = monthlyProfit * 12;
  const cocReturn = cashLeftIn > 0 ? ((annualCashFlow / cashLeftIn) * 100) : 0;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">BRRRR Calculator</h2>
        <p className="text-gray-600">
          Buy, Rehab, Rent, Refinance, Repeat - Analyze cash-out refinance deals
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Purchase Price
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-gray-500">$</span>
            <input
              type="number"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              placeholder="0"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rehab Cost
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-gray-500">$</span>
            <input
              type="number"
              value={rehabCost}
              onChange={(e) => setRehabCost(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              placeholder="0"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            After Repair Value (ARV)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-gray-500">$</span>
            <input
              type="number"
              value={arv}
              onChange={(e) => setArv(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              placeholder="0"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Refinance LTV %
          </label>
          <div className="relative">
            <input
              type="number"
              value={ltvPercent}
              onChange={(e) => setLtvPercent(e.target.value)}
              className="w-full pr-8 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              placeholder="75"
            />
            <span className="absolute right-3 top-2.5 text-gray-500">%</span>
          </div>
          <p className="mt-1 text-xs text-gray-500">Typically 70-75%</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Monthly Rent
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-gray-500">$</span>
            <input
              type="number"
              value={monthlyRent}
              onChange={(e) => setMonthlyRent(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              placeholder="0"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Monthly Expenses
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-gray-500">$</span>
            <input
              type="number"
              value={expenses}
              onChange={(e) => setExpenses(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              placeholder="0"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">PITI + maintenance + vacancy</p>
        </div>
      </div>

      <div className="mt-8 p-6 bg-orange-50 rounded-lg border-2 border-orange-200">
        <div className="grid md:grid-cols-4 gap-4 text-center mb-6">
          <div className="p-4 bg-white rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Total Invested</p>
            <p className="text-xl font-bold text-gray-900">
              ${totalInvested.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="p-4 bg-white rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Cash Recovered</p>
            <p className="text-xl font-bold text-green-600">
              ${cashRecovered.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="p-4 bg-white rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Cash Left In Deal</p>
            <p className="text-xl font-bold text-orange-600">
              ${cashLeftIn.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="p-4 bg-white rounded-lg">
            <p className="text-xs text-gray-600 mb-1">CoC Return</p>
            <p className={`text-xl font-bold ${cocReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {cashLeftIn > 0 ? cocReturn.toFixed(1) + '%' : 'Infinite!'}
            </p>
          </div>
        </div>

        {cashLeftIn <= 0 && (
          <div className="p-4 bg-green-100 border border-green-300 rounded-lg text-center">
            <p className="text-sm font-bold text-green-900">
              🎉 INFINITE RETURN! You recovered all your cash and still own the property!
            </p>
          </div>
        )}

        {cashLeftIn > 0 && (
          <div className="p-4 bg-white rounded-lg">
            <p className="text-sm text-gray-700">
              Monthly cash flow: <span className="font-semibold text-green-600">
                ${monthlyProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </p>
            <p className="text-sm text-gray-700">
              Annual cash flow: <span className="font-semibold text-green-600">
                ${annualCashFlow.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Repair Estimator
function RepairEstimator() {
  const [items, setItems] = useState([
    { name: 'Roof', cost: '', notes: '' },
    { name: 'HVAC', cost: '', notes: '' },
    { name: 'Plumbing', cost: '', notes: '' },
    { name: 'Electrical', cost: '', notes: '' },
    { name: 'Kitchen', cost: '', notes: '' },
    { name: 'Bathrooms', cost: '', notes: '' },
    { name: 'Flooring', cost: '', notes: '' },
    { name: 'Paint (Interior)', cost: '', notes: '' },
    { name: 'Paint (Exterior)', cost: '', notes: '' },
    { name: 'Windows/Doors', cost: '', notes: '' },
    { name: 'Landscaping', cost: '', notes: '' },
    { name: 'Other', cost: '', notes: '' }
  ]);

  const totalEstimate = items.reduce((sum, item) => sum + (parseFloat(item.cost) || 0), 0);
  const contingency = totalEstimate * 0.10; // 10% contingency
  const grandTotal = totalEstimate + contingency;

  function updateItem(index: number, field: 'cost' | 'notes', value: string) {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Repair Cost Estimator</h2>
        <p className="text-gray-600">
          Line-item breakdown of renovation costs
        </p>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="grid md:grid-cols-3 gap-3 p-3 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{item.name}</label>
              <div className="relative">
                <span className="absolute left-2 top-2 text-gray-500 text-sm">$</span>
                <input
                  type="number"
                  value={item.cost}
                  onChange={(e) => updateItem(index, 'cost', e.target.value)}
                  className="w-full pl-6 pr-2 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-red-500"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
              <input
                type="text"
                value={item.notes}
                onChange={(e) => updateItem(index, 'notes', e.target.value)}
                className="w-full px-2 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-red-500"
                placeholder="Details..."
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-6 bg-red-50 rounded-lg border-2 border-red-200">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Subtotal</span>
            <span className="text-xl font-semibold text-gray-900">
              ${totalEstimate.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Contingency (10%)</span>
            <span className="font-medium text-gray-700">
              ${contingency.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="pt-2 border-t-2 border-red-300 flex justify-between items-center">
            <span className="text-lg font-bold text-gray-900">Total Repair Estimate</span>
            <span className="text-3xl font-bold text-red-600">
              ${grandTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
