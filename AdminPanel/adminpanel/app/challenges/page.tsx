'use client';
import Navbar from "../components/navbar";
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { API_ROUTES } from '../config/api-endpoints';

interface Challenge {
  id: number;
  name: string;
  description: string;
  instructions: string;
  creator: string;
  dateCreated: string;
}

export default function Challenges() {
  const router = useRouter();
  const [communityChallenges, setCommunityChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      const response = await fetch(API_ROUTES.CHALLENGE.GET_ALL);
      if (!response.ok) {
        throw new Error('Failed to fetch challenges');
      }
      const data = await response.json();
      setCommunityChallenges(data);
    } catch (err) {
      setError('Failed to load challenges');
      console.error('Error fetching challenges:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveChallenge = async (id: number) => {
    try {
      const response = await fetch(`${API_ROUTES.CHALLENGE.DELETE}/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete challenge');
      }
      
      setCommunityChallenges(communityChallenges.filter(challenge => challenge.id !== id));
    } catch (err) {
      console.error('Error deleting challenge:', err);
      // Optionally show an error message to the user
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white min-h-screen">
        <Navbar />
        <div className="container mx-auto p-6">
          <p className="text-black">Loading challenges...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white min-h-screen">
        <Navbar />
        <div className="container mx-auto p-6">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <Navbar />
      <div className="container mx-auto p-6">
        <h2 className="text-xl font-bold mb-4 text-black">Community Challenges</h2>
        
        <div className="bg-white text-black p-4 rounded-lg shadow-lg mb-6">
          <div className="grid gap-4">
            {communityChallenges.map((challenge) => (
              <div 
                key={challenge.id} 
                className="border border-gray-300 rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-lg">{challenge.name}</h4>
                    <p className="text-sm text-gray-600">Created by: {challenge.creator} on {challenge.dateCreated}</p>
                  </div>
                  <button 
                    className="text-red-500 hover:text-red-700 p-1"
                    onClick={() => handleRemoveChallenge(challenge.id)}
                  >
                    ✕
                  </button>
                </div>
                
                <div className="mt-3 space-y-3">
                  <div>
                    <p className="text-gray-600 text-sm">Description</p>
                    <p className="font-semibold">{challenge.description}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Instructions</p>
                    <pre className="font-semibold whitespace-pre-wrap">{challenge.instructions}</pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button 
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => router.push('/add-challenge')}
        >
          Add Challenge
        </button>
      </div>
    </div>
  );
}