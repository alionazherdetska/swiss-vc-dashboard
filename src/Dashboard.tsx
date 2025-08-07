import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, ScatterChart, Scatter, Area, AreaChart,
  ComposedChart
} from 'recharts';

// Sample data based on Swiss VC Report 2025
const investmentData = [
  { year: 2015, invested: 750, rounds: 120, exits: 15, median: 2.1 },
  { year: 2016, invested: 950, rounds: 145, exits: 18, median: 2.3 },
  { year: 2017, invested: 1200, rounds: 165, exits: 22, median: 2.5 },
  { year: 2018, invested: 1800, rounds: 195, exits: 28, median: 2.8 },
  { year: 2019, invested: 2400, rounds: 220, exits: 35, median: 3.1 },
  { year: 2020, invested: 3200, rounds: 280, exits: 25, median: 3.5 },
  { year: 2021, invested: 4100, rounds: 320, exits: 30, median: 3.8 },
  { year: 2022, invested: 3900, rounds: 398, exits: 48, median: 2.9 },
  { year: 2023, invested: 2588, rounds: 397, exits: 41, median: 2.1 },
  { year: 2024, invested: 2369, rounds: 357, exits: 41, median: 3.0 }
];

const sectorData = [
  { sector: 'Biotech', invested: 739.2, rounds: 36, avgRound: 20.5, color: '#8884d8', percentage: 31.2 },
  { sector: 'Cleantech', invested: 471.9, rounds: 67, avgRound: 7.0, color: '#82ca9d', percentage: 19.9 },
  { sector: 'ICT', invested: 315.1, rounds: 94, avgRound: 3.4, color: '#ffc658', percentage: 13.3 },
  { sector: 'Medtech', invested: 277.9, rounds: 33, avgRound: 8.4, color: '#ff7300', percentage: 11.7 },
  { sector: 'Micro/nano', invested: 219.4, rounds: 34, avgRound: 6.5, color: '#00ff88', percentage: 9.3 },
  { sector: 'ICT (fintech)', invested: 205.7, rounds: 41, avgRound: 5.0, color: '#0088fe', percentage: 8.7 },
  { sector: 'Healthcare IT', invested: 123.3, rounds: 32, avgRound: 3.9, color: '#ff0088', percentage: 5.2 },
  { sector: 'Consumer products', invested: 16.8, rounds: 20, avgRound: 0.8, color: '#888888', percentage: 0.7 }
];

const cantonData = [
  { canton: 'ZH', name: 'Zurich', invested: 631.4, rounds: 140, color: '#8884d8', percentage: 26.7 },
  { canton: 'VD', name: 'Vaud', invested: 506.2, rounds: 62, color: '#82ca9d', percentage: 21.4 },
  { canton: 'BL', name: 'Basel-Land', invested: 265.4, rounds: 10, color: '#ffc658', percentage: 11.2 },
  { canton: 'ZG', name: 'Zug', invested: 248.9, rounds: 31, color: '#ff7300', percentage: 10.5 },
  { canton: 'GE', name: 'Geneva', invested: 130.1, rounds: 21, color: '#00ff88', percentage: 5.5 },
  { canton: 'BE', name: 'Bern', invested: 117.9, rounds: 24, color: '#0088fe', percentage: 5.0 },
  { canton: 'BS', name: 'Basel-Stadt', invested: 91.1, rounds: 15, color: '#ff0088', percentage: 3.8 },
  { canton: 'TI', name: 'Ticino', invested: 52.6, rounds: 11, color: '#ffbb33', percentage: 2.2 },
  { canton: 'SG', name: 'St. Gallen', invested: 42.2, rounds: 7, color: '#ff6666', percentage: 1.8 },
  { canton: 'Other', name: 'Other Cantons', invested: 282.2, rounds: 36, color: '#888888', percentage: 11.9 }
];

const phaseData = [
  { phase: 'Seed', invested: 232, rounds: 140, median: 1.4, percentage: 9.8 },
  { phase: 'Early', invested: 633, rounds: 133, median: 4.3, percentage: 26.7 },
  { phase: 'Later', invested: 1504, rounds: 84, median: 12.0, percentage: 63.5 }
];

