"""
generate_jobs_json.py
Generates a hybrid jobs.json (curated + generated) for the frontend demo.
Output: ../frontend/public/data/jobs.json
"""

import json
import random
from datetime import datetime, timedelta
import os

# ─── Pools ────────────────────────────────────────────────────────────────────

ROLES = [
    "Software Engineer",
    "Frontend Developer",
    "Backend Developer",
    "Data Analyst",
    "ML Engineer",
    "DevOps Engineer",
    "Full Stack Developer",
    "Cloud Engineer",
    "Data Engineer",
    "QA Engineer",
    "System Analyst",
    "Product Manager",
    "Business Analyst",
    "Cybersecurity Analyst",
    "Embedded Systems Engineer",
]

COMPANIES = [
    "Google", "Microsoft", "Amazon", "Adobe", "Flipkart",
    "Uber", "Atlassian", "Goldman Sachs", "PhonePe", "Razorpay",
    "Swiggy", "Zomato", "Meesho", "Airbnb", "Salesforce",
    "Oracle", "IBM", "SAP", "Cisco", "NVIDIA",
    "Tata Consultancy Services", "Infosys", "Wipro", "HCL Technologies",
    "Tech Mahindra", "Cognizant", "Accenture", "Deloitte", "Capgemini",
    "Wells Fargo", "Deutsche Bank", "Morgan Stanley", "Barclays",
    "KPMG", "McKinsey", "BCG", "Bain & Company",
    "Freshworks", "Zoho", "Byju's", "Unacademy", "Paytm",
    "Ola", "Nykaa", "Zerodha", "Groww", "PolicyBazaar",
]

LOCATIONS = [
    "Bangalore", "Hyderabad", "Gurgaon", "Remote",
    "Mumbai", "Pune", "Chennai", "Noida", "Delhi NCR",
    "Kolkata", "Ahmedabad", "Chandigarh",
]

SKILLS_MAP = {
    "Software Engineer":        ["DSA", "Java", "C++", "System Design", "Git"],
    "Frontend Developer":       ["React", "JavaScript", "TypeScript", "CSS", "HTML"],
    "Backend Developer":        ["Node.js", "SQL", "REST APIs", "Python", "Docker"],
    "Data Analyst":             ["SQL", "Excel", "Python", "Tableau", "Power BI"],
    "ML Engineer":              ["Python", "TensorFlow", "Machine Learning", "Pandas", "Scikit-learn"],
    "DevOps Engineer":          ["Docker", "Kubernetes", "AWS", "CI/CD", "Linux"],
    "Full Stack Developer":     ["React", "Node.js", "MongoDB", "SQL", "Git"],
    "Cloud Engineer":           ["AWS", "Azure", "GCP", "Terraform", "Kubernetes"],
    "Data Engineer":            ["SQL", "Spark", "Python", "Airflow", "Kafka"],
    "QA Engineer":              ["Selenium", "Python", "JIRA", "Postman", "SQL"],
    "System Analyst":           ["SQL", "Java", "Business Analysis", "UML", "Agile"],
    "Product Manager":          ["Roadmapping", "SQL", "Analytics", "Agile", "Communication"],
    "Business Analyst":         ["SQL", "Excel", "Power BI", "JIRA", "Requirements Gathering"],
    "Cybersecurity Analyst":    ["Network Security", "Python", "SIEM", "Firewalls", "Linux"],
    "Embedded Systems Engineer":["C", "C++", "RTOS", "Arduino", "UART"],
}

