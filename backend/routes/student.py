# ============================================================
# routes/student.py — Student Portal API
# ============================================================

from flask import Blueprint, request, session, jsonify
from db import query, get_connection

student_bp = Blueprint("student", __name__)


# ----------------------------------------------------------
# Guard: only logged-in students can access these routes
# ----------------------------------------------------------
def student_required():
    if "user_id" not in session:
        return jsonify({"error": "Please log in"}), 401
    if session.get("role") != "student":
        return jsonify({"error": "Access denied: students only"}), 403
    return None


# ----------------------------------------------------------
# GET /api/student/profile
# ----------------------------------------------------------
@student_bp.route("/profile", methods=["GET"])
def get_profile():
    err = student_required()
    if err: return err

    student = query(
        "SELECT * FROM Students WHERE student_id = %s",
        (session["entity_id"],), fetchone=True
    )
    if not student:
        return jsonify({"error": "Student not found"}), 404
    return jsonify(student), 200


# ----------------------------------------------------------
# PUT /api/student/profile
# Body: any updatable fields (phone, resume_url, cgpa, etc.)
# ----------------------------------------------------------
@student_bp.route("/profile", methods=["PUT"])
def update_profile():
    err = student_required()
    if err: return err

    data    = request.get_json()
    allowed = ["phone", "resume_url", "cgpa", "backlogs"]
    updates = {k: v for k, v in data.items() if k in allowed}

    if not updates:
        return jsonify({"error": "No valid fields to update"}), 400

    set_clause = ", ".join(f"{k} = %s" for k in updates)
    values     = list(updates.values()) + [session["entity_id"]]

    query(f"UPDATE Students SET {set_clause} WHERE student_id = %s",
          values, commit=True)

    return jsonify({"message": "Profile updated"}), 200


# ----------------------------------------------------------
# GET /api/student/skills
# ----------------------------------------------------------
@student_bp.route("/skills", methods=["GET"])
def get_skills():
    err = student_required()
    if err: return err

    skills = query(
        """SELECT sk.skill_id, sk.skill_name, sk.skill_type, sm.proficiency
           FROM Skill_Mappings sm
           JOIN Skills sk ON sm.skill_id = sk.skill_id
           WHERE sm.entity_type = 'Student' AND sm.entity_id = %s
           ORDER BY sk.skill_type, sk.skill_name""",
        (session["entity_id"],), fetchall=True
    )
    return jsonify(skills), 200


# ----------------------------------------------------------
# POST /api/student/skills
# Body: { "skill_name": "Python", "skill_type": "Technical",
#         "proficiency": "Intermediate" }
# ----------------------------------------------------------
@student_bp.route("/skills", methods=["POST"])
def add_skill():
    err = student_required()
    if err: return err

    data       = request.get_json()
    skill_name = data.get("skill_name", "").strip()
    skill_type = data.get("skill_type", "Technical")
    proficiency = data.get("proficiency")

    if not skill_name:
        return jsonify({"error": "skill_name is required"}), 400

    # Get or create skill
    skill = query("SELECT skill_id FROM Skills WHERE skill_name = %s",
                  (skill_name,), fetchone=True)
    if skill:
        skill_id = skill["skill_id"]
    else:
        skill_id = query(
            "INSERT INTO Skills (skill_name, skill_type) VALUES (%s, %s)",
            (skill_name, skill_type), commit=True
        )

    # Check already mapped
    exists = query(
        "SELECT mapping_id FROM Skill_Mappings WHERE skill_id=%s AND entity_type='Student' AND entity_id=%s",
        (skill_id, session["entity_id"]), fetchone=True
    )
    if exists:
        return jsonify({"error": "Skill already added"}), 409

    query(
        "INSERT INTO Skill_Mappings (skill_id, entity_type, entity_id, proficiency) VALUES (%s,'Student',%s,%s)",
        (skill_id, session["entity_id"], proficiency), commit=True
    )
    return jsonify({"message": "Skill added"}), 201


# ----------------------------------------------------------
# DELETE /api/student/skills/<skill_id>
# ----------------------------------------------------------
@student_bp.route("/skills/<int:skill_id>", methods=["DELETE"])
def delete_skill(skill_id):
    err = student_required()
    if err: return err

    query(
        "DELETE FROM Skill_Mappings WHERE skill_id=%s AND entity_type='Student' AND entity_id=%s",
        (skill_id, session["entity_id"]), commit=True
    )
    return jsonify({"message": "Skill removed"}), 200


