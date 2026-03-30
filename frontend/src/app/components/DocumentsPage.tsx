import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Upload, CheckCircle, ExternalLink, AlertCircle, Trash2 } from 'lucide-react';
import studentService from '@/lib/services/studentService';
import { useAuthStore } from '@/store/authStore';
import { Skeleton } from './ui/skeleton';
import api from '@/lib/api';

export function DocumentsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [newResumeUrl, setNewResumeUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['studentProfile'],
    queryFn: studentService.getProfile,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (url: string) => {
      const res = await api.put('/student/profile', { resume_url: url });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentProfile'] });
      setNewResumeUrl('');
      setIsUploading(false);
    },
  });

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResumeUrl) return;
    setIsUploading(true);
    updateProfileMutation.mutate(newResumeUrl);
  };

  return (
    <div className="p-8 max-w-[1000px] mx-auto">
      <div className="mb-10">
        <h1 className="text-2xl font-semibold text-[#0B1426] mb-2">My Documents</h1>
        <p className="text-[#5B6472]">Manage your resumes and other placement-related files.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Document Section */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-[#E7E9EE] shadow-sm">
            <h3 className="font-semibold text-[#0B1426] mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#B6922E]" />
              Primary Resume
            </h3>

            {isLoading ? (
              <div className="flex items-center gap-4 p-4 border border-[#E7E9EE] rounded-xl bg-[#F8F7F4]">
                <Skeleton className="w-12 h-12 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            ) : profile?.resume_url ? (
              <div className="flex items-center justify-between p-4 border border-[#B6922E]/20 rounded-xl bg-[#B6922E]/5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-lg border border-[#E7E9EE] flex items-center justify-center">
                    <FileText className="w-6 h-6 text-[#B6922E]" />
                  </div>
                  <div>
                    <h4 className="font-medium text-[#0B1426]">Current Resume</h4>
                    <p className="text-xs text-[#5B6472]">Uploaded/Linked on {new Date().toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a 
                    href={profile.resume_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-white rounded-lg text-[#0B1426] border border-[#E7E9EE] transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button className="p-2 hover:bg-red-50 rounded-lg text-red-600 border border-red-100 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-[#E7E9EE] rounded-2xl bg-[#F8F7F4]">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                  <Upload className="w-8 h-8 text-[#5B6472]" />
                </div>
                <p className="text-[#0B1426] font-medium mb-1">No resume uploaded</p>
                <p className="text-sm text-[#5B6472]">Link your Google Drive or Dropbox file below</p>
              </div>
            )}

            <div className="mt-8 pt-8 border-t border-[#E7E9EE]">
              <h4 className="text-sm font-semibold text-[#0B1426] mb-4">Update Resume Link</h4>
              <form onSubmit={handleUpload} className="flex gap-3">
                <input
                  type="url"
                  placeholder="Paste your Google Drive/Dropbox/Cloud link here..."
                  value={newResumeUrl}
                  onChange={(e) => setNewResumeUrl(e.target.value)}
                  className="flex-1 h-11 px-4 bg-white border border-[#E7E9EE] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B6922E]"
                />
                <button 
                  type="submit"
                  disabled={isUploading || !newResumeUrl}
                  className="px-6 h-11 bg-[#0B1426] text-white rounded-xl text-sm font-medium hover:bg-[#1E3A5F] transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {isUploading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload
                    </>
                  )}
                </button>
              </form>
              <p className="mt-3 text-[11px] text-[#5B6472] flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 text-[#B6922E]" />
                Make sure your document is public or shared with the university recruitment account.
              </p>
            </div>
          </div>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-6">
          <div className="bg-[#0B1426] text-white rounded-2xl p-6 shadow-md">
            <h3 className="font-semibold mb-4 text-white">Guidelines</h3>
            <ul className="space-y-4">
              <li className="flex gap-3 text-sm text-white/80">
                <CheckCircle className="w-5 h-5 text-[#B6922E] flex-shrink-0" />
                Keep resume length to 1 page
              </li>
              <li className="flex gap-3 text-sm text-white/80">
                <CheckCircle className="w-5 h-5 text-[#B6922E] flex-shrink-0" />
                Use standard PDF format
              </li>
              <li className="flex gap-3 text-sm text-white/80">
                <CheckCircle className="w-5 h-5 text-[#B6922E] flex-shrink-0" />
                Ensure all links are clickable
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#E7E9EE] shadow-sm">
            <h3 className="font-semibold text-[#0B1426] mb-4">Need help?</h3>
            <p className="text-sm text-[#5B6472] mb-4">
              Our career coaches can review your resume and provide feedback.
            </p>
            <button className="w-full py-2.5 border border-[#E7E9EE] rounded-xl text-sm font-medium text-[#0B1426] hover:bg-[#F8F7F4] transition-colors">
              Book a session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
