'use client';
import { useParams, useRouter } from 'next/navigation';
import Navbar from "@/app/components/navbar";
import { useState, useEffect } from 'react';
import { API_ROUTES } from '@/app/config/api-endpoints';

interface ReportDetails {
  id: string;
  userId: string;
  contentId: string;
  author: {
    name: string;
    handle: string;
  };
  date: string;
  media?: string;
  content: string;
  type: 'post' | 'comment';
  reason: string;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contentData, setContentData] = useState<any>(null);

  useEffect(() => {
    fetchReportData();
  }, [params.reportId]);

  const fetchReportData = async () => {
    try {
      const reportResponse = await fetch(API_ROUTES.REPORT.GET_ONE.replace(':reportId', params.reportId as string), {
        credentials: 'include'
      });

      if (!reportResponse.ok) throw new Error('Failed to fetch report');
      const reportData = await reportResponse.json();
      setReportData(reportData);

      // Fetch the reported content (post or comment)
      const contentEndpoint = reportData.type === 'post' 
        ? API_ROUTES.POST.GET_ONE + '/' + reportData.contentId
        : API_ROUTES.COMMENT.GET_ONE + '/' + reportData.contentId;

      const contentResponse = await fetch(contentEndpoint, {
        credentials: 'include'
      });

      if (!contentResponse.ok) throw new Error('Failed to fetch content');
      const contentData = await contentResponse.json();
      setContentData(contentData);
    } catch (err) {
      setError('Failed to load report data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string) => {
    try {
      switch (action) {
        case 'remove':
          const contentEndpoint = reportData?.type === 'post'
            ? API_ROUTES.POST.GET_ONE + '/' + reportData?.content
            : API_ROUTES.COMMENT.GET_ONE + '/' + reportData?.content;

          await fetch(contentEndpoint, {
            method: 'DELETE',
            credentials: 'include'
          });
          break;

        case 'ban7':
        case 'ban30':
          const days = action === 'ban7' ? 7 : 30;
          await fetch(API_ROUTES.USER.BAN.replace(':userId', reportData?.userId as string), {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              duration: days,
              reason: `User banned for ${days} days due to reported content: ${reportData?.reason || 'No reason provided'}`
            })
          });
          break;

        case 'delete':
          await fetch(API_ROUTES.USER.DELETE.replace(':userId', reportData?.userId as string), {
            method: 'DELETE',
            credentials: 'include'
          });
          break;
      }

      // Mark report as resolved
      await fetch(API_ROUTES.REPORT.RESOLVE.replace(':reportId', params.reportId as string), {
        method: 'PATCH',
        credentials: 'include'
      });

      router.push('/reports');
    } catch (err) {
      alert('Action failed');
      console.error(err);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!reportData || !contentData) return <div>Report not found</div>;

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