# ----------------------------------------------------------
# GET /api/student/projects
# ----------------------------------------------------------
@student_bp.route("/projects", methods=["GET"])
def get_projects():
    err = student_required()
    if err: return err

    projects = query(
        "SELECT * FROM Student_Projects WHERE student_id = %s ORDER BY end_date DESC",
        (session["entity_id"],), fetchall=True
    )
    return jsonify(projects), 200


# ----------------------------------------------------------
# POST /api/student/projects
# Body: { "project_title":"...", "description":"...",
#         "technologies":"...", "project_url":"...",
#         "start_date":"2024-01-01", "end_date":"2024-06-01" }
# ----------------------------------------------------------
@student_bp.route("/projects", methods=["POST"])
def add_project():
    err = student_required()
    if err: return err

    data = request.get_json()
    if not data.get("project_title"):
        return jsonify({"error": "project_title is required"}), 400

    query(
        """INSERT INTO Student_Projects
           (student_id, project_title, description, technologies, project_url, start_date, end_date)
           VALUES (%s,%s,%s,%s,%s,%s,%s)""",
        (session["entity_id"], data["project_title"], data.get("description"),
         data.get("technologies"), data.get("project_url"),
         data.get("start_date"), data.get("end_date")),
        commit=True
    )
    return jsonify({"message": "Project added"}), 201


# ----------------------------------------------------------
# DELETE /api/student/projects/<project_id>
# ----------------------------------------------------------
@student_bp.route("/projects/<int:project_id>", methods=["DELETE"])
def delete_project(project_id):
    err = student_required()
    if err: return err

    query(
        "DELETE FROM Student_Projects WHERE project_id=%s AND student_id=%s",
        (project_id, session["entity_id"]), commit=True
    )
    return jsonify({"message": "Project deleted"}), 200


# ----------------------------------------------------------
# GET /api/student/internships
# ----------------------------------------------------------
@student_bp.route("/internships", methods=["GET"])
def get_internships():
    err = student_required()
    if err: return err

    internships = query(
        "SELECT * FROM Internships WHERE student_id = %s ORDER BY start_date DESC",
        (session["entity_id"],), fetchall=True
    )
    return jsonify(internships), 200


# ----------------------------------------------------------
# POST /api/student/internships
# Body: { "company_name":"...", "role":"...",
#         "start_date":"2024-01-01", "end_date":"2024-06-01",
#         "stipend": 15000, "description":"..." }
# ----------------------------------------------------------
@student_bp.route("/internships", methods=["POST"])
def add_internship():
    err = student_required()
    if err: return err

    data = request.get_json()
    if not data.get("company_name") or not data.get("start_date"):
        return jsonify({"error": "company_name and start_date are required"}), 400

    query(
        """INSERT INTO Internships
           (student_id, company_name, role, start_date, end_date, stipend, description)
           VALUES (%s,%s,%s,%s,%s,%s,%s)""",
        (session["entity_id"], data["company_name"], data.get("role"),
         data["start_date"], data.get("end_date"),
         data.get("stipend"), data.get("description")),
        commit=True
    )
    return jsonify({"message": "Internship added"}), 201


