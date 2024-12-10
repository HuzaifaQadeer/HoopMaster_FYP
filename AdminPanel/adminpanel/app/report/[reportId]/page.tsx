'use client';
import { useParams, useRouter } from 'next/navigation';
import Navbar from "@/app/components/navbar";
import { useState, useEffect } from 'react';

interface ReportDetails {
  id: string;
  author: {
    name: string;
    handle: string;
  };
  date: string;
  media?: string;
  content: string;
  type: 'post' | 'comment';
  reportedBy: {
    name: string;
    handle: string;
    date: string;
    comment: string;
  };
}

const ReportDetails = () => {
  const router = useRouter();
  const params = useParams();
  const [reportData, setReportData] = useState<ReportDetails | null>(null);

  // Mock fetch data
  useEffect(() => {
    // Simulating API call
    const mockReportData: ReportDetails = {
      id: params.id as string,
      author: {
        name: "John Smith",
        handle: "@jsmith_baller",
      },
      date: "2024-03-20 14:30",
      media: "https://example.com/post-image.jpg",
      content: "I hate player who are alwsy take up space in the gynm doing sma edirll for hours on th ehoop like give some space for a game",
      type: "post",
      reportedBy: {
        name: "Mike Wilson",
        handle: "@mike_moderator",
        date: "2024-03-20 15:45",
        comment: "This user is creating a hostile environment and targeting specific players at the gym. This kind of aggressive behavior could lead to conflicts on the court."
      }
    };
    setReportData(mockReportData);
  }, [params.id]);

  const handleAction = (action: string) => {
    switch (action) {
      case 'remove':
        if (confirm('Are you sure you want to remove this post/comment?')) {
          alert('Content removed');
          router.push('/community');
        }
        break;
      case 'ban7':
        if (confirm('Ban user for 7 days?')) {
          alert('User banned for 7 days');
        }
        break;
      case 'ban30':
        if (confirm('Ban user for 30 days?')) {
          alert('User banned for 30 days');
        }
        break;
      case 'delete':
        if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
          alert('User deleted');
          router.push('/community');
        }
        break;
    }
  };

  if (!reportData) return <div>Loading...</div>;

  return (
    <div className="bg-white min-h-screen">
      <Navbar />
      <div className="container mx-auto p-6">
        {/* Admin Controls */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Back
          </button>
          <button
            onClick={() => handleAction('remove')}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Remove Content
          </button>
          <button
            onClick={() => handleAction('ban7')}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
          >
            Ban 7 Days
          </button>
          <button
            onClick={() => handleAction('ban30')}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Ban 30 Days
          </button>
          <button
            onClick={() => handleAction('delete')}
            className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800"
          >
            Delete User
          </button>
        </div>

        {/* Report Details */}
        <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">Report #{reportData.id}</h2>
            <span className={`inline-block px-3 py-1 rounded-full text-sm ${
              reportData.type === 'post' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
            }`}>
              {reportData.type.charAt(0).toUpperCase() + reportData.type.slice(1)}
            </span>
          </div>

          {/* Reported Content */}
          <div className="border-2 border-red-200 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold">{reportData.author.name}</h3>
                <p className="text-gray-600 text-sm">{reportData.author.handle}</p>
              </div>
              <span className="text-gray-500 text-sm">{reportData.date}</span>
            </div>
            
            {reportData.media && (
              <div className="mb-4">
                <div className="aspect-video bg-gray-200 rounded-lg">
                  {/* Media content would go here */}
                  <p className="text-center p-4 text-gray-500">Media Attachment</p>
                </div>
              </div>
            )}

            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-red-800 font-medium mb-2">Reported Content:</p>
              <p className="italic">{reportData.content}</p>
            </div>
          </div>

          {/* Reporter Information */}
          <div className="border-2 border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold">Reported By: {reportData.reportedBy.name}</h3>
                <p className="text-gray-600 text-sm">{reportData.reportedBy.handle}</p>
              </div>
              <span className="text-gray-500 text-sm">{reportData.reportedBy.date}</span>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-800 font-medium mb-2">Reporter's Comment:</p>
              <p>{reportData.reportedBy.comment}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportDetails;