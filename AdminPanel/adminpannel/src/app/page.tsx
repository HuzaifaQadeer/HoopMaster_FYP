"use client";
import { useState } from 'react';

export default function Home() {
  const [selectedTab, setSelectedTab] = useState('dashboard');

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-4">
          <h1 className="text-2xl font-bold">Admin Panel</h1>
        </div>
        <nav className="mt-4">
          <a
            className={`block px-4 py-2 ${selectedTab === 'dashboard' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
            onClick={() => setSelectedTab('dashboard')}
          >
            Dashboard
          </a>
          <a
            className={`block px-4 py-2 ${selectedTab === 'users' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
            onClick={() => setSelectedTab('users')}
          >
            Users
          </a>
          <a
            className={`block px-4 py-2 ${selectedTab === 'drills' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
            onClick={() => setSelectedTab('drills')}
          >
            Drills
          </a>
          <a
            className={`block px-4 py-2 ${selectedTab === 'settings' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
            onClick={() => setSelectedTab('settings')}
          >
            Settings
          </a>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 p-8">
        <h2 className="text-3xl font-semibold mb-4">
          {selectedTab.charAt(0).toUpperCase() + selectedTab.slice(1)}
        </h2>
        {/* Content for each tab would go here */}
        {selectedTab === 'dashboard' && <p>Welcome to your admin dashboard!</p>}
        {selectedTab === 'users' && <p>Manage your users here.</p>}
        {selectedTab === 'drills' && <p>View and edit drills here.</p>}
        {selectedTab === 'settings' && <p>Adjust your settings here.</p>}
      </div>
    </div>
  );
}
