import React from 'react';

export function InterviewsPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-[#111827] mb-6">Interviews</h1>
      <div className="bg-white rounded-xl border border-[#E7E9EE] shadow-sm p-16 text-center">
        <div className="w-16 h-16 bg-[#F8F7F4] rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-[#B6922E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-[#111827] mb-2">Interview Scheduling</h3>
        <p className="text-[#5B6472] max-w-sm mx-auto">This feature is currently under development. You'll soon be able to manage all your upcoming interview slots here.</p>
      </div>
    </div>
  );
}

export function MessagesPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-[#111827] mb-6">Messages</h1>
      <div className="bg-white rounded-xl border border-[#E7E9EE] shadow-sm p-16 text-center">
        <div className="w-16 h-16 bg-[#F8F7F4] rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-[#B6922E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-[#111827] mb-2">Message Center</h3>
        <p className="text-[#5B6472] max-w-sm mx-auto">Direct communication between students and recruiters is coming soon.</p>
      </div>
    </div>
  );
}

export function AnalyticsPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-[#111827] mb-6">Analytics</h1>
      <div className="bg-white rounded-xl border border-[#E7E9EE] shadow-sm p-16 text-center">
        <div className="w-16 h-16 bg-[#F8F7F4] rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-[#B6922E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-[#111827] mb-2">Platform Analytics</h3>
        <p className="text-[#5B6472] max-w-sm mx-auto">Advanced reporting and data visualisation tools will be available here shortly.</p>
      </div>
    </div>
  );
}

export function SettingsPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-[#111827] mb-6">Settings</h1>
      <div className="bg-white rounded-xl border border-[#E7E9EE] shadow-sm p-16 text-center">
        <div className="w-16 h-16 bg-[#F8F7F4] rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-[#B6922E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-[#111827] mb-2">Account Settings</h3>
        <p className="text-[#5B6472] max-w-sm mx-auto">Profile preferences, notification settings, and security options are coming soon.</p>
      </div>
    </div>
  );
}
