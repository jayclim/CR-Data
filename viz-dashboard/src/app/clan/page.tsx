import React from 'react';
import { Search, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function ClanSearchPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-4 sm:p-8 flex flex-col items-center justify-center">
      <div className="max-w-md w-full space-y-8 -mt-20">
        {/* Header */}
        <div className="text-center space-y-4">
          <img src="/assets/clan.png" alt="Clan" className="w-24 h-24 mb-4 mx-auto object-contain opacity-50" />
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-600">
            Clan Analytics
          </h1>
        </div>

        {/* Disabled Notice */}
        <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-xl p-6 text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-yellow-500 mx-auto" />
          <h2 className="text-lg font-semibold text-yellow-400">Feature Temporarily Disabled</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Clan search has been disabled to stay within the Vercel free tier limits.
            Each lookup requires a live API call to the Clash Royale servers, which quickly
            exceeds the serverless function invocation quota.
          </p>
        </div>

        {/* Disabled Search Bar */}
        <div className="relative w-full opacity-50 pointer-events-none">
          <input
            type="text"
            placeholder="Enter Clan Tag"
            disabled
            className="w-full bg-[#171717] border border-[#262626] rounded-full py-4 px-12 text-white text-lg cursor-not-allowed"
          />
          <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-500 w-6 h-6" />
          <span className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gray-700 text-gray-400 px-6 py-2 rounded-full text-sm font-bold cursor-not-allowed">
            Analyze
          </span>
        </div>

        <div className="text-center">
          <Link href="/" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
