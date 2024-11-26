'use client';
import Navbar from "../components/navbar";

const Community: React.FC = () => {
  const posts = [
    { id: 1, content: "Player A: Great game today!", status: "Approved" },
    { id: 2, content: "Player B: Need help with dribbling.", status: "Reported" },
  ];

  const reports = [
    { id: 1, reporter: "User123", reported: "ToxicPlayer99", reason: "Inappropriate language", date: "2024-03-20" },
    { id: 2, reporter: "Coach_Mike", reported: "SpamBot42", reason: "Spam messages", date: "2024-03-19" },
    { id: 3, reporter: "Admin_Sarah", reported: "Hacker777", reason: "Suspected cheating", date: "2024-03-18" },
  ];

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
        <div className="bg-white text-black p-4 rounded-lg shadow-lg">
          <h3 className="font-semibold mb-2">Player Reports</h3>
          <ul>
            {reports.map((report) => (
              <li 
                key={report.id} 
                className="border-b border-gray-300 py-2 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => alert(`Opening report details for case #${report.id}`)}
              >
                <p className="font-medium">Reporter: {report.reporter}</p>
                <p>Reported Player: {report.reported}</p>
                <p>Reason: {report.reason}</p>
                <small className="text-gray-600">Date: {report.date}</small>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Community;
