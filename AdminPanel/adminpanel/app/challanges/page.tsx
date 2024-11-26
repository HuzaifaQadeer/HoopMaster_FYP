'use client';
import Navbar from "../components/navbar";

export default function Challenges() {
  const communityChallenges = [
    {
      id: 1,
      name: "Three-Point Challenge",
      description: "Test your accuracy from beyond the arc with this progressive shooting challenge",
      instructions: "1. Start from five spots behind the 3pt line\n2. Take 5 shots from each spot\n3. Must make at least 3/5 to advance\n4. Record total makes out of 25",
      creator: "SharpShooter",
      dateCreated: "2024-03-15"
    },
    {
      id: 2,
      name: "Dribbling Circuit",
      description: "Improve your ball handling with this timed dribbling obstacle course",
      instructions: "1. Set up 6 cones in zigzag pattern\n2. Alternate crossovers between cones\n3. Complete circuit with both hands\n4. Record best time without losing control",
      creator: "HandleMaster",
      dateCreated: "2024-03-18"
    }
  ];

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
                    onClick={() => alert(`Delete challenge ${challenge.id}`)}
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
          onClick={() => alert('Add new challenge')}
        >
          Add Challenge
        </button>
      </div>
    </div>
  );
}