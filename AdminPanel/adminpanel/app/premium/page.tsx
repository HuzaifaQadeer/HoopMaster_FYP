'use client';
import Navbar from "../components/navbar";
import { useState } from "react";

const Premium: React.FC = () => {
  const [discounts, setDiscounts] = useState([
    { id: 1, percentage: "20%", duration: "10 days", status: "Active" },
  ]);
  const [newPercentage, setNewPercentage] = useState("");
  const [newDuration, setNewDuration] = useState("");

  const handleAddDiscount = () => {
    if (!newPercentage || !newDuration) return;
    
    const percentage = Number(newPercentage);
    if (percentage < 1 || percentage > 80) {
      alert("Percentage must be between 1 and 80");
      return;
    }
    
    const newDiscount = {
      id: Date.now(),
      percentage: newPercentage + "%",
      duration: newDuration + " days",
      status: "Active"
    };
    
    setDiscounts([newDiscount]);
    setNewPercentage("");
    setNewDuration("");
  };

  const handleDeleteDiscount = () => {
    setDiscounts([]); // Remove all discounts
  };

  return (
    <div className="bg-white min-h-screen">
      <Navbar />
      <div className="container mx-auto p-6">
        <h2 className="text-xl font-bold mb-4 text-black">Premium Management</h2>
        
        {/* Add Discount Section */}
        <div className="bg-white text-black p-4 rounded-lg shadow-lg mb-6">
          <h3 className="font-semibold mb-2">Add New Discount</h3>
          <div className="space-y-4">
            <div>
              <label className="block mb-1">Percentage</label>
              <input
                type="number"
                min="1"
                max="80"
                value={newPercentage}
                onChange={(e) => setNewPercentage(e.target.value)}
                className="border p-2 rounded w-full"
                placeholder="Enter percentage (1-80)"
              />
            </div>
            <div>
              <label className="block mb-1">Duration (days)</label>
              <input
                type="number"
                value={newDuration}
                onChange={(e) => setNewDuration(e.target.value)}
                className="border p-2 rounded w-full"
                placeholder="Enter duration in days"
              />
            </div>
            <div className="flex justify-center">
              <button 
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-8 rounded"
                onClick={handleAddDiscount}
              >
                Add Discount
              </button>
            </div>
          </div>
        </div>

        {/* Current Discounts Section */}
        <div className="bg-white text-black p-4 rounded-lg shadow-lg mb-6">
          <h3 className="font-semibold mb-2">Current Discounts</h3>
          <ul>
            {discounts.map((discount) => (
              <li key={discount.id} className="border-b border-gray-300 py-2 flex justify-between items-start">
                <div>
                  <p>Discount: {discount.percentage}</p>
                  <p>Duration: {discount.duration}</p>
                  <small>Status: {discount.status}</small>
                </div>
                <button 
                  className="text-red-500 hover:text-red-700 p-1"
                  onClick={handleDeleteDiscount}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Premium;
