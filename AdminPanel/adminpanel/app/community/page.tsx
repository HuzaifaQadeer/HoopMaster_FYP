'use client';
import Navbar from "../components/navbar";
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { API_ROUTES } from "../config/api-endpoints";

interface Post {
  id: string;
  content: string;
  status: string;
}

interface Report {
  id: number;
  reporter: string;
  reported: string;
  reason: string;
  comment: string;
  reportedContent: string;
  date: string;
}

const Community: React.FC = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      // Fetch posts for community feed
      const postsResponse = await fetch(API_ROUTES.POST.GET_ALL, {
        credentials: 'include'
      });
      if (!postsResponse.ok) throw new Error('Failed to fetch posts');
      const postsData = await postsResponse.json();
      setPosts(postsData);

      // Fetch reports
      const reportsResponse = await fetch(API_ROUTES.REPORT.GET_ALL, {
        credentials: 'include'
      });
      if (!reportsResponse.ok) throw new Error('Failed to fetch reports');
      const reportsData = await reportsResponse.json();
      setReports(reportsData);
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      const response = await fetch(`${API_ROUTES.USER.SEARCH_PLAYERS}?query=${searchQuery}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      setSearchResults(data);
    } catch (err) {
      console.error('Search failed:', err);
      setSearchResults([]);
    }
  };

  const handleUserClick = (username: string) => {
    router.push(`/user/${username}`);
  };

  const handleReportClick = (reportId: number) => {
    router.push(`/report/${reportId}`);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="bg-white min-h-screen">
      <Navbar />
      <div className="container mx-auto p-6">
        <h2 className="text-xl font-bold mb-4 text-black">Community Management</h2>
        
        {/* Community Feed */}
        <div className="bg-white text-black p-4 rounded-lg shadow-lg mb-6">
          <h3 className="font-semibold mb-2">Community Feed</h3>
          <ul>
            {posts.map((post) => (
              <li key={post.id} className="border-b border-gray-300 py-2">
                <p>{post.content}</p>
                <small>Status: {post.status}</small>
              </li>
            ))}
          </ul>
        </div>

        {/* Player Search */}
        <div className="bg-white text-black p-4 rounded-lg shadow-lg mb-6">
          <h3 className="font-semibold mb-2">Player Search</h3>
          <div className="mb-4 flex gap-2">
            <input
              type="text"
              placeholder="Search players..."
              className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Search
            </button>
          </div>
          {searchResults.length > 0 && (
            <ul>
              {searchResults.map((player, index) => (
                <li 
                  key={index}
                  className="border-b border-gray-300 py-2 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleUserClick(player)}
                >
                  {player}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Player Reports */}
        <div className="bg-white text-black p-4 rounded-lg shadow-lg">
          <h3 className="font-semibold mb-2">Player Reports</h3>
          <ul>
            {reports.map((report) => (
              <li 
                key={report.id} 
                className="border-2 border-gray-300 rounded-lg p-4 mb-4 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleReportClick(report.id)}
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="font-medium">Reporter: {report.reporter}</p>
                    <small className="text-gray-600 font-bold">Date: {report.date}</small>
                  </div>
                  <p><span className="font-medium">Reported Player:</span> {report.reported}</p>
                  <p><span className="font-medium">Reason:</span> {report.reason}</p>
                  <div className="bg-gray-50 p-2 rounded-md mt-2 border border-gray-200">
                    <p className="text-sm text-gray-600 font-medium">Reported Content:</p>
                    <p className="italic">"{report.reportedContent}"</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-md border border-gray-200">
                    <p className="text-sm text-gray-600 font-medium">Reporter's Comment:</p>
                    <p>"{report.comment}"</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Community;