# ----------------------------------------------------------
# GET /api/student/jobs/search
# ----------------------------------------------------------
@student_bp.route("/jobs/search", methods=["GET"])
def search_jobs():
    err = student_required()
    if err: return err

    student_id = session["entity_id"]
    search = request.args.get('search', '').strip()
    roles = request.args.get('roles', '')
    min_cgpa = request.args.get('minCgpa')
    sort = request.args.get('sort', 'recent')

    sql = """
        SELECT
            jp.job_id AS id,
            jp.job_title AS title,
            jp.job_description AS description,
            c.company_name AS company,
            jp.location,
            jp.job_type AS type,
            ROUND(jp.ctc_fixed + jp.ctc_variable, 2) AS total_ctc_numeric,
            jp.min_cgpa AS cgpa_cutoff,
            jp.openings,
            (SELECT COUNT(*) FROM Applications a WHERE a.job_id = jp.job_id) AS applicants_count,
            (SELECT CASE WHEN COUNT(*) > 0 THEN 'Applied' ELSE NULL END FROM Applications a2 WHERE a2.job_id = jp.job_id AND a2.student_id = %s) AS apply_status,
            jp.created_at,
            jp.application_deadline,
            GROUP_CONCAT(sk.skill_name SEPARATOR ',') AS skills_csv
        FROM Job_Postings jp
        JOIN Companies c ON jp.company_id = c.company_id
        LEFT JOIN Skill_Mappings sm ON sm.entity_type = 'Job' AND sm.entity_id = jp.job_id
        LEFT JOIN Skills sk ON sk.skill_id = sm.skill_id
        WHERE jp.is_approved = TRUE
    """
    params = [student_id]

    if search:
        sql += """
            AND (
                jp.job_title LIKE %s
                OR c.company_name LIKE %s
                OR EXISTS (
                    SELECT 1 FROM Skill_Mappings sm2
                    JOIN Skills sk2 ON sk2.skill_id = sm2.skill_id
                    WHERE sm2.entity_type = 'Job' AND sm2.entity_id = jp.job_id
                    AND sk2.skill_name LIKE %s
                )
            )
        """
        like_search = f"%{search}%"
        params.extend([like_search, like_search, like_search])

    if roles:
        role_list = [r.strip() for r in roles.split(',') if r.strip()]
        if role_list:
            placeholders = ','.join(['%s'] * len(role_list))
            sql += f" AND jp.job_type IN ({placeholders})"
            params.extend(role_list)

    if min_cgpa:
        try:
            val = float(min_cgpa)
            sql += " AND jp.min_cgpa <= %s"
            params.append(val)
        except ValueError:
            pass

    sql += " GROUP BY jp.job_id"

    if sort == 'deadline':
        sql += " ORDER BY jp.application_deadline ASC"
    elif sort == 'salary':
        sql += " ORDER BY total_ctc_numeric DESC"
    else: # recent
        sql += " ORDER BY jp.created_at DESC"

    results = query(sql, tuple(params), fetchall=True)

    from datetime import datetime
    def format_posted_at(dt):
        if not dt: return ""
        now = datetime.now()
        diff = (now - dt).days
        if diff <= 0: return "Today"
        if diff == 1: return "1 day ago"
        return f"{diff} days ago"
        
    def format_salary(num):
        if not num: return ""
        if num >= 100000:
            return f"₹{(num / 100000):g} LPA"
        return f"₹{int(num)}/month"

    def format_deadline(dt):
        if not dt: return ""
        return dt.strftime('%Y-%m-%d')

    final_results = []
    for r in results:
        final_results.append({
            "id": str(r["id"]),
            "title": r["title"],
            "description": r["description"],
            "company": r["company"],
            "location": r["location"],
            "type": r["type"],
            "salary": format_salary(r["total_ctc_numeric"]),
            "skills": [s for s in r["skills_csv"].split(',')] if r["skills_csv"] else [],
            "cgpa_cutoff": float(r["cgpa_cutoff"]),
            "applicants_count": r["applicants_count"],
            "apply_status": r["apply_status"],
            "posted_at": format_posted_at(r["created_at"]),
            "deadline": format_deadline(r["application_deadline"]),
            "openings": r["openings"]
        })

    return jsonify(final_results), 200

# ----------------------------------------------------------
# GET /api/student/jobs/eligible
# Lists all jobs this student is qualified for
# ----------------------------------------------------------
@student_bp.route("/jobs/eligible", methods=["GET"])
def eligible_jobs():
    err = student_required()
    if err: return err

    student_id = session["entity_id"]

    jobs = query(
        """SELECT
               jp.job_id, c.company_name, c.industry,
               jp.job_title, jp.location, jp.job_type,
               ROUND(jp.ctc_fixed + jp.ctc_variable, 2) AS total_ctc,
               jp.min_cgpa, jp.openings, jp.application_deadline,
               CASE WHEN a.application_id IS NOT NULL THEN 'Applied' ELSE 'Eligible' END AS apply_status
           FROM Job_Postings jp
           JOIN Companies c ON jp.company_id = c.company_id
           JOIN Students s  ON s.student_id = %s
               AND s.cgpa >= jp.min_cgpa
               AND s.backlogs <= COALESCE(jp.max_backlogs, 0)
               AND (jp.eligible_depts IS NULL OR jp.eligible_depts = ''
                    OR FIND_IN_SET(s.department, jp.eligible_depts) > 0)
               AND (jp.eligible_grad_years IS NULL OR jp.eligible_grad_years = ''
                    OR FIND_IN_SET(CAST(s.graduation_year AS CHAR), jp.eligible_grad_years) > 0)
           LEFT JOIN Applications a ON a.job_id = jp.job_id AND a.student_id = %s
           WHERE jp.is_approved = TRUE
             AND (jp.application_deadline IS NULL OR jp.application_deadline >= CURDATE())
           ORDER BY jp.application_deadline ASC, total_ctc DESC""",
        (student_id, student_id), fetchall=True
    )
    return jsonify(jobs), 200


