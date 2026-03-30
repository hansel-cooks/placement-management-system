import os, random, datetime, string
from dotenv import load_dotenv
import mysql.connector

# Ensure we're connecting from the backend dir
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path)

db_password = os.getenv('DB_PASSWORD', '')
if ' ' in db_password:
    db_password = db_password.split()[0]

conn = mysql.connector.connect(
    host='localhost', port=3306, user='root',
    password=db_password, database='placement_db'
)
cur = conn.cursor(dictionary=True)

print("Clearing old job postings and skills mappings...")
# Delete existing jobs (cascade or just delete mappings first)
cur.execute("DELETE FROM Skill_Mappings WHERE entity_type='Job'")
cur.execute("DELETE FROM Job_Postings")
conn.commit()

# Ensure we have companies
cur.execute("SELECT company_id, company_name FROM Companies")
companies = cur.fetchall()

if not companies:
    print("Generating 25 Companies...")
    cnames = [
        "TechEdge Innovations", "Apex Cloud", "Nexus AI", "Global Finance Corp", 
        "Quantum Data Systems", "Zenith e-Commerce", "Alpha FinTech", "Stellar Robotics",
        "Pioneer AI", "Cyborg Security", "Vanguard Media", "Horizon Biotech",
        "Future Logistics", "Metro Capital", "Titan Networks", "Prism Healthcare",
        "Velocity Gaming", "Eon Dynamics", "Aegis Consulting", "Aura Fintech"
    ]
    for n in cnames:
        cur.execute(
            "INSERT INTO Companies (company_name, industry) VALUES (%s, %s)",
            (n, random.choice(["IT", "Finance", "Healthcare", "Consulting", "E-commerce"]))
        )
    conn.commit()
    cur.execute("SELECT company_id FROM Companies")
    companies = cur.fetchall()

company_ids = [c['company_id'] for c in companies]

print("Ensuring 30 Skills exist...")
skill_names = [
    "Python", "Java", "C++", "JavaScript", "TypeScript", "React", "Angular", "Vue",
    "Node.js", "Django", "Flask", "Spring Boot", "SQL", "NoSQL", "MongoDB", "PostgreSQL",
    "Docker", "Kubernetes", "AWS", "Azure", "GCP", "Machine Learning", "Data Analysis",
    "TailwindCSS", "System Design", "Agile", "REST APIs", "GraphQL", "Redis", "Figma"
]

cur.execute("SELECT skill_id, skill_name FROM Skills")
existing_skills = {r['skill_name']: r['skill_id'] for r in cur.fetchall()}

skill_ids = []
for sn in skill_names:
    if sn not in existing_skills:
        cur.execute("INSERT INTO Skills (skill_name, skill_type) VALUES (%s, 'Technical')", (sn,))
        conn.commit()
        skill_ids.append(cur.lastrowid)
    else:
        skill_ids.append(existing_skills[sn])

print(f"Generating 250 Jobs...")
job_titles = [
    "Software Engineer", "Backend Developer", "Frontend Developer", "Full Stack Engineer",
    "Data Scientist", "Machine Learning Engineer", "DevOps Engineer", "Cloud Architect",
    "Product Manager", "UI/UX Designer", "Business Analyst", "Marketing Associate",
    "Finance Analyst", "Cybersecurity Analyst", "Systems Engineer", "Mobile Developer",
    "QA Engineer", "Data Analyst", "SRE", "Blockchain Developer"
]

types = ["Full-Time", "Internship", "Contract"]
today = datetime.date.today()

for i in range(250):
    c_id = random.choice(company_ids)
    suffixes = [" I", " II", " Senior", ""]
    title = random.choice(job_titles) + (random.choice(suffixes) if random.random() > 0.5 else "")
    j_type = random.choice(types)
    loc = random.choice(["Bengaluru", "Mumbai", "Pune", "Gurgaon", "Hyderabad", "Chennai", "Remote"])
    
    # Salary logic: CTC fixed
    if j_type == "Internship":
        ctc = random.randint(15000, 80000) # Monthly mapped as stipend
    else:
        ctc = random.randint(5, 45) * 100000 # LPA
        
    cgpa = random.choice([0.0, 7.0, 7.5, 8.0, 8.5, 9.0])
    openings = random.randint(1, 15)
    
    # Dates
    deadline_offset = random.randint(-5, 60)
    deadline = today + datetime.timedelta(days=deadline_offset)
    
    posted_offset = random.randint(0, 30)
    created_at = datetime.datetime.now() - datetime.timedelta(days=posted_offset)
    
    cur.execute(
        """INSERT INTO Job_Postings 
           (company_id, job_title, job_description, location, job_type, ctc_fixed, min_cgpa, openings, application_deadline, created_at, is_approved)
           VALUES (%s, %s, 'Generated job description.', %s, %s, %s, %s, %s, %s, %s, TRUE)""",
        (c_id, title, loc, j_type, ctc, cgpa, openings, deadline, created_at)
    )
    job_id = cur.lastrowid
    
    # 3-5 random skills per job
    job_skills = random.sample(skill_ids, random.randint(3, 5))
    for s_id in job_skills:
        cur.execute(
            "INSERT INTO Skill_Mappings (skill_id, entity_type, entity_id, proficiency) VALUES (%s, 'Job', %s, 'Intermediate')",
            (s_id, job_id)
        )

conn.commit()
print("Done seeding 250 jobs with skills.")

# Create Indexes safely
indexes = [
    ("idx_jp_type", "Job_Postings", "job_type"),
    ("idx_jp_cgpa", "Job_Postings", "min_cgpa"),
    ("idx_jp_created", "Job_Postings", "created_at"),
    ("idx_jp_deadline", "Job_Postings", "application_deadline"),
    ("idx_sm_entity", "Skill_Mappings", "entity_type, entity_id")
]

for name, table, cols in indexes:
    try:
        cur.execute(f"CREATE INDEX {name} ON {table} ({cols})")
        print(f"Index {name} created on {table}.")
    except Exception as e:
        print(f"Index {name} skipped (likely exists).")

conn.commit()
conn.close()
