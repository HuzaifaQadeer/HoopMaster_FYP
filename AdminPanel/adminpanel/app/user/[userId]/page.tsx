'use client';
import { useParams, useRouter } from 'next/navigation';
import Navbar from "@/app/components/navbar";
import { useState, useEffect } from 'react';
import { API_ROUTES, fetchWithAuth } from '@/app/config/api-endpoints';
import { useAuth } from '@/app/contexts/AuthContext';

// Mock user data type
interface UserProfile {
  _id: string;
  email: string;
  displayName: string;
  userName?: string;
  profilePicture?: string;
  highlightVideo?: string;
  socialMedia?: {
    instagram?: string;
    facebook?: string;
    youtube?: string;
    twitter?: string;
  };
  height?: {
    value: number;
    unit: 'cm' | 'ft';
  };
  weight?: {
    value: number;
    unit: 'kg' | 'lbs';
  };
  wingspan?: {
    value: number;
    unit: 'cm' | 'in';
  };
  verticalJump?: {
    value: number;
    unit: 'cm' | 'in';
  };
  isPremium: boolean;
  isPrivate: boolean;
  courses?: any[];
  drills?: any[];
  challenges?: any[];
  achievements?: any[];
  banStatus?: {
    isBanned: boolean;
    banReason?: string;
    bannedUntil?: Date;
  };
}