INDUSTRIES = {
    "Google": "Technology", "Microsoft": "Technology", "Amazon": "E-Commerce/Tech",
    "Adobe": "Technology", "Flipkart": "E-Commerce/Tech", "Uber": "Mobility/Tech",
    "Atlassian": "Software/SaaS", "Goldman Sachs": "Finance", "PhonePe": "FinTech",
    "Razorpay": "FinTech", "Swiggy": "FoodTech", "Zomato": "FoodTech",
    "Meesho": "E-Commerce", "Airbnb": "Travel/Tech", "Salesforce": "CRM/SaaS",
    "Oracle": "Enterprise Software", "IBM": "IT Services", "SAP": "Enterprise Software",
    "Cisco": "Networking", "NVIDIA": "Semiconductors",
    "Tata Consultancy Services": "IT/Software", "Infosys": "IT/Software",
    "Wipro": "IT/Software", "HCL Technologies": "IT/Software",
    "Tech Mahindra": "IT/Software", "Cognizant": "IT/Software",
    "Accenture": "Consulting", "Deloitte": "Consulting", "Capgemini": "IT/Software",
    "Wells Fargo": "Banking", "Deutsche Bank": "Banking",
    "Morgan Stanley": "Finance", "Barclays": "Banking",
    "KPMG": "Consulting", "McKinsey": "Consulting",
    "BCG": "Consulting", "Bain & Company": "Consulting",
    "Freshworks": "SaaS/Software", "Zoho": "SaaS/Software",
    "Byju's": "EdTech", "Unacademy": "EdTech", "Paytm": "FinTech",
    "Ola": "Mobility", "Nykaa": "E-Commerce/Beauty",
    "Zerodha": "FinTech", "Groww": "FinTech", "PolicyBazaar": "InsurTech",
}

SALARY_RANGES = {
    # role -> (internship_min, internship_max, fulltime_min_lpa, fulltime_max_lpa)
    "Software Engineer":        (30000, 80000, 8, 30),
    "Frontend Developer":       (20000, 60000, 6, 20),
    "Backend Developer":        (25000, 70000, 7, 22),
    "Data Analyst":             (20000, 50000, 5, 16),
    "ML Engineer":              (35000, 80000, 10, 35),
    "DevOps Engineer":          (30000, 70000, 8, 25),
    "Full Stack Developer":     (25000, 65000, 7, 22),
    "Cloud Engineer":           (30000, 75000, 8, 28),
    "Data Engineer":            (30000, 70000, 8, 24),
    "QA Engineer":              (20000, 50000, 5, 16),
    "System Analyst":           (25000, 55000, 6, 18),
    "Product Manager":          (25000, 60000, 10, 30),
    "Business Analyst":         (20000, 50000, 6, 18),
    "Cybersecurity Analyst":    (30000, 65000, 8, 25),
    "Embedded Systems Engineer":(25000, 60000, 6, 18),
}

PREMIUM_COMPANIES = ["Google", "Microsoft", "Amazon", "Goldman Sachs", "Morgan Stanley", "NVIDIA", "Atlassian"]

def days_ago_label(n):
    if n == 0: return "Today"
    if n == 1: return "1 day ago"
    return f"{n} days ago"

def future_date(days_from_now):
    return (datetime.now() + timedelta(days=days_from_now)).strftime("%Y-%m-%d")

def build_salary(role, job_type, company):
    r = SALARY_RANGES.get(role, (20000, 60000, 6, 20))
    multiplier = 1.3 if company in PREMIUM_COMPANIES else 1.0
    if job_type == "Internship":
        base = random.randint(r[0], r[1])
        base = int(base * multiplier)
        return f"₹{base//1000}k/month"
    else:
        lo, hi = r[2], r[3]
        lo = round(lo * multiplier, 1)
        hi = round(hi * multiplier, 1)
        val = round(random.uniform(lo, hi), 1)
        return f"₹{val} LPA"

# ─── Curated Jobs (25 entries) ────────────────────────────────────────────────

