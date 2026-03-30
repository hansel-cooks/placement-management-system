import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Send, Briefcase, MapPin, IndianRupee, HelpCircle } from 'lucide-react';
import companyService, { NewJobPayload } from '@/lib/services/companyService';
import { NavLink, useNavigate } from 'react-router';

export function NewJobPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<NewJobPayload>({
    job_title: '',
    job_description: '',
    industry: '',
    job_type: 'Full-Time',
    location: '',
    total_ctc: 0,
    min_cgpa: 0,
    openings: 0,
    application_deadline: '',
    requirements: ''
  });

  const mutation = useMutation({
    mutationFn: companyService.postJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyJobs'] });
      queryClient.invalidateQueries({ queryKey: ['companyDashboardStats'] });
      navigate('/company/jobs');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'total_ctc' || name === 'min_cgpa' || name === 'openings' ? Number(value) : value
    }));
  };

  return (
    <div className="p-8 max-w-[800px] mx-auto">
      <NavLink 
        to="/company/jobs"
        className="inline-flex items-center gap-2 text-sm font-medium text-[#5B6472] hover:text-[#0B1426] mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Jobs
      </NavLink>

      <div className="mb-10">
        <h1 className="text-2xl font-semibold text-[#0B1426] mb-2">Post a New Job Opportunity</h1>
        <p className="text-[#5B6472]">Fill in the details to start recruitment for a new role.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <div className="bg-white rounded-2xl p-6 border border-[#E7E9EE] shadow-sm">
          <h3 className="font-semibold text-[#0B1426] mb-6 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-[#B6922E]" />
            Role Basic Information
          </h3>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-[#0B1426] mb-2">Job Title</label>
              <input
                required
                name="job_title"
                value={formData.job_title}
                onChange={handleChange}
                placeholder="e.g. Senior Software Engineer"
                className="w-full h-11 px-4 bg-white border border-[#E7E9EE] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B6922E]"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#0B1426] mb-2">Industry</label>
              <input
                required
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                placeholder="e.g. Information Technology"
                className="w-full h-11 px-4 bg-white border border-[#E7E9EE] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B6922E]"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#0B1426] mb-2">Job Type</label>
              <select
                name="job_type"
                value={formData.job_type}
                onChange={handleChange}
                className="w-full h-11 px-4 bg-white border border-[#E7E9EE] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B6922E]"
              >
                <option value="Full-Time">Full-Time</option>
                <option value="Internship">Internship</option>
                <option value="Contract">Contract</option>
              </select>
            </div>
          </div>
        </div>

        {/* Location & Compensation */}
        <div className="bg-white rounded-2xl p-6 border border-[#E7E9EE] shadow-sm">
          <h3 className="font-semibold text-[#0B1426] mb-6 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#B6922E]" />
            Location & Compensation
          </h3>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-[#0B1426] mb-2">Location</label>
              <input
                required
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. Bangalore, Remote"
                className="w-full h-11 px-4 bg-white border border-[#E7E9EE] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B6922E]"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#0B1426] mb-2 flex items-center gap-1.5">
                Total CTC (LPA)
                <IndianRupee className="w-3.5 h-3.5 text-[#5B6472]" />
              </label>
              <input
                required
                type="number"
                name="total_ctc"
                value={formData.total_ctc}
                onChange={handleChange}
                placeholder="e.g. 12"
                className="w-full h-11 px-4 bg-white border border-[#E7E9EE] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B6922E]"
              />
            </div>
          </div>
        </div>

        {/* Requirements */}
        <div className="bg-white rounded-2xl p-6 border border-[#E7E9EE] shadow-sm">
          <h3 className="font-semibold text-[#0B1426] mb-6 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-[#B6922E]" />
            Candidate Requirements
          </h3>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-[#0B1426] mb-2">Min. CGPA</label>
              <input
                required
                type="number"
                step="0.01"
                max="10"
                name="min_cgpa"
                value={formData.min_cgpa}
                onChange={handleChange}
                placeholder="e.g. 7.5"
                className="w-full h-11 px-4 bg-white border border-[#E7E9EE] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B6922E]"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#0B1426] mb-2">Number of Openings</label>
              <input
                required
                type="number"
                name="openings"
                value={formData.openings}
                onChange={handleChange}
                placeholder="e.g. 5"
                className="w-full h-11 px-4 bg-white border border-[#E7E9EE] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B6922E]"
              />
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-[#0B1426] mb-2">Application Deadline</label>
              <input
                required
                type="date"
                name="application_deadline"
                value={formData.application_deadline}
                onChange={handleChange}
                className="w-full h-11 px-4 bg-white border border-[#E7E9EE] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B6922E]"
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-2xl p-6 border border-[#E7E9EE] shadow-sm">
          <h3 className="font-semibold text-[#0B1426] mb-4">Role Description & Requirements</h3>
          <textarea
            required
            name="job_description"
            value={formData.job_description}
            onChange={handleChange}
            placeholder="Describe the role, responsibilities, and qualifications..."
            className="w-full min-h-[160px] p-4 bg-white border border-[#E7E9EE] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B6922E] resize-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button 
            type="button" 
            onClick={() => navigate('/company/jobs')}
            className="px-6 py-2.5 border border-[#E7E9EE] rounded-xl text-sm font-medium text-[#0B1426] hover:bg-[#F8F7F4] transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            disabled={mutation.isPending}
            className="px-8 py-2.5 bg-[#0B1426] text-white rounded-xl text-sm font-medium hover:bg-[#1E3A5F] transition-all flex items-center gap-2 shadow-md disabled:opacity-50"
          >
            {mutation.isPending ? 'Posting...' : (
              <>
                <Send className="w-4 h-4" />
                Publish Job Listing
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
