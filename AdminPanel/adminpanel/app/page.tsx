'use client';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Navbar from './components/navbar';

const Dashboard = () => {
  const data = [
    { month: 'Jan', players: 50, revenue: 300 },
    { month: 'Feb', players: 70, revenue: 400 },
    { month: 'Mar', players: 40, revenue: 350 },
    { month: 'Apr', players: 90, revenue: 500 },
    { month: 'May', players: 60, revenue: 450 },
  ];

  const challenges = [
    {
      id: 1,
      name: "Speed Dribbling Course",
      attempts: 1234,
      topScore: 98,
      topScorer: "FastPlayer123",
      avgScore: 76,
      completionRate: "68%",
      difficulty: "Intermediate"
    },
    {
      id: 2,
      name: "Precision Shooting Challenge",
      attempts: 2156,
      topScore: 95,
      topScorer: "SniperPro",
      avgScore: 71,
      completionRate: "54%",
      difficulty: "Advanced"
    },
    {
      id: 3,
      name: "Passing Mastery Test",
      attempts: 1879,
      topScore: 100,
      topScorer: "MasterPasser",
      avgScore: 82,
      completionRate: "75%",
      difficulty: "Expert"
    }
  ];

  return (
    <div className="bg-white min-h-screen">
      <Navbar />
      <div className="container mx-auto p-6">
        <h2 className="text-xl font-bold mb-4 text-black">Dashboard</h2>
        
        {/* Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white text-black p-4 rounded-lg shadow-lg">
            <h3 className="font-semibold mb-2">Player Growth</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="players" fill="#000000" name="New Players" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white text-black p-4 rounded-lg shadow-lg">
            <h3 className="font-semibold mb-2">Revenue Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#000000" fill="rgba(0, 0, 0, 0.2)" name="Revenue ($)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Challenges Section */}
        <div className="bg-white text-black p-4 rounded-lg shadow-lg">
          <h3 className="font-semibold mb-4">Popular Challenges</h3>
          <div className="grid gap-4">
            {challenges.map((challenge) => (
              <div 
                key={challenge.id} 
                className="border border-gray-300 rounded-lg p-4 hover:bg-gray-100 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-lg">{challenge.name}</h4>
                  <span className="bg-blue-500 text-white text-sm px-2 py-1 rounded">
                    {challenge.difficulty}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3">
                  <div>
                    <p className="text-gray-600 text-sm">Total Attempts</p>
                    <p className="font-semibold">{challenge.attempts.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Top Score</p>
                    <p className="font-semibold">{challenge.topScore}/100</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Top Scorer</p>
                    <p className="font-semibold">{challenge.topScorer}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Average Score</p>
                    <p className="font-semibold">{challenge.avgScore}/100</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Completion Rate</p>
                    <p className="font-semibold">{challenge.completionRate}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;