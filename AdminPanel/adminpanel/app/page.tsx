'use client';
import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Navbar from './components/navbar';
import { API_ROUTES } from './config/api-endpoints';
import { fetchWithAuth } from './config/api-endpoints';
import { monthlyData as dummyMonthlyData } from '../dummydata/data';

interface MonthlyDataType {
  month: string;
  players: number;
  revenue: number;
  premiumSubscribed: number;
  premiumUnsubscribed: number;
}

type TimeFrameType = '3months' | 'year' | 'allTime';

const Dashboard = () => {
  const [timeFrame, setTimeFrame] = useState<TimeFrameType>('3months');
  const [monthlyData, setMonthlyData] = useState<MonthlyDataType[]>([]);
  const [overallTotals, setOverallTotals] = useState({ players: 0, revenue: 0, premiumUsers: 0 });
  const [useRealData, setUseRealData] = useState<boolean>(true);

  // Fetch overall totals
  useEffect(() => {
    const fetchTotals = async () => {
      if (useRealData) {
        try {
          const [usersRes, revenueRes, premiumRes] = await Promise.all([
            fetchWithAuth(API_ROUTES.USER.TOTAL_USERS),
            fetchWithAuth(API_ROUTES.REVENUE.TOTAL),
            fetchWithAuth(API_ROUTES.USER.TOTAL_PREMIUM_USERS)
          ]);
          
          const [totalUsers, totalRevenue, totalPremium] = await Promise.all([
            usersRes.json(),
            revenueRes.json(),
            premiumRes.json()
          ]);

          setOverallTotals({
            players: totalUsers.count,
            revenue: totalRevenue.revenue || 0,
            premiumUsers: totalPremium.count
          });
        } catch (error) {
          console.error('Error fetching totals:', error);
        }
      } else {
        // Use dummy totals
        setOverallTotals({
          players: 310,
          revenue: 2000,
          premiumUsers: 180
        });
      }
    };
    fetchTotals();
  }, [useRealData]);

  // Fetch time-based data
  useEffect(() => {
    const fetchTimeData = async () => {
      if (useRealData) {
        try {
          const endpoint = timeFrame === '3months' 
            ? 'THREE_MONTHS' 
            : timeFrame === 'year' ? 'YEAR' : 'LIFETIME';

          const [growthRes, revenueRes, subsRes, unsubsRes] = await Promise.all([
            fetchWithAuth(API_ROUTES.USER.USERS_GROWTH[endpoint]),
            fetchWithAuth(API_ROUTES.REVENUE.GROWTH[endpoint]),
            fetchWithAuth(API_ROUTES.REVENUE.PREMIUM_SUBSCRIPTIONS[endpoint]),
            fetchWithAuth(API_ROUTES.REVENUE.PREMIUM_UNSUBSCRIPTIONS[endpoint])
          ]);

          const [growth, revenue, subs, unsubs] = await Promise.all([
            growthRes.json(),
            revenueRes.json(),
            subsRes.json(),
            unsubsRes.json()
          ]);

          const formattedData = (growth || []).map((item: any, index: number) => ({
            month: item.month,
            players: item.users || 0,
            revenue: revenue[index]?.amount || 0,
            premiumSubscribed: subs[index]?.count || 0,
            premiumUnsubscribed: unsubs[index]?.count || 0
          }));

          setMonthlyData(formattedData);
        } catch (error) {
          console.error('Error fetching time data:', error);
          setMonthlyData([]);
        }
      } else {
        // Use dummy data based on timeFrame
        let filteredData = [...dummyMonthlyData];
        if (timeFrame === '3months') {
          filteredData = dummyMonthlyData.slice(-3);
        } else if (timeFrame === 'year') {
          filteredData = dummyMonthlyData;
        }
        setMonthlyData(filteredData);
      }
    };
    fetchTimeData();
  }, [timeFrame, useRealData]);

  // Calculate totals
  const calculateTotals = (data: MonthlyDataType[]): { 
    players: number; 
    revenue: number; 
    premiumUsers: number;
  } => {
    return data.reduce((acc, curr) => ({
      players: acc.players + curr.players,
      revenue: acc.revenue + curr.revenue,
      premiumUsers: acc.premiumUsers + (curr.premiumSubscribed - curr.premiumUnsubscribed)
    }), { players: 0, revenue: 0, premiumUsers: 0 });
  };

  // Get appropriate data based on selection
  const getDisplayData = (): MonthlyDataType[] => {
    switch(timeFrame) {
      case '3months':
        return monthlyData.slice(-3);
      case 'allTime':
      case 'year':
        return monthlyData;
      default:
        return monthlyData;
    }
  };

  const totals = calculateTotals(getDisplayData());

  return (
    <div className="bg-white min-h-screen">
      <Navbar />
      <div className="container mx-auto p-6">
        <h2 className="text-xl font-bold mb-4 text-black">Dashboard</h2>
        
        {/* 1. Overall Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-gray-600 text-sm">Total Players</h3>
            <p className="text-3xl font-bold text-black">{overallTotals.players.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-gray-600 text-sm">Total Revenue</h3>
            <p className="text-3xl font-bold text-black">${overallTotals.revenue.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-gray-600 text-sm">Total Premium Users</h3>
            <p className="text-3xl font-bold text-black">{overallTotals.premiumUsers.toLocaleString()}</p>
          </div>
        </div>

        {/* 2. Time Frame Selection */}
        <div className="mb-6">
          <select 
            className="border rounded-md p-2"
            value={timeFrame}
            onChange={(e) => setTimeFrame(e.target.value as TimeFrameType)}
          >
            <option value="3months">Last 3 Months</option>
            <option value="year">Year</option>
            <option value="allTime">All Time</option>
          </select>
        </div>

        {/* 3. Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white text-black p-4 rounded-lg shadow-lg">
            <div className="flex justify-between mb-2">
              <h3 className="font-semibold">Player Growth</h3>
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Players</p>
                <p className="font-bold">{totals.players}</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getDisplayData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="players" fill="#000000" name="New Players" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="bg-white text-black p-4 rounded-lg shadow-lg">
            <div className="flex justify-between mb-2">
              <h3 className="font-semibold">Revenue Over Time</h3>
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="font-bold">${totals.revenue}</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={getDisplayData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#000000" fill="rgba(0, 0, 0, 0.2)" name="Revenue ($)" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="col-span-2 bg-white text-black p-4 rounded-lg shadow-lg">
            <div className="flex justify-between mb-2">
              <h3 className="font-semibold">Premium Subscriptions</h3>
              <div className="text-right">
                <div className="flex items-center gap-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                    <span className="text-sm">Subscribed</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                    <span className="text-sm">Unsubscribed</span>
                  </div>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={getDisplayData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="premiumSubscribed" 
                  stroke="#22c55e" 
                  strokeWidth={2}
                  name="New Subscriptions" 
                />
                <Line 
                  type="monotone" 
                  dataKey="premiumUnsubscribed" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  name="Unsubscribed" 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <button 
          onClick={() => setUseRealData(!useRealData)}
          className="mb-4 px-4 py-2 bg-black text-white rounded"
        >
          Toggle {useRealData ? 'Dummy' : 'Real'} Data
        </button>
      </div>
    </div>
  );
};

export default Dashboard;