CURATED = [
    {
        "id": "c001", "title": "Software Engineer", "company": "Google",
        "industry": "Technology", "location": "Bangalore", "type": "Full-Time",
        "salary": "₹24 LPA", "skills": ["DSA", "Java", "System Design", "Python"],
        "cgpa_cutoff": 8.0, "applicants_count": 487, "posted_at": "2 days ago",
        "deadline": future_date(18), "openings": 5,
    },
    {
        "id": "c002", "title": "ML Engineer", "company": "Microsoft",
        "industry": "Technology", "location": "Hyderabad", "type": "Full-Time",
        "salary": "₹28 LPA", "skills": ["Python", "TensorFlow", "Machine Learning", "Azure"],
        "cgpa_cutoff": 7.5, "applicants_count": 342, "posted_at": "1 day ago",
        "deadline": future_date(21), "openings": 3,
    },
    {
        "id": "c003", "title": "Software Development Engineer", "company": "Amazon",
        "industry": "E-Commerce/Tech", "location": "Bangalore", "type": "Full-Time",
        "salary": "₹30 LPA", "skills": ["Java", "DSA", "AWS", "System Design"],
        "cgpa_cutoff": 7.5, "applicants_count": 512, "posted_at": "3 days ago",
        "deadline": future_date(14), "openings": 8,
    },
    {
        "id": "c004", "title": "Frontend Developer", "company": "Adobe",
        "industry": "Technology", "location": "Noida", "type": "Full-Time",
        "salary": "₹18 LPA", "skills": ["React", "JavaScript", "TypeScript", "CSS"],
        "cgpa_cutoff": 7.0, "applicants_count": 198, "posted_at": "4 days ago",
        "deadline": future_date(25), "openings": 6,
    },
    {
        "id": "c005", "title": "Data Analyst", "company": "Goldman Sachs",
        "industry": "Finance", "location": "Bangalore", "type": "Full-Time",
        "salary": "₹22 LPA", "skills": ["Python", "SQL", "Machine Learning", "Statistics"],
        "cgpa_cutoff": 8.0, "applicants_count": 389, "posted_at": "Today",
        "deadline": future_date(12), "openings": 4,
    },
    {
        "id": "c006", "title": "Backend Developer Intern", "company": "Flipkart",
        "industry": "E-Commerce/Tech", "location": "Bangalore", "type": "Internship",
        "salary": "₹60k/month", "skills": ["Node.js", "SQL", "REST APIs", "Redis"],
        "cgpa_cutoff": 7.0, "applicants_count": 421, "posted_at": "2 days ago",
        "deadline": future_date(16), "openings": 12,
    },
    {
        "id": "c007", "title": "Product Manager", "company": "Uber",
        "industry": "Mobility/Tech", "location": "Gurgaon", "type": "Full-Time",
        "salary": "₹26 LPA", "skills": ["Product Roadmapping", "SQL", "Analytics", "Agile"],
        "cgpa_cutoff": 7.5, "applicants_count": 267, "posted_at": "5 days ago",
        "deadline": future_date(20), "openings": 2,
    },
    {
        "id": "c008", "title": "Full Stack Developer", "company": "Atlassian",
        "industry": "Software/SaaS", "location": "Remote", "type": "Full-Time",
        "salary": "₹22 LPA", "skills": ["React", "Node.js", "MongoDB", "AWS"],
        "cgpa_cutoff": 7.0, "applicants_count": 183, "posted_at": "1 day ago",
        "deadline": future_date(22), "openings": 5,
    },
    {
        "id": "c009", "title": "Quantitative Analyst", "company": "Morgan Stanley",
        "industry": "Finance", "location": "Mumbai", "type": "Full-Time",
        "salary": "₹32 LPA", "skills": ["Python", "Statistics", "C++", "Machine Learning"],
        "cgpa_cutoff": 8.5, "applicants_count": 156, "posted_at": "3 days ago",
        "deadline": future_date(10), "openings": 2,
    },
    {
        "id": "c010", "title": "DevOps Engineer", "company": "PhonePe",
        "industry": "FinTech", "location": "Bangalore", "type": "Full-Time",
        "salary": "₹20 LPA", "skills": ["Docker", "Kubernetes", "AWS", "CI/CD"],
        "cgpa_cutoff": 7.0, "applicants_count": 234, "posted_at": "Today",
        "deadline": future_date(28), "openings": 7,
    },
    {
        "id": "c011", "title": "Data Science Intern", "company": "Razorpay",
        "industry": "FinTech", "location": "Bangalore", "type": "Internship",
        "salary": "₹70k/month", "skills": ["Python", "Machine Learning", "SQL", "Pandas"],
        "cgpa_cutoff": 7.5, "applicants_count": 309, "posted_at": "2 days ago",
        "deadline": future_date(15), "openings": 8,
    },
    {
        "id": "c012", "title": "Software Engineer", "company": "Swiggy",
        "industry": "FoodTech", "location": "Bangalore", "type": "Full-Time",
        "salary": "₹18 LPA", "skills": ["Java", "Microservices", "Kafka", "SQL"],
        "cgpa_cutoff": 6.5, "applicants_count": 445, "posted_at": "6 days ago",
        "deadline": future_date(19), "openings": 10,
    },
    {
        "id": "c013", "title": "Cloud Engineer", "company": "NVIDIA",
        "industry": "Semiconductors", "location": "Hyderabad", "type": "Full-Time",
        "salary": "₹35 LPA", "skills": ["CUDA", "Python", "AWS", "Linux"],
        "cgpa_cutoff": 8.5, "applicants_count": 127, "posted_at": "1 day ago",
        "deadline": future_date(17), "openings": 3,
    },
    {
        "id": "c014", "title": "Business Analyst", "company": "McKinsey",
        "industry": "Consulting", "location": "Mumbai", "type": "Full-Time",
        "salary": "₹18 LPA", "skills": ["Excel", "SQL", "PowerPoint", "Analytics"],
        "cgpa_cutoff": 7.5, "applicants_count": 278, "posted_at": "3 days ago",
        "deadline": future_date(13), "openings": 4,
    },
    {
        "id": "c015", "title": "SDE Intern", "company": "Microsoft",
        "industry": "Technology", "location": "Hyderabad", "type": "Internship",
        "salary": "₹80k/month", "skills": ["C#", ".NET", "Azure", "SQL"],
        "cgpa_cutoff": 8.0, "applicants_count": 367, "posted_at": "Today",
        "deadline": future_date(24), "openings": 6,
    },
    {
        "id": "c016", "title": "Cybersecurity Analyst", "company": "Cisco",
        "industry": "Networking", "location": "Bangalore", "type": "Full-Time",
        "salary": "₹16 LPA", "skills": ["Network Security", "Python", "SIEM", "Firewalls"],
        "cgpa_cutoff": 7.0, "applicants_count": 192, "posted_at": "5 days ago",
        "deadline": future_date(23), "openings": 5,
    },
    {
        "id": "c017", "title": "Data Engineer", "company": "Salesforce",
        "industry": "CRM/SaaS", "location": "Hyderabad", "type": "Full-Time",
        "salary": "₹20 LPA", "skills": ["SQL", "Spark", "Python", "Airflow"],
        "cgpa_cutoff": 7.0, "applicants_count": 214, "posted_at": "2 days ago",
        "deadline": future_date(26), "openings": 6,
    },
    {
        "id": "c018", "title": "QA Engineer Intern", "company": "Adobe",
        "industry": "Technology", "location": "Noida", "type": "Internship",
        "salary": "₹45k/month", "skills": ["Selenium", "Python", "JIRA", "Postman"],
        "cgpa_cutoff": 6.5, "applicants_count": 168, "posted_at": "4 days ago",
        "deadline": future_date(20), "openings": 4,
    },
    {
        "id": "c019", "title": "Software Engineer", "company": "Atlassian",
        "industry": "Software/SaaS", "location": "Remote", "type": "Full-Time",
        "salary": "₹21 LPA", "skills": ["Python", "Java", "Microservices", "AWS"],
        "cgpa_cutoff": 7.0, "applicants_count": 244, "posted_at": "Today",
        "deadline": future_date(29), "openings": 7,
    },
    {
        "id": "c020", "title": "ML Engineer Intern", "company": "Google",
        "industry": "Technology", "location": "Bangalore", "type": "Internship",
        "salary": "₹75k/month", "skills": ["Python", "TensorFlow", "PyTorch", "ML"],
        "cgpa_cutoff": 8.0, "applicants_count": 497, "posted_at": "1 day ago",
        "deadline": future_date(11), "openings": 4,
    },
    {
        "id": "c021", "title": "System Design Engineer", "company": "Zomato",
        "industry": "FoodTech", "location": "Gurgaon", "type": "Full-Time",
        "salary": "₹16 LPA", "skills": ["Java", "System Design", "Kafka", "Redis"],
        "cgpa_cutoff": 7.0, "applicants_count": 312, "posted_at": "3 days ago",
        "deadline": future_date(18), "openings": 8,
    },
    {
        "id": "c022", "title": "Back-End Engineer", "company": "Zerodha",
        "industry": "FinTech", "location": "Bangalore", "type": "Full-Time",
        "salary": "₹14 LPA", "skills": ["Go", "Python", "PostgreSQL", "Redis"],
        "cgpa_cutoff": 6.5, "applicants_count": 189, "posted_at": "2 days ago",
        "deadline": future_date(22), "openings": 4,
    },
    {
        "id": "c023", "title": "Strategy Analyst", "company": "Bain & Company",
        "industry": "Consulting", "location": "Mumbai", "type": "Full-Time",
        "salary": "₹20 LPA", "skills": ["Excel", "PowerPoint", "Modeling", "Analytics"],
        "cgpa_cutoff": 8.0, "applicants_count": 143, "posted_at": "5 days ago",
        "deadline": future_date(9), "openings": 3,
    },
    {
        "id": "c024", "title": "DevOps Intern", "company": "Meesho",
        "industry": "E-Commerce", "location": "Bangalore", "type": "Internship",
        "salary": "₹50k/month", "skills": ["Docker", "AWS", "CI/CD", "Python"],
        "cgpa_cutoff": 6.5, "applicants_count": 221, "posted_at": "Today",
        "deadline": future_date(27), "openings": 6,
    },
    {
        "id": "c025", "title": "Embedded Systems Engineer", "company": "NVIDIA",
        "industry": "Semiconductors", "location": "Pune", "type": "Full-Time",
        "salary": "₹22 LPA", "skills": ["C", "C++", "RTOS", "CUDA", "Linux"],
        "cgpa_cutoff": 8.0, "applicants_count": 98, "posted_at": "3 days ago",
        "deadline": future_date(16), "openings": 2,
    },
]