# ----------------------------------------------------------
# POST /api/student/jobs/apply
# Body: { "job_id": 3 }
# Uses stored procedure sp_apply_to_job
# ----------------------------------------------------------
@student_bp.route("/jobs/apply", methods=["POST"])
def apply_job():
    err = student_required()
    if err: return err

    data   = request.get_json()
    job_id = data.get("job_id")
    if not job_id:
        return jsonify({"error": "job_id is required"}), 400

    student_id = session["entity_id"]

    # Check if exists
    exists = query("SELECT application_id FROM Applications WHERE student_id=%s AND job_id=%s", (student_id, job_id), fetchone=True)
    if exists:
        return jsonify({"error": "Already applied"}), 400
    
    # Check if job exists
    job = query("SELECT application_deadline FROM Job_Postings WHERE job_id=%s AND is_approved=TRUE", (job_id,), fetchone=True)
    if not job:
        return jsonify({"error": "Job not found"}), 404

    # Insert
    query("INSERT INTO Applications (student_id, job_id, status) VALUES (%s, %s, 'Applied')", (student_id, job_id), commit=True)

    return jsonify({"success": True, "message": "Application submitted"}), 201


# ----------------------------------------------------------
# GET /api/student/applications
# Shows all applications + status for the logged-in student
# ----------------------------------------------------------
@student_bp.route("/applications", methods=["GET"])
def my_applications():
    err = student_required()
    if err: return err

    apps = query(
        """SELECT
               a.application_id, a.status, a.applied_at,
               jp.job_title, jp.location, jp.job_type,
               ROUND(jp.ctc_fixed + jp.ctc_variable, 2) AS total_ctc,
               c.company_name
           FROM Applications a
           JOIN Job_Postings jp ON a.job_id = jp.job_id
           JOIN Companies c     ON jp.company_id = c.company_id
           WHERE a.student_id = %s
           ORDER BY a.applied_at DESC""",
        (session["entity_id"],), fetchall=True
    )
    return jsonify(apps), 200


# ----------------------------------------------------------
# GET /api/student/applications/<application_id>/interviews
# See interview rounds & results for one application
# ----------------------------------------------------------
@student_bp.route("/applications/<int:application_id>/interviews", methods=["GET"])
def my_interview_rounds(application_id):
    err = student_required()
    if err: return err

    # Make sure this application belongs to the student
    app = query(
        "SELECT application_id FROM Applications WHERE application_id=%s AND student_id=%s",
        (application_id, session["entity_id"]), fetchone=True
    )
    if not app:
        return jsonify({"error": "Application not found"}), 404

    rounds = query(
        """SELECT ir.round_id, ir.round_number, ir.round_type,
                  ir.scheduled_at, ir.venue, ir.interviewer, ir.status,
                  ires.score, ires.feedback, ires.outcome
           FROM Interview_Rounds ir
           LEFT JOIN Interview_Results ires ON ir.round_id = ires.round_id
           WHERE ir.application_id = %s
           ORDER BY ir.round_number""",
        (application_id,), fetchall=True
    )
    return jsonify(rounds), 200


# ----------------------------------------------------------
# GET /api/student/dashboard
# Stat cards for the student portal (Q28)
# ----------------------------------------------------------
@student_bp.route("/dashboard", methods=["GET"])
def dashboard():
    err = student_required()
    if err: return err

    stats = query(
        """SELECT
               COUNT(*) AS total_applied,
               SUM(CASE WHEN status='Shortlisted'         THEN 1 ELSE 0 END) AS shortlisted,
               SUM(CASE WHEN status='Interview_Scheduled' THEN 1 ELSE 0 END) AS interviews_scheduled,
               SUM(CASE WHEN status='Selected'            THEN 1 ELSE 0 END) AS selected,
               SUM(CASE WHEN status='Rejected'            THEN 1 ELSE 0 END) AS rejected,
               SUM(CASE WHEN status='Offer_Accepted'      THEN 1 ELSE 0 END) AS offers_accepted
           FROM Applications WHERE student_id = %s""",
        (session["entity_id"],), fetchone=True
    )
    return jsonify(stats), 200


# ----------------------------------------------------------
# GET /api/student/offers
# List placement offers for the logged-in student
# ----------------------------------------------------------
@student_bp.route("/offers", methods=["GET"])
def my_offers():
    err = student_required()
    if err: return err

    offers = query(
        """SELECT
               p.placement_id,
               p.application_id,
               p.ctc_fixed,
               p.ctc_variable,
               (p.ctc_fixed + p.ctc_variable) AS total_ctc,
               p.joining_date,
               p.offer_letter_url,
               p.offer_status,
               p.placed_at,
               jp.job_title,
               c.company_name
           FROM Placements p
           JOIN Applications a ON p.application_id = a.application_id
           JOIN Job_Postings jp ON a.job_id = jp.job_id
           JOIN Companies c ON jp.company_id = c.company_id
           WHERE p.student_id = %s
           ORDER BY p.placed_at DESC""",
        (session["entity_id"],), fetchall=True
    )
    return jsonify(offers), 200