const top20Deals = [
  { company: 'Alentis Therapeutics', amount: 160.0, sector: 'Biotech', canton: 'BL', phase: 'Later' },
  { company: 'Asceneuron', amount: 89.5, sector: 'Biotech', canton: 'VD', phase: 'Later' },
  { company: 'Bright Peak Therapeutics', amount: 80.0, sector: 'Biotech', canton: 'BL', phase: 'Later' },
  { company: 'iOnctura', amount: 76.5, sector: 'Biotech', canton: 'GE', phase: 'Later' },
  { company: 'Terralayr', amount: 67.0, sector: 'Cleantech', canton: 'ZG', phase: 'Later' },
  { company: 'Neustark', amount: 61.0, sector: 'Cleantech', canton: 'BE', phase: 'Later' },
  { company: 'TVP Solar', amount: 57.8, sector: 'Cleantech', canton: 'GE', phase: 'Later' },
  { company: 'Neo Medical', amount: 57.5, sector: 'Medtech', canton: 'VD', phase: 'Later' },
  { company: 'Neurosterix', amount: 57.0, sector: 'Biotech', canton: 'GE', phase: 'Early' },
  { company: 'Amazentis', amount: 56.0, sector: 'Biotech', canton: 'VD', phase: 'Later' },
  { company: 'ANYbotics', amount: 53.5, sector: 'Micro/nano', canton: 'ZH', phase: 'Later' },
  { company: 'SkyCell', amount: 52.7, sector: 'Micro/nano', canton: 'ZG', phase: 'Later' },
  { company: 'Argá Medtech', amount: 49.3, sector: 'Medtech', canton: 'VD', phase: 'Later' },
  { company: 'CorFlow Therapeutics', amount: 41.5, sector: 'Medtech', canton: 'ZG', phase: 'Later' },
  { company: 'BE WTR', amount: 39.0, sector: 'Cleantech', canton: 'VD', phase: 'Later' },
  { company: 'Bcomp', amount: 36.0, sector: 'Cleantech', canton: 'FR', phase: 'Later' },
  { company: 'Candi Solar', amount: 35.0, sector: 'Cleantech', canton: 'ZH', phase: 'Early' },
  { company: 'Sygnum Bank', amount: 34.5, sector: 'ICT (fintech)', canton: 'ZH', phase: 'Later' },
  { company: 'xFarm Technologies', amount: 33.9, sector: 'ICT', canton: 'TI', phase: 'Later' },
  { company: 'SixPeaks Bio', amount: 27.5, sector: 'Biotech', canton: 'BS', phase: 'Early' }
];

const exitData = [
  { year: 2015, tradesSales: 12, ipos: 0, total: 12 },
  { year: 2016, tradesSales: 15, ipos: 1, total: 16 },
  { year: 2017, tradesSales: 18, ipos: 2, total: 20 },
  { year: 2018, tradesSales: 22, ipos: 1, total: 23 },
  { year: 2019, tradesSales: 28, ipos: 2, total: 30 },
  { year: 2020, tradesSales: 20, ipos: 1, total: 21 },
  { year: 2021, tradesSales: 25, ipos: 2, total: 27 },
  { year: 2022, tradesSales: 40, ipos: 3, total: 43 },
  { year: 2023, tradesSales: 35, ipos: 1, total: 36 },
  { year: 2024, tradesSales: 31, ipos: 0, total: 31 }
];

