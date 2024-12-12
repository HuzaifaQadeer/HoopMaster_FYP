'use client';
import { useState } from "react";
import { useRouter } from 'next/navigation';
import Navbar from "../components/navbar";
import { API_ROUTES } from "../config/api-endpoints";

const AddChallenge = () => {
  const router = useRouter();
  const [challenge, setChallenge] = useState({
    name: '',
    description: '',
    instructions: '',
    creator: '',
    dateCreated: new Date().toISOString().split('T')[0]
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(API_ROUTES.CHALLENGE.CREATE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(challenge)
      });

      if (!response.ok) {
        throw new Error('Failed to create challenge');
      }

      router.push('/challenges');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white min-h-screen">
      <Navbar />
      <div className="container mx-auto p-6">
        <h2 className="text-xl font-bold mb-4 text-black">Add New Challenge</h2>
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Challenge Name</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                value={challenge.name}
                onChange={(e) => setChallenge({...challenge, name: e.target.value})}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                value={challenge.description}
                onChange={(e) => setChallenge({...challenge, description: e.target.value})}
                required
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Instructions</label>
              <textarea
                className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                value={challenge.instructions}
                onChange={(e) => setChallenge({...challenge, instructions: e.target.value})}
                required
                rows={4}
                placeholder="Enter instructions step by step..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Creator Name</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                value={challenge.creator}
                onChange={(e) => setChallenge({...challenge, creator: e.target.value})}
                required
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-500 text-white rounded-lg py-2 px-4 hover:bg-blue-600 disabled:bg-blue-300"
            >
              {isLoading ? 'Adding...' : 'Add Challenge'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddChallenge;