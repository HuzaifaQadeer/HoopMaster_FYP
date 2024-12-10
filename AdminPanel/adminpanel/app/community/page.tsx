'use client';
import Navbar from "../components/navbar";
import { useState } from "react";
import { useRouter } from 'next/navigation';

const Community: React.FC = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<string[]>([]);

  const posts = [
    { id: 1, content: "Player A: Great game today!", status: "Approved" },
    { id: 2, content: "Player B: Need help with dribbling.", status: "Reported" },
  ];

  const players = [
    "John Smith",
    "Sarah Johnson",
    "Mike Wilson",
    "Emma Davis"
  ];

  const reports = [
    { 
      id: 1, 
      reporter: "User123", 
      reported: "ToxicPlayer99", 
      reason: "Inappropriate language",
      comment: "This behavior is unacceptable in our community",
      reportedContent: "You're all terrible at this game! *explicit content*",
      date: "2024-03-20" 
    },
    { 
      id: 2, 
      reporter: "Coach_Mike", 
      reported: "SpamBot42", 
      reason: "Spam messages",
      comment: "This user keeps posting promotional links",
      reportedContent: "Buy cheap coins at www.scam-site.com!",
      date: "2024-03-19" 
    },
    { 
      id: 3, 
      reporter: "Admin_Sarah", 
      reported: "Hacker777", 
      reason: "Suspected cheating",
      comment: "Player was showing impossible scores",
      reportedContent: "Just won 50 matches in a row! Too easy!",
      date: "2024-03-18" 
    },
  ];

  const handleSearch = () => {
    const results = players.filter(player =>
      player.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setSearchResults(results);
  };

  const handleUserClick = (username: string) => {
    router.push(`/user/${username}`);
  };

  const handleReportClick = (reportId: number) => {
    router.push(`/report/${reportId}`);
  };

  return (
    <div className="bg-white min-h-screen">
      <Navbar />
      <div className="container mx-auto p-6">
        <h2 className="text-xl font-bold mb-4 text-black">Community Management</h2>
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
