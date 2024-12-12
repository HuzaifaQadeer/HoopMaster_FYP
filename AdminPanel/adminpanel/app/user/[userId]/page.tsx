'use client';
import { useParams, useRouter } from 'next/navigation';
import Navbar from "@/app/components/navbar";
import { useState, useEffect } from 'react';
import { API_ROUTES } from '@/app/config/api-endpoints';

// Mock user data type
interface UserProfile {
  id: string;
  name: string;
  handle: string;
  imageUrl: string;
  physicalStats: {
    height: string;
    weight: string;
    wingspan: string;
    verticalJump: string;
  };
  isPremium: boolean;
  highlightVideo: string;
  courses: {
    id: number;
    name: string;
    progress: number;
  }[];
  drills: {
    id: number;
    name: string;
    score: number;
    date: string;
  }[];
  challenges: {
    id: number;
    name: string;
    score: number;
    rank: string;
  }[];
}

const UserProfile = () => {
  const router = useRouter();
  const params = useParams();
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserData();
  }, [params.userId]);

  const fetchUserData = async () => {
    try {
      const response = await fetch(API_ROUTES.USER.GET_USER_BY_ID.replace(':userId', params.userId as string), {
        credentials: 'include'
      });

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

  const handleBan = async (duration: string) => {
    try {
      const durationDays = duration.includes('week') ? 7 : 30;
      
      const response = await fetch(API_ROUTES.USER.BAN.replace(':userId', params.userId as string), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          duration: durationDays,
          reason: `User banned for ${duration} due to community guidelines violation`
        })
      });

      if (!response.ok) throw new Error('Failed to ban user');
      alert(`User banned for ${duration}`);
    } catch (err) {
      alert('Failed to ban user');
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch(API_ROUTES.USER.DELETE.replace(':userId', params.userId as string), {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to delete user');
      router.push('/community');
    } catch (err) {
      alert('Failed to delete user');
      console.error(err);
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
            <div className="w-32 h-32 bg-gray-200 rounded-full"></div>
            <div>
              <h2 className="text-2xl font-bold">{userData.name}</h2>
              <p className="text-gray-600">{userData.handle}</p>
              <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm ${
                userData.isPremium ? 'bg-gold-100 text-gold-800' : 'bg-gray-100'
              }`}>
                {userData.isPremium ? 'Premium Member' : 'Basic Member'}
              </span>
            </div>
          </div>
        </div>

        {/* Physical Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4">Physical Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(userData.physicalStats).map(([key, value]) => (
                <div key={key} className="border-b pb-2">
                  <p className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                  <p className="font-semibold">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Highlight Video */}
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4">Highlight Video</h3>
            <div className="aspect-video bg-gray-200 rounded-lg">
              {/* Video player would go here */}
            </div>
          </div>
        </div>

        {/* Courses Progress */}
        <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
          <h3 className="text-xl font-bold mb-4">Course Progress</h3>
          <div className="space-y-4">
            {userData.courses.map(course => (
              <div key={course.id} className="border-b pb-4">
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

        {/* Drills and Challenges */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4">Recent Drills</h3>
            <div className="space-y-4">
              {userData.drills.map(drill => (
                <div key={drill.id} className="border-b pb-2">
                  <div className="flex justify-between">
                    <span className="font-medium">{drill.name}</span>
                    <span className="text-blue-600 font-bold">{drill.score}</span>
                  </div>
                  <small className="text-gray-500">{drill.date}</small>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white shadow-lg rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4">Community Challenges</h3>
            <div className="space-y-4">
              {userData.challenges.map(challenge => (
                <div key={challenge.id} className="border-b pb-2">
                  <div className="flex justify-between">
                    <span className="font-medium">{challenge.name}</span>
                    <span className="text-green-600 font-bold">Rank: {challenge.rank}</span>
                  </div>
                  <p className="text-gray-600">Score: {challenge.score}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile; 