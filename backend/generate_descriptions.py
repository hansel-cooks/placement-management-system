import os, random
from dotenv import load_dotenv
import mysql.connector

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

descriptions = [
    """**About the Role:**
We are looking for a passionate builder to join our core engineering team. You will be responsible for designing and scaling high-performance APIs and maintaining our crucial infrastructure.

**Key Responsibilities:**
- Architect and deploy scalable backend microservices
- Collaborate closely with product and design teams
- Write clean, maintainable, and heavily tested code
- Mentor junior engineers and participate in code reviews

**Requirements:**
- Strong problem-solving skills and a deep understanding of data structures
- Experience with agile development methodologies
- Excellent communication and teamwork abilities""",
    """**About the Role:**
Join our fast-paced product team to build user-centric features from scratch. We need someone who obsesses over pixel-perfect UI and seamless user experiences.

**Key Responsibilities:**
- Translate Figma designs into high-quality, responsive code
- Build reusable UI components for our internal design system
- Optimize application performance for maximum speed and scalability

**Requirements:**
- Deep expertise in modern frontend frameworks and responsive design
- Strong eye for UI/UX heuristics
- Passion for learning and adopting new web technologies""",
    """**About the Role:**
We are seeking a highly analytical mind to join our data science organization. You will leverage massive datasets to unlock actionable business insights and train predictive models.

**Key Responsibilities:**
- Develop and deploy robust machine learning models
- Build complex data pipelines and ETL processes
- Design A/B tests to measure impact of new feature rollouts

**Requirements:**
- Strong foundation in statistical analysis and probability
- Proficiency with modern data manipulation libraries
- Ability to convey complex findings to non-technical stakeholders""",
    """**About the Role:**
We are searching for a versatile engineer who can comfortably span the entire stack. From tuning raw SQL queries to refining CSS animations, you will own features end-to-end.

**Key Responsibilities:**
- Develop end-to-end features spanning both database design and frontend rendering
- Instrument robust application monitoring and logging
- Lead architectural decisions for new product initiatives

**Requirements:**
- Ability to rapidly context-switch between disparate tech stacks
- Strong opinions on API design and state management
- Dedication to writing comprehensive documentation"""
]

try:
    cur.execute("SELECT job_id FROM Job_Postings")
    jobs = cur.fetchall()
    
    for job in jobs:
        desc = random.choice(descriptions)
        cur.execute(
            "UPDATE Job_Postings SET job_description = %s WHERE job_id = %s",
            (desc, job['job_id'])
        )
    
    conn.commit()
    print(f"Successfully updated descriptions for {len(jobs)} jobs.")
except Exception as e:
    print("Error:", e)
finally:
    cur.close()
    conn.close()