# ----------------------------------------------------------
# PUT /api/student/offers/<placement_id>/respond
# Body: { "decision": "Accepted" | "Declined" }
# ----------------------------------------------------------
@student_bp.route("/offers/<int:placement_id>/respond", methods=["PUT"])
def respond_offer(placement_id):
    err = student_required()
    if err: return err

    data = request.get_json()
    decision = data.get("decision")
    if decision not in ("Accepted", "Declined"):
        return jsonify({"error": "decision must be Accepted or Declined"}), 400

    offer = query(
        "SELECT placement_id, offer_status FROM Placements WHERE placement_id=%s AND student_id=%s",
        (placement_id, session["entity_id"]), fetchone=True
    )
    if not offer:
        return jsonify({"error": "Offer not found"}), 404

    if offer["offer_status"] != "Extended":
        return jsonify({"error": "Only Extended offers can be responded to"}), 400

    query(
        "UPDATE Placements SET offer_status=%s WHERE placement_id=%s",
        (decision, placement_id), commit=True
    )

    # Keep application status consistent for key student workflow screens
    app_id_row = query("SELECT application_id FROM Placements WHERE placement_id=%s", (placement_id,), fetchone=True)
    if app_id_row:
        new_app_status = "Offer_Accepted" if decision == "Accepted" else "Offer_Declined"
        query("UPDATE Applications SET status=%s WHERE application_id=%s", (new_app_status, app_id_row["application_id"]), commit=True)

    return jsonify({"message": f"Offer {decision.lower()}"}), 200


# ----------------------------------------------------------
# GET /api/student/analytics
# Personal career analytics for the student dashboard
# ----------------------------------------------------------
@student_bp.route("/analytics", methods=["GET"])
def analytics():
    err = student_required()
    if err: return err

    student_id = session["entity_id"]

    # Application funnel
    funnel = query(
        """SELECT
               COUNT(*) AS total_applied,
               SUM(CASE WHEN status IN ('Shortlisted','Interview_Scheduled','Selected','Offer_Accepted','Offer_Declined') THEN 1 ELSE 0 END) AS shortlisted,
               SUM(CASE WHEN status IN ('Interview_Scheduled','Selected','Offer_Accepted','Offer_Declined') THEN 1 ELSE 0 END) AS interviewed,
               SUM(CASE WHEN status IN ('Selected','Offer_Accepted') THEN 1 ELSE 0 END) AS selected,
               SUM(CASE WHEN status = 'Offer_Accepted' THEN 1 ELSE 0 END) AS offers_accepted,
               SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) AS rejected
           FROM Applications WHERE student_id = %s""",
        (student_id,), fetchone=True
    )

    # Monthly application activity (last 6 months)
    monthly = query(
        """SELECT YEAR(applied_at) AS yr, MONTH(applied_at) AS mo,
                  MONTHNAME(applied_at) AS month_name,
                  COUNT(*) AS applications
           FROM Applications
           WHERE student_id = %s
             AND applied_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
           GROUP BY YEAR(applied_at), MONTH(applied_at), MONTHNAME(applied_at)
           ORDER BY yr, mo""",
        (student_id,), fetchall=True
    )

    # Top skills matched across jobs I applied to
    top_skills = query(
        """SELECT sk.skill_name, sk.skill_type, COUNT(*) AS job_count
           FROM Applications a
           JOIN Skill_Mappings sm ON sm.entity_type='Job' AND sm.entity_id=a.job_id
           JOIN Skills sk ON sk.skill_id = sm.skill_id
           WHERE a.student_id = %s
           GROUP BY sk.skill_id, sk.skill_name, sk.skill_type
           ORDER BY job_count DESC
           LIMIT 8""",
        (student_id,), fetchall=True
    )

    # My skills for gap analysis
    my_skills = query(
        """SELECT sk.skill_name
           FROM Skill_Mappings sm
           JOIN Skills sk ON sm.skill_id = sk.skill_id
           WHERE sm.entity_type = 'Student' AND sm.entity_id = %s""",
        (student_id,), fetchall=True
    )
    my_skill_names = {s["skill_name"] for s in my_skills}

    # Enrich top_skills with gap flag
    enriched_skills = []
    for s in top_skills:
        enriched_skills.append({
            **s,
            "i_have_it": s["skill_name"] in my_skill_names
        })

    return jsonify({
        "funnel": funnel,
        "monthly_activity": monthly,
        "top_skills_in_applied_jobs": enriched_skills
    }), 200