const Dashboard = () => {
  const [selectedSectors, setSelectedSectors] = useState([]);
  const [selectedCantons, setSelectedCantons] = useState([]);
  const [selectedPhases, setSelectedPhases] = useState([]);
  const [yearRange, setYearRange] = useState([2015, 2024]);
  const [activeChart, setActiveChart] = useState('overview');
  const [dealSizeFilter, setDealSizeFilter] = useState([0, 200]);

  const filteredData = useMemo(() => {
    return {
      sectors: selectedSectors.length > 0 ? sectorData.filter(d => selectedSectors.includes(d.sector)) : sectorData,
      cantons: selectedCantons.length > 0 ? cantonData.filter(d => selectedCantons.includes(d.canton)) : cantonData,
      phases: selectedPhases.length > 0 ? phaseData.filter(d => selectedPhases.includes(d.phase)) : phaseData,
      timeline: investmentData.filter(d => d.year >= yearRange[0] && d.year <= yearRange[1]),
      deals: top20Deals.filter(d => 
        d.amount >= dealSizeFilter[0] && 
        d.amount <= dealSizeFilter[1] &&
        (selectedSectors.length === 0 || selectedSectors.includes(d.sector)) &&
        (selectedCantons.length === 0 || selectedCantons.includes(d.canton)) &&
        (selectedPhases.length === 0 || selectedPhases.includes(d.phase))
      ),
      exits: exitData.filter(d => d.year >= yearRange[0] && d.year <= yearRange[1])
    };
  }, [selectedSectors, selectedCantons, selectedPhases, yearRange, dealSizeFilter]);

  const chartOptions = [
    { id: 'overview', name: 'Market Overview', description: 'Timeline of investments, rounds, and exits' },
    { id: 'sectors', name: 'Sector Analysis', description: 'Investment distribution by sectors' },
    { id: 'geographic', name: 'Geographic Distribution', description: 'Investment by cantons' },
    { id: 'phases', name: 'Investment Phases', description: 'Seed, Early, and Later stage analysis' },
    { id: 'deals', name: 'Top Deals', description: 'Largest financing rounds' },
    { id: 'exits', name: 'Exit Analysis', description: 'Trade sales and IPO trends' }
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
          <p className="font-semibold">{`${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name}: ${typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    switch(activeChart) {
      case 'overview':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Investment vs Rounds Timeline</h3>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={filteredData.timeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area yAxisId="left" type="monotone" dataKey="invested" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} name="Invested (CHF M)" />
                  <Line yAxisId="right" type="monotone" dataKey="rounds" stroke="#82ca9d" strokeWidth={3} name="Rounds" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Median Round Size Trend</h3>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={filteredData.timeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="median" stroke="#ff7300" strokeWidth={3} name="Median (CHF M)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
        
      case 'sectors':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Investment by Sector (CHF Million)</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={filteredData.sectors} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="sector" type="category" width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="invested" fill="#8884d8" name="Invested (CHF M)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Sector Distribution</h3>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={filteredData.sectors}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({sector, percentage}) => `${sector} ${percentage}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="invested"
                  >
                    {filteredData.sectors.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
              <h3 className="text-lg font-semibold mb-4">Rounds vs Average Round Size by Sector</h3>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={filteredData.sectors}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="sector" angle={-45} textAnchor="end" height={100} />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="rounds" fill="#82ca9d" name="Number of Rounds" />
                  <Line yAxisId="right" type="monotone" dataKey="avgRound" stroke="#ff7300" strokeWidth={3} name="Avg Round Size (CHF M)" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
        
      case 'geographic':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Investment by Canton</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={filteredData.cantons}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="canton" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="invested" fill="#8884d8" name="Invested (CHF M)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Rounds vs Investment Correlation</h3>
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart data={filteredData.cantons}>
                  <CartesianGrid />
                  <XAxis type="number" dataKey="rounds" name="Rounds" />
                  <YAxis type="number" dataKey="invested" name="Invested (CHF M)" />
                  <Tooltip cursor={{strokeDasharray: '3 3'}} content={<CustomTooltip />} />
                  <Scatter dataKey="invested" fill="#8884d8" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
              <h3 className="text-lg font-semibold mb-4">Canton Performance Overview</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Canton</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Investment (CHF M)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rounds</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Round Size</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Market Share</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.cantons.map((canton, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{canton.name} ({canton.canton})</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{canton.invested.toFixed(1)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{canton.rounds}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(canton.invested / canton.rounds).toFixed(1)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{canton.percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
        
      case 'phases':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Investment by Phase</h3>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={filteredData.phases}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="phase" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="invested" fill="#8884d8" name="Invested (CHF M)" />
                  <Bar yAxisId="left" dataKey="rounds" fill="#82ca9d" name="Rounds" />
                  <Line yAxisId="right" type="monotone" dataKey="median" stroke="#ff7300" strokeWidth={3} name="Median (CHF M)" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Phase Distribution</h3>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={filteredData.phases}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({phase, percentage}) => `${phase} ${percentage}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="invested"
                  >
                    {filteredData.phases.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#8884d8', '#82ca9d', '#ffc658'][index]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
        
      case 'deals':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Top Financing Rounds 2024</h3>
              <ResponsiveContainer width="100%" height={600}>
                <BarChart data={filteredData.deals} layout="vertical" margin={{ left: 120 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="company" type="category" width={120} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="amount" fill="#8884d8" name="Amount (CHF M)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Top Deals by Sector</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={Object.entries(
                        filteredData.deals.reduce((acc, deal) => {
                          acc[deal.sector] = (acc[deal.sector] || 0) + deal.amount;
                          return acc;
                        }, {})
                      ).map(([sector, amount]) => ({ sector, amount }))}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                      label={({sector, amount}) => `${sector}: ${amount.toFixed(0)}M`}
                    >
                      {Object.keys(filteredData.deals.reduce((acc, deal) => {
                        acc[deal.sector] = true;
                        return acc;
                      }, {})).map((sector, index) => (
                        <Cell key={`cell-${index}`} fill={sectorData.find(s => s.sector === sector)?.color || '#888888'} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Top Deals by Canton</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={Object.entries(
                    filteredData.deals.reduce((acc, deal) => {
                      acc[deal.canton] = (acc[deal.canton] || 0) + deal.amount;
                      return acc;
                    }, {})
                  ).map(([canton, amount]) => ({ canton, amount }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="canton" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="amount" fill="#82ca9d" name="Total Amount (CHF M)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        );
        
      case 'exits':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Exit Trends Over Time</h3>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={filteredData.exits}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="tradesSales" stackId="a" fill="#8884d8" name="Trade Sales" />
                  <Bar dataKey="ipos" stackId="a" fill="#82ca9d" name="IPOs" />
                  <Line type="monotone" dataKey="total" stroke="#ff7300" strokeWidth={3} name="Total Exits" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Exit Types Distribution</h3>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Trade Sales', value: filteredData.exits.reduce((sum, year) => sum + year.tradesSales, 0) },
                      { name: 'IPOs', value: filteredData.exits.reduce((sum, year) => sum + year.ipos, 0) }
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({name, value}) => `${name}: ${value}`}
                  >
                    <Cell fill="#8884d8" />
                    <Cell fill="#82ca9d" />
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  const totalInvested = filteredData.timeline.reduce((sum, year) => sum + year.invested, 0);
  const totalRounds = filteredData.timeline.reduce((sum, year) => sum + year.rounds, 0);
  const totalExits = filteredData.exits.reduce((sum, year) => sum + year.total, 0);
  const currentMedian = filteredData.timeline[filteredData.timeline.length - 1]?.median || 0;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Swiss Venture Capital Report 2025</h1>
          <p className="text-lg text-gray-600">Interactive Dashboard - Comprehensive Market Analysis</p>
        </div>
        
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <h3 className="text-2xl font-bold text-blue-600">CHF {(totalInvested / filteredData.timeline.length).toFixed(1)}B</h3>
            <p className="text-gray-600">Avg Annual Investment</p>
            <p className="text-sm text-gray-500">Total: CHF {(totalInvested / 1000).toFixed(1)}B</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <h3 className="text-2xl font-bold text-green-600">{Math.round(totalRounds / filteredData.timeline.length)}</h3>
            <p className="text-gray-600">Avg Annual Rounds</p>
            <p className="text-sm text-gray-500">Total: {totalRounds}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <h3 className="text-2xl font-bold text-purple-600">{Math.round(totalExits / filteredData.exits.length)}</h3>
            <p className="text-gray-600">Avg Annual Exits</p>
            <p className="text-sm text-gray-500">Total: {totalExits}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <h3 className="text-2xl font-bold text-orange-600">CHF {currentMedian}M</h3>
            <p className="text-gray-600">Current Median Round</p>
            <p className="text-sm text-gray-500">+40.7% vs 2023</p>
          </div>
        </div>
        
        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">Filters & Controls</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            
            {/* Sector Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sectors</label>
              <select 
                multiple 
                size="4"
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                value={selectedSectors}
                onChange={(e) => setSelectedSectors(Array.from(e.target.selectedOptions, option => option.value))}
              >
                {sectorData.map(sector => (
                  <option key={sector.sector} value={sector.sector}>{sector.sector}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
            </div>
            
            {/* Canton Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cantons</label>
              <select 
                multiple 
                size="4"
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                value={selectedCantons}
                onChange={(e) => setSelectedCantons(Array.from(e.target.selectedOptions, option => option.value))}
              >
                {cantonData.map(canton => (
                  <option key={canton.canton} value={canton.canton}>{canton.canton} - {canton.name}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
            </div>
            
            {/* Phase Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Investment Phases</label>
              <div className="space-y-2">
                {phaseData.map(phase => (
                  <label key={phase.phase} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedPhases.includes(phase.phase)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPhases([...selectedPhases, phase.phase]);
                        } else {
                          setSelectedPhases(selectedPhases.filter(p => p !== phase.phase));
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm">{phase.phase}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Year Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Year Range</label>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-gray-500">From:</label>
                  <input 
                    type="range"
                    min="2015" 
                    max="2024" 
                    value={yearRange[0]}
                    onChange={(e) => setYearRange([parseInt(e.target.value), yearRange[1]])}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-600">{yearRange[0]}</span>
                </div>
                <div>
                  <label className="text-xs text-gray-500">To:</label>
                  <input 
                    type="range"
                    min="2015" 
                    max="2024" 
                    value={yearRange[1]}
                    onChange={(e) => setYearRange([yearRange[0], parseInt(e.target.value)])}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-600">{yearRange[1]}</span>
                </div>
              </div>
            </div>
            
            {/* Deal Size Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Deal Size (CHF M)</label>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-gray-500">Min:</label>
                  <input 
                    type="range"
                    min="0" 
                    max="200" 
                    step="5"
                    value={dealSizeFilter[0]}
                    onChange={(e) => setDealSizeFilter([parseInt(e.target.value), dealSizeFilter[1]])}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-600">{dealSizeFilter[0]}M</span>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Max:</label>
                  <input 
                    type="range"
                    min="0" 
                    max="200" 
                    step="5"
                    value={dealSizeFilter[1]}
                    onChange={(e) => setDealSizeFilter([dealSizeFilter[0], parseInt(e.target.value)])}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-600">{dealSizeFilter[1]}M</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Filter Actions */}
          <div className="flex gap-2 mt-4">
            <button 
              onClick={() => {
                setSelectedSectors([]);
                setSelectedCantons([]);
                setSelectedPhases([]);
                setYearRange([2015, 2024]);
                setDealSizeFilter([0, 200]);
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              Clear All Filters
            </button>
            <button 
              onClick={() => {
                setSelectedSectors(['Biotech', 'Cleantech', 'ICT']);
                setSelectedPhases(['Later']);
                setYearRange([2020, 2024]);
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Focus on Growth Sectors
            </button>
            <button 
              onClick={() => {
                setSelectedCantons(['ZH', 'VD', 'GE']);
                setYearRange([2022, 2024]);
              }}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
            >
              Top 3 Cantons Recent
            </button>
          </div>
        </div>
        
        {/* Chart Navigation */}
        <div className="bg-white p-4 rounded-lg shadow mb-8">
          <div className="flex flex-wrap gap-2">
            {chartOptions.map(option => (
              <button
                key={option.id}
                onClick={() => setActiveChart(option.id)}
                className={`px-4 py-2 rounded-md transition-colors ${
                  activeChart === option.id 
                    ? 'bg-blue-500 text-white shadow-lg' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                title={option.description}
              >
                {option.name}
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Current view: <span className="font-semibold">{chartOptions.find(opt => opt.id === activeChart)?.description}</span>
          </p>
        </div>
        
        {/* Chart Display */}
        <div className="mb-8">
          {renderChart()}
        </div>
        
        {/* Summary Statistics */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Market Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Sector Summary */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Top Performing Sectors</h3>
              <div className="space-y-2">
                {filteredData.sectors.sort((a, b) => b.invested - a.invested).slice(0, 3).map((sector, index) => (
                  <div key={sector.sector} className="flex justify-between items-center">
                    <span className="text-sm">{index + 1}. {sector.sector}</span>
                    <span className="text-sm font-semibold">CHF {sector.invested.toFixed(0)}M</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Geographic Summary */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Leading Cantons</h3>
              <div className="space-y-2">
                {filteredData.cantons.sort((a, b) => b.invested - a.invested).slice(0, 3).map((canton, index) => (
                  <div key={canton.canton} className="flex justify-between items-center">
                    <span className="text-sm">{index + 1}. {canton.name}</span>
                    <span className="text-sm font-semibold">CHF {canton.invested.toFixed(0)}M</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Recent Trends */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Recent Trends</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>2024 Investment:</span>
                  <span className="font-semibold">CHF 2.37B (-8.5%)</span>
                </div>
                <div className="flex justify-between">
                  <span>2024 Rounds:</span>
                  <span className="font-semibold">357 (-10.1%)</span>
                </div>
                <div className="flex justify-between">
                  <span>Median Growth:</span>
                  <span className="font-semibold text-green-600">+40.7%</span>
                </div>
                <div className="flex justify-between">
                  <span>Biotech Recovery:</span>
                  <span className="font-semibold text-green-600">+50%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <footer className="text-center py-6 text-gray-500 text-sm">
          <p>Data source: Swiss Venture Capital Report 2025 | Interactive Dashboard</p>
          <p>Filters applied: {[
            selectedSectors.length > 0 ? `${selectedSectors.length} sectors` : null,
            selectedCantons.length > 0 ? `${selectedCantons.length} cantons` : null,
            selectedPhases.length > 0 ? `${selectedPhases.length} phases` : null,
            yearRange[0] !== 2015 || yearRange[1] !== 2024 ? `${yearRange[0]}-${yearRange[1]}` : null
          ].filter(Boolean).join(', ') || 'None'}</p>
        </footer>
      </div>
    </div>
  );
};

export default Dashboard;