# ─── Generated Jobs ────────────────────────────────────────────────────────────

def build_generated_job(idx):
    company = random.choice(COMPANIES)
    role = random.choice(ROLES)
    location = random.choice(LOCATIONS)
    job_type = random.choices(["Full-Time", "Internship", "Contract"], weights=[65, 25, 10], k=1)[0]
    skills = SKILLS_MAP.get(role, ["Python", "SQL", "Communication"])
    # Pick 2-4 skills
    chosen_skills = random.sample(skills, min(len(skills), random.randint(2, 4)))
    salary = build_salary(role, job_type, company)
    cgpa_cutoff = round(random.choice([6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0]), 1)
    posted_days = random.randint(0, 14)
    deadline_days = random.randint(7, 30)
    applicants = random.randint(50, 500)
    openings = random.randint(1, 15)

    return {
        "id": f"g{idx:04d}",
        "title": role,
        "company": company,
        "industry": INDUSTRIES.get(company, "Technology"),
        "location": location,
        "type": job_type,
        "salary": salary,
        "skills": chosen_skills,
        "cgpa_cutoff": cgpa_cutoff,
        "applicants_count": applicants,
        "posted_at": days_ago_label(posted_days),
        "deadline": future_date(deadline_days),
        "openings": openings,
    }

# Build full dataset
generated = [build_generated_job(i) for i in range(1, 226)]

all_jobs = CURATED + generated

# Deduplicate by keeping unique id (curated + generated already unique)
random.shuffle(all_jobs)  # Mix curated and generated

# Re-assign sequential ids for frontend
for i, job in enumerate(all_jobs):
    job["id"] = f"job_{i+1:04d}"

output_dir = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'public', 'data')
os.makedirs(output_dir, exist_ok=True)
output_path = os.path.join(output_dir, 'jobs.json')

with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(all_jobs, f, indent=2, ensure_ascii=False)

print(f"Generated {len(all_jobs)} jobs -> {output_path}")
print(f"  Curated:   {len(CURATED)}")
print(f"  Generated: {len(generated)}")
print(f"  Types: Full-Time={sum(1 for j in all_jobs if j['type']=='Full-Time')}, "
      f"Internship={sum(1 for j in all_jobs if j['type']=='Internship')}, "
      f"Contract={sum(1 for j in all_jobs if j['type']=='Contract')}")
