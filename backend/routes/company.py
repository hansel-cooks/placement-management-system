# ============================================================
# routes/company.py — Company Portal API
# ============================================================

from flask import Blueprint, request, session, jsonify
from db import query, get_connection
import csv
import io

company_bp = Blueprint("company", __name__)


# ----------------------------------------------------------
# Guard: only logged-in companies can access these routes
# ----------------------------------------------------------
def company_required():
    if "user_id" not in session:
        return jsonify({"error": "Please log in"}), 401
    if session.get("role") != "company":
        return jsonify({"error": "Access denied: companies only"}), 403
    return None


# ----------------------------------------------------------
# GET /api/company/profile
# ----------------------------------------------------------
@company_bp.route("/profile", methods=["GET"])
def get_profile():
    err = company_required()
    if err: return err

    company = query(
        "SELECT * FROM Companies WHERE company_id = %s",
        (session["entity_id"],), fetchone=True
    )
    if not company:
        return jsonify({"error": "Company not found"}), 404
    return jsonify(company), 200


# ----------------------------------------------------------
# PUT /api/company/profile
# Body: any updatable fields
# ----------------------------------------------------------
@company_bp.route("/profile", methods=["PUT"])
def update_profile():
    err = company_required()
    if err: return err

    data    = request.get_json()
    allowed = ["industry", "website", "hr_name", "hr_email", "hr_phone"]
    updates = {k: v for k, v in data.items() if k in allowed}

    if not updates:
        return jsonify({"error": "No valid fields to update"}), 400

    set_clause = ", ".join(f"{k} = %s" for k in updates)
    values     = list(updates.values()) + [session["entity_id"]]

    query(f"UPDATE Companies SET {set_clause} WHERE company_id = %s",
          values, commit=True)
    return jsonify({"message": "Profile updated"}), 200


# ----------------------------------------------------------
# GET /api/company/jobs
# ----------------------------------------------------------
@company_bp.route("/jobs", methods=["GET"])
def get_jobs():
    err = company_required()
    if err: return err

    jobs = query(
        """SELECT jp.*,
               COUNT(a.application_id) AS total_applications
           FROM Job_Postings jp
           LEFT JOIN Applications a ON jp.job_id = a.job_id
           WHERE jp.company_id = %s
           GROUP BY jp.job_id
           ORDER BY jp.created_at DESC""",
        (session["entity_id"],), fetchall=True
    )
    return jsonify(jobs), 200


