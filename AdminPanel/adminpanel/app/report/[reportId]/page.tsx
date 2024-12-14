'use client';
import { useParams, useRouter } from 'next/navigation';
import Navbar from "@/app/components/navbar";
import { useState, useEffect } from 'react';
import { API_ROUTES, fetchWithAuth } from '@/app/config/api-endpoints';

interface ReportDetails {
  id: string;
  userId: string;
  contentId: string;
  contentType: 'post' | 'comment';
  reason: string;
  content: string;
  date: string;
  media?: string;
  reported: {
    _id: string;
    email: string;
    displayName: string;
  };
  reporter: {
    _id: string;
    email: string;
    displayName: string;
  };
  status: string;
  resolved: boolean;
  adminAction?: {
    admin: {
      _id: string;
      email: string;
      name: string;
    };
    action: string;
    date: string;
    notes: string;
  };
}

interface PostContent {
  _id: string;
  content: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  isPrivate: boolean;
  likes: string[];
  comments: string[];
  user: {
    _id: string;
    displayName: string;
    profilePicture?: string;
  };
  __v: number;
}

const ReportDetails = () => {
  const router = useRouter();
  const params = useParams();
  const [reportData, setReportData] = useState<ReportDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contentData, setContentData] = useState<PostContent | null>(null);

  useEffect(() => {
    fetchReportData();
  }, [params.reportId]);

  const fetchReportData = async () => {
    try {
      const reportResponse = await fetchWithAuth(
        API_ROUTES.REPORT.GET_ONE.replace(':reportId', params.reportId as string)
      );

      if (!reportResponse.ok) throw new Error('Failed to fetch report');
      const reportData = await reportResponse.json();
      setReportData(reportData);

      console.log('Report Data:', reportData);
      console.log('Content Type:', reportData.contentType);
      console.log('Content ID:', reportData.contentId);

      const isPost = reportData.contentType?.toLowerCase() === 'post';
      
      const contentEndpoint = isPost
        ? `${API_ROUTES.POST.GET_ONE}/${reportData.contentId}`
        : `${API_ROUTES.COMMENT.GET_ONE}/${reportData.contentId}`;

      console.log('Content Endpoint:', contentEndpoint);

      const contentResponse = await fetchWithAuth(contentEndpoint);

      if (!contentResponse.ok) {
        console.error('Content Response:', await contentResponse.text());
        throw new Error('Failed to fetch content');
      }
      
      const contentData = await contentResponse.json();
      console.log('Content Data:', contentData);
      setContentData(contentData);
    } catch (err) {
      setError('Failed to load report data');
      console.error('Error details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string) => {
    try {
      // Add dismiss case
      if (action === 'dismiss') {
        await fetchWithAuth(
          API_ROUTES.REPORT.RESOLVE.replace(':reportId', params.reportId as string),
          { 
            method: 'PATCH',
            body: JSON.stringify({ 
              action: 'dismissed',
              notes: 'Report dismissed by admin'
            })
          }
        );
        router.push('/community');
        return;
      }

      switch (action) {
        case 'remove':
          const isPost = reportData?.contentType?.toLowerCase() === 'post';
          
          const deleteEndpoint = isPost
            ? API_ROUTES.POST.DELETE.replace(':id', reportData?.contentId as string)
            : API_ROUTES.COMMENT.DELETE.replace(':id', reportData?.contentId as string);
          
          await fetchWithAuth(deleteEndpoint, { method: 'DELETE' });

          await fetchWithAuth(
            API_ROUTES.REPORT.RESOLVE.replace(':reportId', params.reportId as string),
            { 
              method: 'PATCH',
              body: JSON.stringify({ 
                action: 'content_removed',
                notes: 'Reported content was removed'
              })
            }
          );
          break;

        case 'ban7':
        case 'ban30':
          const days = action === 'ban7' ? 7 : 30;
          const banReason = `User banned for ${days} days due to reported content: ${reportData?.reason || 'No reason provided'}`;
          
          await fetchWithAuth(
            API_ROUTES.USER.BAN.replace(':userId', reportData?.reported._id as string),
            {
              method: 'POST',
              body: JSON.stringify({ 
                duration: days,
                reason: banReason
              })
            }
          );

          await fetchWithAuth(
            API_ROUTES.REPORT.RESOLVE.replace(':reportId', params.reportId as string),
            { 
              method: 'PATCH',
              body: JSON.stringify({ 
                action: `user_banned_${days}`,
                notes: banReason
              })
            }
          );
          break;

        case 'delete':
          if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

          await fetchWithAuth(
            API_ROUTES.USER.DELETE.replace(':userId', reportData?.reported._id as string),
            { 
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );

          await fetchWithAuth(
            API_ROUTES.REPORT.RESOLVE.replace(':reportId', params.reportId as string),
            { 
              method: 'PATCH',
              body: JSON.stringify({ 
                action: 'user_deleted',
                notes: 'User account was deleted'
              })
            }
          );
          break;
      }

      router.push('/community');
    } catch (err) {
      console.error('Action error:', err);
      alert(err instanceof Error ? err.message : 'Action failed');
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
            onClick={() => handleAction('dismiss')}
            className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
          >
            Dismiss Report
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
            <h2 className="text-2xl font-bold mb-2">Report</h2>
            <span className={`inline-block px-3 py-1 rounded-full text-sm ${
              reportData.contentType === 'post' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
            }`}>
              {reportData.contentType.charAt(0).toUpperCase() + reportData.contentType.slice(1)}
            </span>
          </div>

          {/* Reported Content */}
          <div className="border-2 border-red-200 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                {contentData?.user?.profilePicture && (
                  <img 
                    src={contentData.user.profilePicture}
                    alt={`${contentData.user.displayName}'s profile`}
                    className="w-10 h-10 rounded-full"
                  />
                )}
                <div>
                  <h4 className="font-bold">{contentData?.user.displayName}</h4>
                  <p className="text-xs text-gray-500">
                    {new Date(contentData?.createdAt || '').toLocaleString()}
                  </p>
                </div>
              </div>
              <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                {contentData?.status}
              </span>
            </div>

            {reportData.media && (
              <div className="mb-4">
                <div className="aspect-video bg-gray-200 rounded-lg">
                  <p className="text-center p-4 text-gray-500">Media Attachment</p>
                </div>
              </div>
            )}

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-800 whitespace-pre-wrap">
                {contentData?.content}
              </p>
            </div>

            <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
              <span>{contentData?.likes.length} likes</span>
              <span>{contentData?.comments.length} comments</span>
              {contentData?.isPrivate && (
                <span className="text-blue-600">Private Post</span>
              )}
            </div>
          </div>

          {/* Reporter Information */}
          <div className="border-2 border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold">Reported By: {reportData.reporter.displayName}</h3>
                <p className="text-gray-600 text-sm">{reportData.reporter.email}</p>
              </div>
              <span className="text-gray-500 text-sm">
                {new Date(reportData.date).toLocaleDateString()}
              </span>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-800 font-medium mb-2">Reporter's Comment:</p>
              <p>{reportData.reason}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportDetails;