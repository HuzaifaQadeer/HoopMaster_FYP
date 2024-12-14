'use client';
import Navbar from "../components/navbar";
import { useState, useEffect } from "react";
import { API_ROUTES, fetchWithAuth } from "../config/api-endpoints";

interface PremiumConfig {
  currentDiscount?: {
    percentage: number;
    validUntil: string;
  };
  premiumPrice: number;
}

const Premium: React.FC = () => {
  const [premiumConfig, setPremiumConfig] = useState<PremiumConfig | null>(null);
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [newPercentage, setNewPercentage] = useState("");
  const [newDuration, setNewDuration] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPremiumConfig();
  }, []);

  const fetchPremiumConfig = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetchWithAuth(API_ROUTES.PREMIUM.GET, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch premium config');
      }

      const data: PremiumConfig = await response.json();
      setPremiumConfig(data);
      
      if (data.currentDiscount) {
        const validUntilDate = new Date(data.currentDiscount.validUntil);
        validUntilDate.setHours(0, 0, 0, 0);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const daysRemaining = Math.floor(
          (validUntilDate.getTime() - today.getTime()) 
          / (1000 * 60 * 60 * 24)
        );
        
        setDiscounts([{
          id: 1,
          percentage: `${data.currentDiscount.percentage}%`,
          duration: `${daysRemaining} days remaining`,
          status: "Active"
        }]);
      } else {
        setDiscounts([]);
      }
    } catch (error) {
      console.error('Error fetching premium config:', error);
      setError('Failed to fetch premium configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDiscount = async () => {
    if (!newPercentage || !newDuration) return;
    
    const percentage = Number(newPercentage);
    const duration = Number(newDuration);

    if (percentage < 1 || percentage > 80) {
      alert("Percentage must be between 1 and 80");
      return;
    }

    if (duration < 1 || duration > 60) {
      alert("Duration must be between 1 and 60 days");
      return;
    }
    
    try {
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + duration);
      validUntil.setHours(23, 59, 59, 999);

      const response = await fetchWithAuth(API_ROUTES.PREMIUM.SET_DISCOUNT, {
        method: 'PATCH',
        body: JSON.stringify({
          percentage: percentage,
          validUntil: validUntil.toISOString()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to set discount');
      }

      await fetchPremiumConfig();
      setNewPercentage("");
      setNewDuration("");
    } catch (error) {
      console.error('Error setting discount:', error);
      alert('Failed to set discount. Please try again.');
    }
  };

  const handleDeleteDiscount = async () => {
    try {
      const response = await fetchWithAuth(API_ROUTES.PREMIUM.REMOVE_DISCOUNT, {
        method: 'PATCH'
      });

      if (!response.ok) {
        throw new Error('Failed to remove discount');
      }

      await fetchPremiumConfig();
    } catch (error) {
      console.error('Error removing discount:', error);
      alert('Failed to remove discount. Please try again.');
    }
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
                min="1"
                max="60"
                value={newDuration}
                onChange={(e) => setNewDuration(e.target.value)}
                className="border p-2 rounded w-full"
                placeholder="Enter duration (1-60 days)"
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