# ----------------------------------------------------------
# POST /api/company/jobs
# Body: { "job_title":"...", "job_description":"...",
#         "location":"...", "job_type":"Full-Time",
#         "ctc_fixed":8.0, "ctc_variable":2.0,
#         "min_cgpa":7.0, "eligible_depts":"CS,IT",
#         "eligible_grad_years":"2025",
#         "openings":5, "application_deadline":"2025-09-01" }
# ----------------------------------------------------------
@company_bp.route("/jobs", methods=["POST"])
def post_job():
    err = company_required()
    if err: return err

    data = request.get_json()
    if not data.get("job_title"):
        return jsonify({"error": "job_title is required"}), 400

    # Company must be approved to post jobs
    company = query("SELECT is_approved FROM Companies WHERE company_id=%s",
                    (session["entity_id"],), fetchone=True)
    if not company or not company["is_approved"]:
        return jsonify({"error": "Your company account is pending admin approval"}), 403

    job_id = query(
        """INSERT INTO Job_Postings
           (company_id, job_title, job_description, location, job_type,
            ctc_fixed, ctc_variable, min_cgpa, eligible_depts,
            eligible_grad_years, openings, application_deadline)
           VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
        (session["entity_id"], data["job_title"], data.get("job_description"),
         data.get("location"), data.get("job_type", "Full-Time"),
         data.get("ctc_fixed", 0), data.get("ctc_variable", 0),
         data.get("min_cgpa", 0), data.get("eligible_depts"),
         data.get("eligible_grad_years"), data.get("openings", 1),
         data.get("application_deadline")),
        commit=True
    )
    return jsonify({"message": "Job posted (pending admin approval)", "job_id": job_id}), 201


# ----------------------------------------------------------
# PUT /api/company/jobs/<job_id>
# Update a job posting
# ----------------------------------------------------------
@company_bp.route("/jobs/<int:job_id>", methods=["PUT"])
def update_job(job_id):
    err = company_required()
    if err: return err

    # Verify job belongs to this company
    job = query("SELECT job_id FROM Job_Postings WHERE job_id=%s AND company_id=%s",
                (job_id, session["entity_id"]), fetchone=True)
    if not job:
        return jsonify({"error": "Job not found"}), 404

    data    = request.get_json()
    allowed = ["job_title", "job_description", "location", "job_type",
               "ctc_fixed", "ctc_variable", "min_cgpa", "eligible_depts",
               "eligible_grad_years", "openings", "application_deadline"]
    updates = {k: v for k, v in data.items() if k in allowed}

    if not updates:
        return jsonify({"error": "No valid fields to update"}), 400

    set_clause = ", ".join(f"{k} = %s" for k in updates)
    values     = list(updates.values()) + [job_id]
    query(f"UPDATE Job_Postings SET {set_clause} WHERE job_id = %s", values, commit=True)
    return jsonify({"message": "Job updated"}), 200


# ----------------------------------------------------------
# GET /api/company/jobs/<job_id>/applicants
# All applicants for a specific job with their details
# ----------------------------------------------------------
@company_bp.route("/jobs/<int:job_id>/applicants", methods=["GET"])
def get_applicants(job_id):
    err = company_required()
    if err: return err

    # Verify job belongs to this company
    job = query("SELECT job_id FROM Job_Postings WHERE job_id=%s AND company_id=%s",
                (job_id, session["entity_id"]), fetchone=True)
    if not job:
        return jsonify({"error": "Job not found"}), 404

    applicants = query(
        """SELECT
               a.application_id, a.status, a.applied_at,
               s.student_id, s.full_name, s.email, s.phone,
               s.department, s.graduation_year, s.cgpa, s.backlogs, s.resume_url
           FROM Applications a
           JOIN Students s ON a.student_id = s.student_id
           WHERE a.job_id = %s
           ORDER BY s.cgpa DESC""",
        (job_id,), fetchall=True
    )
    return jsonify(applicants), 200


# ----------------------------------------------------------
# GET /api/company/jobs/<job_id>/applicants.csv
# Export applicants for a job as CSV
# ----------------------------------------------------------
@company_bp.route("/jobs/<int:job_id>/applicants.csv", methods=["GET"])
def export_applicants_csv(job_id):
    err = company_required()
    if err: return err

    job = query("SELECT job_id FROM Job_Postings WHERE job_id=%s AND company_id=%s",
                (job_id, session["entity_id"]), fetchone=True)
    if not job:
        return jsonify({"error": "Job not found"}), 404

    applicants = query(
        """SELECT
               a.application_id, a.status, a.applied_at,
               s.student_id, s.full_name, s.email, s.phone,
               s.department, s.graduation_year, s.cgpa, s.backlogs, s.resume_url
           FROM Applications a
           JOIN Students s ON a.student_id = s.student_id
           WHERE a.job_id = %s
           ORDER BY s.cgpa DESC""",
        (job_id,), fetchall=True
    )

    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=[
        "application_id","status","applied_at",
        "student_id","full_name","email","phone",
        "department","graduation_year","cgpa","backlogs","resume_url"
    ])
    writer.writeheader()
    for row in applicants:
        writer.writerow(row)

    from flask import Response
    csv_data = buf.getvalue()
    buf.close()
    return Response(
        csv_data,
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment; filename=job_{job_id}_applicants.csv"},
    )


# ----------------------------------------------------------
# PUT /api/company/applications/<application_id>/status
# Body: { "status": "Shortlisted" | "Rejected" }
# ----------------------------------------------------------
@company_bp.route("/applications/<int:application_id>/status", methods=["PUT"])
def update_application_status(application_id):
    err = company_required()
    if err: return err

    data   = request.get_json()
    status = data.get("status")

    allowed_statuses = ["Shortlisted", "Rejected", "Selected"]
    if status not in allowed_statuses:
        return jsonify({"error": f"Status must be one of {allowed_statuses}"}), 400

    # Verify this application belongs to this company's job
    app = query(
        """SELECT a.application_id FROM Applications a
           JOIN Job_Postings jp ON a.job_id = jp.job_id
           WHERE a.application_id = %s AND jp.company_id = %s""",
        (application_id, session["entity_id"]), fetchone=True
    )
    if not app:
        return jsonify({"error": "Application not found"}), 404

    query("UPDATE Applications SET status=%s WHERE application_id=%s",
          (status, application_id), commit=True)
    return jsonify({"message": f"Application status updated to {status}"}), 200


# ----------------------------------------------------------
# POST /api/company/interviews
# Schedule an interview round
# Body: { "application_id":1, "round_number":1,
#         "round_type":"Technical", "scheduled_at":"2025-09-10 10:00:00",
#         "venue":"Online / Room 101", "interviewer":"John Doe" }
# ----------------------------------------------------------
@company_bp.route("/interviews", methods=["POST"])
def schedule_interview():
    err = company_required()
    if err: return err

    data = request.get_json()
    required = ["application_id", "round_number", "round_type"]
    for f in required:
        if not data.get(f):
            return jsonify({"error": f"{f} is required"}), 400

    # Verify the application belongs to this company
    app = query(
        """SELECT a.application_id FROM Applications a
           JOIN Job_Postings jp ON a.job_id = jp.job_id
           WHERE a.application_id = %s AND jp.company_id = %s""",
        (data["application_id"], session["entity_id"]), fetchone=True
    )
    if not app:
        return jsonify({"error": "Application not found"}), 404

    round_id = query(
        """INSERT INTO Interview_Rounds
           (application_id, round_number, round_type, scheduled_at, venue, interviewer)
           VALUES (%s,%s,%s,%s,%s,%s)""",
        (data["application_id"], data["round_number"], data["round_type"],
         data.get("scheduled_at"), data.get("venue"), data.get("interviewer")),
        commit=True
    )
    return jsonify({"message": "Interview round scheduled", "round_id": round_id}), 201


# ----------------------------------------------------------
# GET /api/company/interviews
# List scheduled interview rounds across this company's jobs
# ----------------------------------------------------------
@company_bp.route("/interviews", methods=["GET"])
def list_company_interviews():
    err = company_required()
    if err: return err

    rounds = query(
        """SELECT
               ir.round_id,
               ir.application_id,
               jp.job_id,
               jp.job_title,
               s.student_id,
               s.full_name,
               s.email,
               ir.round_number,
               ir.round_type,
               ir.scheduled_at,
               ir.venue,
               ir.interviewer,
               ir.status
           FROM Interview_Rounds ir
           JOIN Applications a ON ir.application_id = a.application_id
           JOIN Job_Postings jp ON a.job_id = jp.job_id
           JOIN Students s ON a.student_id = s.student_id
           WHERE jp.company_id = %s
           ORDER BY COALESCE(ir.scheduled_at, '9999-12-31') ASC, ir.round_number ASC""",
        (session["entity_id"],), fetchall=True
    )
    return jsonify(rounds), 200


# ----------------------------------------------------------
# POST /api/company/interviews/result
# Record result for an interview round
# Uses stored procedure sp_record_interview_result
# Body: { "round_id":1, "score":85.0, "feedback":"Good",
#         "strengths":"DSA", "weaknesses":"Design",
#         "outcome":"Pass" | "Fail" | "Hold" }
# ----------------------------------------------------------
@company_bp.route("/interviews/result", methods=["POST"])
def record_interview_result():
    err = company_required()
    if err: return err

    data = request.get_json()
    required = ["round_id", "outcome"]
    for f in required:
        if not data.get(f):
            return jsonify({"error": f"{f} is required"}), 400

    conn   = get_connection()
    cursor = conn.cursor()
    try:
        cursor.callproc("sp_record_interview_result", [
            data["round_id"],
            data.get("score"),
            data.get("feedback", ""),
            data.get("strengths", ""),
            data.get("weaknesses", ""),
            data["outcome"],
            ""   # OUT param placeholder
        ])
        conn.commit()
        cursor.execute("SELECT @_sp_record_interview_result_6")
        result     = cursor.fetchone()
        status_msg = result[0] if result else "Unknown"
    finally:
        cursor.close()
        conn.close()

    if status_msg and status_msg.startswith("ERROR"):
        return jsonify({"error": status_msg}), 400

    return jsonify({"message": status_msg}), 200


# ----------------------------------------------------------
# POST /api/company/offers
# Extend a placement offer to a selected student
# Uses stored procedure sp_extend_offer
# Body: { "application_id":1, "ctc_fixed":8.0,
#         "ctc_variable":2.0, "joining_date":"2025-07-01",
#         "offer_letter_url":"/offers/xyz.pdf" }
# ----------------------------------------------------------
@company_bp.route("/offers", methods=["POST"])
def extend_offer():
    err = company_required()
    if err: return err

    data = request.get_json()
    required = ["application_id", "ctc_fixed"]
    for f in required:
        if data.get(f) is None:
            return jsonify({"error": f"{f} is required"}), 400

    conn   = get_connection()
    cursor = conn.cursor()
    try:
        cursor.callproc("sp_extend_offer", [
            data["application_id"],
            data["ctc_fixed"],
            data.get("ctc_variable", 0),
            data.get("joining_date"),
            data.get("offer_letter_url", ""),
            ""   # OUT param
        ])
        conn.commit()
        cursor.execute("SELECT @_sp_extend_offer_5")
        result     = cursor.fetchone()
        status_msg = result[0] if result else "Unknown"
    finally:
        cursor.close()
        conn.close()

    if status_msg and status_msg.startswith("ERROR"):
        return jsonify({"error": status_msg}), 400

    return jsonify({"message": status_msg}), 201


# ----------------------------------------------------------
# GET /api/company/offers
# List offers made by this company
# ----------------------------------------------------------
@company_bp.route("/offers", methods=["GET"])
def list_company_offers():
    err = company_required()
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
               jp.job_id,
               jp.job_title,
               s.student_id,
               s.full_name,
               s.email
           FROM Placements p
           JOIN Applications a ON p.application_id = a.application_id
           JOIN Job_Postings jp ON a.job_id = jp.job_id
           JOIN Students s ON a.student_id = s.student_id
           WHERE jp.company_id = %s
           ORDER BY p.placed_at DESC""",
        (session["entity_id"],), fetchall=True
    )
    return jsonify(offers), 200


