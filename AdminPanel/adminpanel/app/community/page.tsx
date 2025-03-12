'use client';
import Navbar from "../components/navbar";
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { API_ROUTES } from "../config/api-endpoints";
import { fetchWithAuth } from '../config/api-endpoints';

interface Post {
  id: string;
  content: string;
  status: string;
  date: string;
  author: string;
  user: {
    id: string;
    displayName: string;
    email: string;
    profilePicture: string | null;
  }
}

interface AdminAction {
  admin: {
    _id: string;
    email: string;
    name: string;
  };
  action: string;
  date: string;
  notes: string;
}

interface Report {
  id: string;
  adminAction?: AdminAction;
  reporter: {
    _id: string;
    email: string;
    displayName: string;
  };
  reported: {
    _id: string;
    email: string;
    displayName: string;
  };
  contentType: 'post' | 'comment';
  contentId: string;
  reason: string;
  comment: string;
  resolved: boolean;
  status: string;
  date: string;
}

const Community: React.FC = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{displayName: string, _id: string}[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch posts
      const postsRes = await fetchWithAuth(API_ROUTES.POST.GET_ALL);
      if (!postsRes.ok) {
        throw new Error(`Failed to fetch posts: ${postsRes.status}`);
      }
      const postsData = await postsRes.json();
      console.log('Fetched posts data:', postsData);

      // Fetch reports
      const reportsRes = await fetchWithAuth(API_ROUTES.REPORT.GET_ALL);
      if (!reportsRes.ok) {
        throw new Error(`Failed to fetch reports: ${reportsRes.status}`);
      }
      const reportsData = await reportsRes.json();
      console.log('Fetched reports data:', reportsData);

      // Safely transform posts data
      if (Array.isArray(postsData)) {
        const validPosts = postsData.filter(post => post != null);
        setPosts(validPosts.map((post: any) => ({
          id: post.id || post._id || '',
          content: post.content || '',
          status: post.status || 'unknown',
          date: post.date ? new Date(post.date).toLocaleDateString() : 'Unknown Date',
          author: post.author || 'Unknown User',
          user: {
            id: post.user?.id || post.user?._id || '',
            displayName: post.user?.displayName || 'Unknown User',
            email: post.user?.email || '',
            profilePicture: post.user?.profilePicture || null
          }
        })));
      } else {
        console.error('Expected posts data to be an array but got:', typeof postsData);
        setPosts([]);
      }

      // Safely transform reports data
      if (Array.isArray(reportsData)) {
        const validReports = reportsData.filter(report => report != null && report._id != null);
        setReports(validReports.map((report: any) => {
          // Safely access nested properties
          const adminAction = report.adminAction && report.adminAction.admin ? {
            admin: {
              _id: report.adminAction.admin._id || '',
              email: report.adminAction.admin.email || '',
              name: report.adminAction.admin.name || ''
            },
            action: report.adminAction.action || '',
            date: report.adminAction.date ? new Date(report.adminAction.date).toLocaleDateString() : 'Unknown Date',
            notes: report.adminAction.notes || ''
          } : undefined;

          const reporter = report.reporter ? {
            _id: report.reporter._id || '',
            email: report.reporter.email || '',
            displayName: report.reporter.displayName || 'Unknown User'
          } : {
            _id: '',
            email: '',
            displayName: 'Unknown User'
          };

          const reported = report.reported ? {
            _id: report.reported._id || '',
            email: report.reported.email || '',
            displayName: report.reported.displayName || 'Unknown User'
          } : {
            _id: '',
            email: '',
            displayName: 'Unknown User'
          };

          return {
            id: report._id,
            adminAction,
            reporter,
            reported,
            contentType: report.contentType || 'post',
            contentId: report.contentId || '',
            reason: report.reason || '',
            comment: report.comment || '',
            resolved: !!report.resolved,
            status: report.status || 'pending',
            date: report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'Unknown Date'
          };
        }));
      } else {
        console.error('Expected reports data to be an array but got:', typeof reportsData);
        setReports([]);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load data';
      setError(errorMessage);
      console.error('Error fetching data:', error);
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
      setSearchResults(data.map((user: any) => ({
        displayName: user.displayName,
        _id: user._id
      })));
    } catch (err) {
      console.error('Search failed:', err);
      setSearchResults([]);
    }
  };

  const handleUserClick = (userId: string) => {
    router.push(`/user/${userId}`);
  };

  const handleReportClick = (report: Report) => {
    router.push(`/report/${report.id}?contentId=${report.contentId}&type=${report.contentType}`);
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
              <li key={post.id} className="border-2 border-gray-300 rounded-lg p-4 mb-4">
                <div className="mb-2 font-medium text-gray-600">{post.user.displayName}</div>
                <p>{post.content}</p>
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
              {searchResults.map((player) => (
                <li 
                  key={player._id}
                  className="border-b border-gray-300 py-2 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleUserClick(player._id)}
                >
                  {player.displayName}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Player Reports */}
        <div className="bg-white text-black p-4 rounded-lg shadow-lg">
          <h3 className="font-semibold mb-2">Player Reports</h3>
          {reports.length > 0 ? (
            <ul>
              {reports.map((report) => (
                <li 
                  key={report.id} 
                  className="border-2 border-gray-300 rounded-lg p-4 mb-4 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleReportClick(report)}
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="font-medium">Reporter: {report.reporter?.displayName || 'Unknown'}</p>
                      <small className="text-gray-600 font-bold">Date: {report.date || 'Unknown'}</small>
                    </div>
                    <p><span className="font-medium">Reported Player:</span> {report.reported?.displayName || 'Unknown'}</p>
                    <p><span className="font-medium">Status:</span> {report.status || 'Unknown'}</p>
                    {report.adminAction && (
                      <div className="bg-blue-50 p-2 rounded-md border border-blue-200">
                        <p className="text-sm text-blue-600 font-medium">Admin Action:</p>
                        <p>Action: {report.adminAction.action || 'Unknown'}</p>
                        <p>Notes: {report.adminAction.notes || 'None'}</p>
                        <p>Date: {report.adminAction.date || 'Unknown'}</p>
                      </div>
                    )}
                    <p><span className="font-medium">Reason:</span> {report.reason || 'Not specified'}</p>
                    <div className="bg-gray-50 p-2 rounded-md border border-gray-200">
                      <p className="text-sm text-gray-600 font-medium">Reporter's Comment:</p>
                      <p>"{report.comment || 'No comment provided'}"</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>No reports found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Community;
