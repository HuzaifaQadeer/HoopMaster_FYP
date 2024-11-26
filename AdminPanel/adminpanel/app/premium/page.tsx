'use client';
import Navbar from "../components/navbar";

const Premium: React.FC = () => {
  const discounts = [
    { id: 1, percentage: "20%", duration: "10 days", status: "Active" },
  ];

  return (
    <div className="bg-white min-h-screen">
      <Navbar />
      <div className="container mx-auto p-6">
        <h2 className="text-xl font-bold mb-4 text-black">Premium Management</h2>
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
                  onClick={() => alert('Delete discount')}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>
        
        <button 
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => alert('Add new discount')}
        >
          Add Discount
        </button>
      </div>
    </div>
  );
};

export default Premium;