# ----------------------------------------------------------
# GET /api/company/dashboard
# Stat cards for company portal
# ----------------------------------------------------------
@company_bp.route("/dashboard", methods=["GET"])
def dashboard():
    err = company_required()
    if err: return err

    stats = query(
        """SELECT
               COUNT(DISTINCT jp.job_id) AS active_jobs,
               COUNT(DISTINCT a.application_id) AS total_applications,
               SUM(CASE WHEN a.status='Interview_Scheduled' THEN 1 ELSE 0 END) AS interviews_scheduled,
               SUM(CASE WHEN a.status IN ('Selected','Offer_Accepted') THEN 1 ELSE 0 END) AS offers_made
           FROM Job_Postings jp
           LEFT JOIN Applications a ON jp.job_id = a.job_id
           WHERE jp.company_id = %s AND jp.is_approved = TRUE""",
        (session["entity_id"],), fetchone=True
    )
    return jsonify(stats), 200


# ----------------------------------------------------------
# GET /api/company/dashboard/health
# Real recruitment health metrics + attention items
# ----------------------------------------------------------
@company_bp.route("/dashboard/health", methods=["GET"])
def dashboard_health():
    err = company_required()
    if err: return err

    company_id = session["entity_id"]

    # Response rate: (apps that got a non-Applied status) / total
    rate_row = query(
        """SELECT
               COUNT(*) AS total,
               SUM(CASE WHEN a.status != 'Applied' THEN 1 ELSE 0 END) AS responded
           FROM Applications a
           JOIN Job_Postings jp ON a.job_id = jp.job_id
           WHERE jp.company_id = %s""",
        (company_id,), fetchone=True
    )
    total_apps = rate_row["total"] or 0
    responded  = rate_row["responded"] or 0
    response_rate = round(responded * 100.0 / total_apps, 1) if total_apps else 0

    # Avg time-to-hire: days from applied_at to placed_at
    hire_row = query(
        """SELECT ROUND(AVG(DATEDIFF(p.placed_at, a.applied_at)), 1) AS avg_days
           FROM Placements p
           JOIN Applications a ON p.application_id = a.application_id
           JOIN Job_Postings jp ON a.job_id = jp.job_id
           WHERE jp.company_id = %s""",
        (company_id,), fetchone=True
    )
    avg_days = hire_row["avg_days"] if hire_row and hire_row["avg_days"] else None

    # Attention items: jobs expiring within 7 days
    expiring_jobs = query(
        """SELECT job_id, job_title, application_deadline
           FROM Job_Postings
           WHERE company_id = %s
             AND is_approved = TRUE
             AND application_deadline BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
           ORDER BY application_deadline ASC
           LIMIT 5""",
        (company_id,), fetchall=True
    )

    # Attention items: jobs with unreviewed (Applied) applications
    unreviewed = query(
        """SELECT jp.job_id, jp.job_title,
                  COUNT(a.application_id) AS unreviewed_count
           FROM Job_Postings jp
           JOIN Applications a ON jp.job_id = a.job_id
           WHERE jp.company_id = %s
             AND a.status = 'Applied'
             AND jp.is_approved = TRUE
           GROUP BY jp.job_id, jp.job_title
           HAVING unreviewed_count > 0
           ORDER BY unreviewed_count DESC
           LIMIT 5""",
        (company_id,), fetchall=True
    )

    attention_items = []
    for j in expiring_jobs:
        deadline_str = str(j["application_deadline"])[:10] if j["application_deadline"] else ""
        attention_items.append({
            "type": "expiring",
            "level": "warning",
            "message": f"{j['job_title']} posting expires on {deadline_str}"
        })
    for u in unreviewed:
        attention_items.append({
            "type": "unreviewed",
            "level": "info",
            "message": f"{u['unreviewed_count']} unreviewed application{'s' if u['unreviewed_count'] != 1 else ''} for {u['job_title']}"
        })

    return jsonify({
        "response_rate": response_rate,
        "avg_time_to_hire_days": avg_days,
        "attention_items": attention_items
    }), 200