const UserProfile = () => {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated } = useAuth();
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = async () => {
    try {
      const response = await fetchWithAuth(
        API_ROUTES.USER.GET_USER_BY_ID.replace(':userId', params.userId as string)
      );

      if (!response.ok) throw new Error('Failed to fetch user data');
      const data = await response.json();
      setUserData(data);
    } catch (err) {
      setError('Failed to load user data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchUserData();
  }, [params.userId, isAuthenticated]);

  const handleBan = async (duration: string) => {
    try {
      const durationDays = duration.includes('week') ? 7 : 30;
      const banReason = `User banned for ${duration} due to community guidelines violation`;
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetchWithAuth(
        API_ROUTES.USER.BAN.replace(':userId', params.userId as string), 
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            duration: durationDays,
            reason: banReason
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to ban user');
      }

      const result = await response.json();
      await fetchUserData(); // Refresh user data
      alert(`User banned successfully for ${duration}`);
    } catch (err) {
      console.error('Ban error:', err);
      alert(err instanceof Error ? err.message : 'Failed to ban user');
    }
  };

  const handlePostDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const response = await fetchWithAuth(
        API_ROUTES.POST.DELETE.replace(':id', postId),
        {
          method: 'DELETE'
        }
      );

      if (!response.ok) throw new Error('Failed to delete post');
      
      alert('Post deleted successfully');
      router.push('/community');
    } catch (err) {
      console.error('Delete post error:', err);
      alert('Failed to delete post');
    }
  };

  const handleCommentDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const response = await fetchWithAuth(
        API_ROUTES.COMMENT.DELETE.replace(':id', commentId),
        {
          method: 'DELETE'
        }
      );

      if (!response.ok) throw new Error('Failed to delete comment');
      
      alert('Comment deleted successfully');
      router.push('/community');
    } catch (err) {
      console.error('Delete comment error:', err);
      alert('Failed to delete comment');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    try {
      const response = await fetchWithAuth(
        API_ROUTES.USER.DELETE.replace(':userId', params.userId as string),
        {
          method: 'DELETE'
        }
      );

      if (!response.ok) throw new Error('Failed to delete user');
      
      alert('User deleted successfully');
      router.push('/');
    } catch (err) {
      console.error('Delete user error:', err);
      alert('Failed to delete user');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!userData) return <div>User not found</div>;

  return (
    <div className="bg-white min-h-screen">
      <Navbar />
      <div className="container mx-auto p-6">
        {/* Admin Controls */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium text-white bg-gray-600 rounded-md shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
          >
            Back
          </button>
          <button
            onClick={() => handleBan('1 week')}
            className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium text-white bg-amber-600 rounded-md shadow-sm hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-colors duration-200"
          >
            Ban 1 Week
          </button>
          <button
            onClick={() => handleBan('1 month')}
            className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium text-white bg-orange-600 rounded-md shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors duration-200"
          >
            Ban 1 Month
          </button>
          <button
            onClick={handleDelete}
            className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium text-white bg-red-800 rounded-md shadow-sm hover:bg-red-900 focus:outline-none focus:ring-2 focus:ring-red-700 focus:ring-offset-2 transition-colors duration-200"
          >
            Delete User
          </button>
        </div>

        {/* User Basic Info */}
        <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
          <div className="flex items-start gap-6">
            <div className="w-32 h-32 bg-gray-200 rounded-full">
              {userData?.profilePicture && (
                <img 
                  src={userData.profilePicture} 
                  alt={userData.displayName} 
                  className="w-full h-full rounded-full object-cover"
                />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{userData?.displayName}</h2>
              <p className="text-gray-600">{userData?.email}</p>
              <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm ${
                userData?.isPremium ? 'bg-gold-100 text-gold-800' : 'bg-gray-100'
              }`}>
                {userData?.isPremium ? 'Premium Member' : 'Basic Member'}
              </span>
              {userData?.banStatus?.isBanned && (
                <span className="inline-block ml-2 px-3 py-1 rounded-full text-sm bg-red-100 text-red-800">
                  Banned until {new Date(userData.banStatus.bannedUntil!).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Physical Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4">Physical Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              {userData?.height && (
                <div key="height" className="border-b pb-2">
                  <p className="text-gray-600">Height</p>
                  <p className="font-semibold">{`${userData.height.value} ${userData.height.unit}`}</p>
                </div>
              )}
              {userData?.weight && (
                <div key="weight" className="border-b pb-2">
                  <p className="text-gray-600">Weight</p>
                  <p className="font-semibold">{`${userData.weight.value} ${userData.weight.unit}`}</p>
                </div>
              )}
              {userData?.wingspan && (
                <div key="wingspan" className="border-b pb-2">
                  <p className="text-gray-600">Wingspan</p>
                  <p className="font-semibold">{`${userData.wingspan.value} ${userData.wingspan.unit}`}</p>
                </div>
              )}
              {userData?.verticalJump && (
                <div key="verticalJump" className="border-b pb-2">
                  <p className="text-gray-600">Vertical Jump</p>
                  <p className="font-semibold">{`${userData.verticalJump.value} ${userData.verticalJump.unit}`}</p>
                </div>
              )}
            </div>
          </div>

          {/* Highlight Video */}
          {userData?.highlightVideo && (
            <div className="bg-white shadow-lg rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">Highlight Video</h3>
              <div className="aspect-video bg-gray-200 rounded-lg">
                <video 
                  src={userData.highlightVideo} 
                  controls 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
        </div>

        {/* Courses Progress */}
        {userData?.courses && userData.courses.length > 0 && (
          <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
            <h3 className="text-xl font-bold mb-4">Course Progress</h3>
            <div className="space-y-4">
              {userData.courses.map(course => (
                <div key={course._id || course.id} className="border-b pb-4">
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">{course.name}</span>
                    <span>{course.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{ width: `${course.progress}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Drills and Challenges */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {userData?.drills && userData.drills.length > 0 && (
            <div className="bg-white shadow-lg rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">Recent Drills</h3>
              <div className="space-y-4">
                {userData.drills.map((drill, index) => (
                  <div key={drill._id || drill.id || `drill-${index}`} className="border-b pb-2">
                    <div className="flex justify-between">
                      <span className="font-medium">{drill.name}</span>
                      <span className="text-blue-600 font-bold">{drill.score}</span>
                    </div>
                    <small className="text-gray-500">{drill.date}</small>
                  </div>
                ))}
              </div>
            </div>
          )}

          {userData?.challenges && userData.challenges.length > 0 && (
            <div className="bg-white shadow-lg rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">Community Challenges</h3>
              <div className="space-y-4">
                {userData.challenges.map((challenge, index) => (
                  <div key={challenge._id || challenge.id || `challenge-${index}`} className="border-b pb-2">
                    <div className="flex justify-between">
                      <span className="font-medium">{challenge.name}</span>
                      <span className="text-green-600 font-bold">Rank: {challenge.rank}</span>
                    </div>
                    <p className="text-gray-600">Score: {challenge.score}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile; 