# ----------------------------------------------------------
# GET /api/company/jobs/<job_id>/skills
# List required skills for a job posting
# ----------------------------------------------------------
@company_bp.route("/jobs/<int:job_id>/skills", methods=["GET"])
def list_job_skills(job_id):
    err = company_required()
    if err: return err

    job = query("SELECT job_id FROM Job_Postings WHERE job_id=%s AND company_id=%s",
                (job_id, session["entity_id"]), fetchone=True)
    if not job:
        return jsonify({"error": "Job not found"}), 404

    skills = query(
        """SELECT sk.skill_id, sk.skill_name, sk.skill_type
           FROM Skill_Mappings sm
           JOIN Skills sk ON sm.skill_id = sk.skill_id
           WHERE sm.entity_type = 'Job' AND sm.entity_id = %s
           ORDER BY sk.skill_name""",
        (job_id,), fetchall=True
    )
    return jsonify(skills), 200


# ----------------------------------------------------------
# POST /api/company/jobs/<job_id>/skills
# Add a required skill to a job posting
# Body: { "skill_name": "Python", "skill_type": "Technical" }
# ----------------------------------------------------------
@company_bp.route("/jobs/<int:job_id>/skills", methods=["POST"])
def add_job_skill(job_id):
    err = company_required()
    if err: return err

    job = query("SELECT job_id FROM Job_Postings WHERE job_id=%s AND company_id=%s",
                (job_id, session["entity_id"]), fetchone=True)
    if not job:
        return jsonify({"error": "Job not found"}), 404

    data       = request.get_json()
    skill_name = data.get("skill_name", "").strip()
    skill_type = data.get("skill_type", "Technical")

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
        "SELECT mapping_id FROM Skill_Mappings WHERE skill_id=%s AND entity_type='Job' AND entity_id=%s",
        (skill_id, job_id), fetchone=True
    )
    if exists:
        return jsonify({"error": "Skill already added to this job"}), 409

    query(
        "INSERT INTO Skill_Mappings (skill_id, entity_type, entity_id) VALUES (%s,'Job',%s)",
        (skill_id, job_id), commit=True
    )
    return jsonify({"message": "Skill added", "skill_id": skill_id, "skill_name": skill_name}), 201


# ----------------------------------------------------------
# DELETE /api/company/jobs/<job_id>/skills/<skill_id>
# Remove a required skill from a job posting
# ----------------------------------------------------------
@company_bp.route("/jobs/<int:job_id>/skills/<int:skill_id>", methods=["DELETE"])
def remove_job_skill(job_id, skill_id):
    err = company_required()
    if err: return err

    job = query("SELECT job_id FROM Job_Postings WHERE job_id=%s AND company_id=%s",
                (job_id, session["entity_id"]), fetchone=True)
    if not job:
        return jsonify({"error": "Job not found"}), 404

    query(
        "DELETE FROM Skill_Mappings WHERE skill_id=%s AND entity_type='Job' AND entity_id=%s",
        (skill_id, job_id), commit=True
    )
    return jsonify({"message": "Skill removed"}), 200