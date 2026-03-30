# ============================================================
# routes/admin.py — Admin Portal API (Access Controlled)
# ============================================================

from flask import Blueprint, request, session, jsonify
from db import query

admin_bp = Blueprint("admin", __name__)


# ----------------------------------------------------------
# Guard: ONLY users with role='admin' can access these routes
# Every single admin endpoint calls this first
# ----------------------------------------------------------
def admin_required():
    if "user_id" not in session:
        return jsonify({"error": "Please log in"}), 401
    if session.get("role") != "admin":
        return jsonify({"error": "Access denied: admin only"}), 403
    return None


# ===========================================================
# SECTION A: DASHBOARD
# ===========================================================

# ----------------------------------------------------------
# GET /api/admin/dashboard
# Single-row overall stats (Q23)
# ----------------------------------------------------------
@admin_bp.route("/dashboard", methods=["GET"])
def dashboard():
    err = admin_required()
    if err: return err

    stats = query(
        """SELECT
               (SELECT COUNT(*) FROM Students)                              AS total_students,
               (SELECT COUNT(*) FROM Students WHERE is_placed = TRUE)       AS placed_students,
               (SELECT COUNT(*) FROM Students WHERE is_placed = FALSE)      AS unplaced_students,
               ROUND((SELECT COUNT(*) FROM Students WHERE is_placed = TRUE)
                     * 100.0 / NULLIF((SELECT COUNT(*) FROM Students),0),2) AS overall_placement_pct,
               (SELECT COUNT(*) FROM Companies WHERE is_approved = TRUE)    AS participating_companies,
               (SELECT COUNT(*) FROM Job_Postings WHERE is_approved = TRUE) AS total_jobs_posted,
               (SELECT ROUND(AVG(ctc_fixed+ctc_variable),2) FROM Placements) AS avg_package_lpa,
               (SELECT ROUND(MAX(ctc_fixed+ctc_variable),2) FROM Placements) AS highest_package_lpa,
               (SELECT COUNT(*) FROM Companies WHERE is_approved = FALSE)   AS pending_company_approvals,
               (SELECT COUNT(*) FROM Job_Postings WHERE is_approved = FALSE) AS pending_job_approvals""",
        fetchone=True
    )
    return jsonify(stats), 200


# ===========================================================
# SECTION B: STUDENT MANAGEMENT
# ===========================================================

# ----------------------------------------------------------
# GET /api/admin/students
# All students with optional filters
# Query params: ?department=CS&is_placed=true&cgpa_min=7
# ----------------------------------------------------------
@admin_bp.route("/students", methods=["GET"])
def get_students():
    err = admin_required()
    if err: return err

    department = request.args.get("department")
    is_placed  = request.args.get("is_placed")
    cgpa_min   = request.args.get("cgpa_min")

    sql    = "SELECT * FROM Students WHERE 1=1"
    params = []

    if department:
        sql += " AND department = %s"
        params.append(department)
    if is_placed is not None:
        sql += " AND is_placed = %s"
        params.append(is_placed.lower() == "true")
    if cgpa_min:
        sql += " AND cgpa >= %s"
        params.append(float(cgpa_min))

    sql += " ORDER BY department, cgpa DESC"
    students = query(sql, params, fetchall=True)
    return jsonify(students), 200


# ----------------------------------------------------------
# GET /api/admin/students/<student_id>
# Full profile of one student
# ----------------------------------------------------------
@admin_bp.route("/students/<int:student_id>", methods=["GET"])
def get_student(student_id):
    err = admin_required()
    if err: return err

    student = query("SELECT * FROM Students WHERE student_id=%s",
                    (student_id,), fetchone=True)
    if not student:
        return jsonify({"error": "Student not found"}), 404

    skills = query(
        """SELECT sk.skill_name, sk.skill_type, sm.proficiency
           FROM Skill_Mappings sm JOIN Skills sk ON sm.skill_id=sk.skill_id
           WHERE sm.entity_type='Student' AND sm.entity_id=%s""",
        (student_id,), fetchall=True
    )
    projects = query(
        "SELECT * FROM Student_Projects WHERE student_id=%s ORDER BY end_date DESC",
        (student_id,), fetchall=True
    )
    internships = query(
        "SELECT * FROM Internships WHERE student_id=%s ORDER BY start_date DESC",
        (student_id,), fetchall=True
    )
    applications = query(
        """SELECT a.*, jp.job_title, c.company_name
           FROM Applications a
           JOIN Job_Postings jp ON a.job_id=jp.job_id
           JOIN Companies c ON jp.company_id=c.company_id
           WHERE a.student_id=%s ORDER BY a.applied_at DESC""",
        (student_id,), fetchall=True
    )

    return jsonify({
        "student":      student,
        "skills":       skills,
        "projects":     projects,
        "internships":  internships,
        "applications": applications
    }), 200


# ===========================================================
# SECTION C: COMPANY MANAGEMENT
# ===========================================================

# ----------------------------------------------------------
# GET /api/admin/companies
# All companies — optionally filter pending ones
# Query params: ?approved=false
# ----------------------------------------------------------
@admin_bp.route("/companies", methods=["GET"])
def get_companies():
    err = admin_required()
    if err: return err

    approved = request.args.get("approved")
    sql      = "SELECT * FROM Companies WHERE 1=1"
    params   = []

    if approved is not None:
        sql += " AND is_approved = %s"
        params.append(approved.lower() == "true")

    sql += " ORDER BY created_at DESC"
    companies = query(sql, params, fetchall=True)
    return jsonify(companies), 200


# ----------------------------------------------------------
# PUT /api/admin/companies/<company_id>/approve
# Approve or revoke a company
# Body: { "approve": true | false }
# ----------------------------------------------------------
@admin_bp.route("/companies/<int:company_id>/approve", methods=["PUT"])
def approve_company(company_id):
    err = admin_required()
    if err: return err

    data    = request.get_json()
    approve = data.get("approve", True)

    company = query("SELECT company_id FROM Companies WHERE company_id=%s",
                    (company_id,), fetchone=True)
    if not company:
        return jsonify({"error": "Company not found"}), 404

    query("UPDATE Companies SET is_approved=%s WHERE company_id=%s",
          (approve, company_id), commit=True)

    action = "approved" if approve else "approval revoked"
    return jsonify({"message": f"Company {action}"}), 200


# ===========================================================
# SECTION D: JOB POSTING MANAGEMENT
# ===========================================================

# ----------------------------------------------------------
# GET /api/admin/jobs
# All job postings — filter by approval status
# ----------------------------------------------------------
@admin_bp.route("/jobs", methods=["GET"])
def get_jobs():
    err = admin_required()
    if err: return err

    approved = request.args.get("approved")
    sql      = """SELECT jp.*, c.company_name,
                         COUNT(a.application_id) AS total_applications
                  FROM Job_Postings jp
                  JOIN Companies c ON jp.company_id=c.company_id
                  LEFT JOIN Applications a ON jp.job_id=a.job_id
                  WHERE 1=1"""
    params = []

    if approved is not None:
        sql += " AND jp.is_approved = %s"
        params.append(approved.lower() == "true")

    sql += " GROUP BY jp.job_id ORDER BY jp.created_at DESC"
    jobs = query(sql, params, fetchall=True)
    return jsonify(jobs), 200


# ----------------------------------------------------------
# PUT /api/admin/jobs/<job_id>/approve
# Body: { "approve": true | false }
# ----------------------------------------------------------
@admin_bp.route("/jobs/<int:job_id>/approve", methods=["PUT"])
def approve_job(job_id):
    err = admin_required()
    if err: return err

    data    = request.get_json()
    approve = data.get("approve", True)

    job = query("SELECT job_id FROM Job_Postings WHERE job_id=%s",
                (job_id,), fetchone=True)
    if not job:
        return jsonify({"error": "Job not found"}), 404

    query("UPDATE Job_Postings SET is_approved=%s WHERE job_id=%s",
          (approve, job_id), commit=True)

    action = "approved" if approve else "approval revoked"
    return jsonify({"message": f"Job posting {action}"}), 200


# ===========================================================
# SECTION E: ADMIN USER MANAGEMENT
# ===========================================================

# ----------------------------------------------------------
# GET /api/admin/users
# List all admin accounts
# ----------------------------------------------------------
@admin_bp.route("/users", methods=["GET"])
def get_admin_users():
    err = admin_required()
    if err: return err

    users = query(
        "SELECT user_id, username, role, entity_id, created_at FROM Users WHERE role='admin'",
        fetchall=True
    )
    return jsonify(users), 200


# ----------------------------------------------------------
# POST /api/admin/users
# Create a new admin account
# Body: { "username":"...", "password":"..." }
# ----------------------------------------------------------
@admin_bp.route("/users", methods=["POST"])
def create_admin_user():
    err = admin_required()
    if err: return err

    import bcrypt
    data     = request.get_json()
    username = data.get("username", "").strip()
    password = data.get("password", "")

    if not username or not password:
        return jsonify({"error": "username and password are required"}), 400

    existing = query("SELECT user_id FROM Users WHERE username=%s",
                     (username,), fetchone=True)
    if existing:
        return jsonify({"error": "Username already taken"}), 409

    pw_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    query(
        "INSERT INTO Users (username, password_hash, role) VALUES (%s,%s,'admin')",
        (username, pw_hash), commit=True
    )
    return jsonify({"message": f"Admin user '{username}' created"}), 201


# ----------------------------------------------------------
# DELETE /api/admin/users/<user_id>
# Remove an admin account (cannot delete yourself)
# ----------------------------------------------------------
@admin_bp.route("/users/<int:user_id>", methods=["DELETE"])
def delete_admin_user(user_id):
    err = admin_required()
    if err: return err

    if user_id == session["user_id"]:
        return jsonify({"error": "Cannot delete your own account"}), 400

    query("DELETE FROM Users WHERE user_id=%s AND role='admin'",
          (user_id,), commit=True)
    return jsonify({"message": "Admin user deleted"}), 200


# ===========================================================
# SECTION F: REPORTS
# ===========================================================

# ----------------------------------------------------------
# GET /api/admin/reports/departments
# Dept-wise placement stats (Q5)
# ----------------------------------------------------------
@admin_bp.route("/reports/departments", methods=["GET"])
def report_departments():
    err = admin_required()
    if err: return err

    data = query(
        """SELECT
               s.department,
               COUNT(DISTINCT s.student_id)                                 AS total_students,
               COUNT(DISTINCT p.student_id)                                 AS placed_students,
               COUNT(DISTINCT s.student_id)-COUNT(DISTINCT p.student_id)   AS unplaced_students,
               ROUND(COUNT(DISTINCT p.student_id)*100.0
                     /NULLIF(COUNT(DISTINCT s.student_id),0),2)             AS placement_rate_pct,
               ROUND(AVG(p.ctc_fixed+p.ctc_variable),2)                    AS avg_ctc_lpa,
               ROUND(MAX(p.ctc_fixed+p.ctc_variable),2)                    AS max_ctc_lpa,
               ROUND(MIN(p.ctc_fixed+p.ctc_variable),2)                    AS min_ctc_lpa,
               ROUND(AVG(s.cgpa),2)                                        AS avg_cgpa
           FROM Students s
           LEFT JOIN Placements p ON s.student_id=p.student_id
           GROUP BY s.department
           ORDER BY placement_rate_pct DESC""",
        fetchall=True
    )
    return jsonify(data), 200


# ----------------------------------------------------------
# GET /api/admin/reports/top-companies
# Top companies by avg CTC (Q35)
# ----------------------------------------------------------
@admin_bp.route("/reports/top-companies", methods=["GET"])
def report_top_companies():
    err = admin_required()
    if err: return err

    data = query(
        """SELECT company_rank, company_name, industry,
                  students_hired, avg_ctc_lpa, max_ctc_lpa,
                  total_applications,
                  ROUND(students_hired*100.0/NULLIF(total_applications,0),2) AS offer_conversion_pct
           FROM (
               SELECT c.company_id, c.company_name, c.industry,
                      COUNT(DISTINCT p.placement_id)               AS students_hired,
                      ROUND(AVG(p.ctc_fixed+p.ctc_variable),2)    AS avg_ctc_lpa,
                      ROUND(MAX(p.ctc_fixed+p.ctc_variable),2)    AS max_ctc_lpa,
                      COUNT(DISTINCT a.application_id)             AS total_applications,
                      RANK() OVER (ORDER BY AVG(p.ctc_fixed+p.ctc_variable) DESC) AS company_rank
               FROM Companies c
               JOIN Job_Postings jp ON c.company_id=jp.company_id
               LEFT JOIN Applications a ON jp.job_id=a.job_id
               LEFT JOIN Placements p ON a.application_id=p.application_id
               WHERE c.is_approved=TRUE
               GROUP BY c.company_id, c.company_name, c.industry
           ) ranked
           WHERE students_hired > 0
           ORDER BY company_rank""",
        fetchall=True
    )
    return jsonify(data), 200


# ----------------------------------------------------------
# GET /api/admin/reports/skills
# Most in-demand skills (Q25)
# ----------------------------------------------------------
@admin_bp.route("/reports/skills", methods=["GET"])
def report_skills():
    err = admin_required()
    if err: return err

    data = query(
        """SELECT sk.skill_name, sk.skill_type,
                  COUNT(DISTINCT sm.entity_id)                              AS students_with_skill,
                  SUM(CASE WHEN s.is_placed=TRUE THEN 1 ELSE 0 END)        AS placed_with_skill,
                  ROUND(SUM(CASE WHEN s.is_placed=TRUE THEN 1 ELSE 0 END)
                        *100.0/NULLIF(COUNT(DISTINCT sm.entity_id),0),2)   AS placement_rate_pct
           FROM Skills sk
           JOIN Skill_Mappings sm ON sk.skill_id=sm.skill_id AND sm.entity_type='Student'
           JOIN Students s ON sm.entity_id=s.student_id
           GROUP BY sk.skill_id, sk.skill_name, sk.skill_type
           HAVING COUNT(DISTINCT sm.entity_id) >= 1
           ORDER BY placement_rate_pct DESC, placed_with_skill DESC""",
        fetchall=True
    )
    return jsonify(data), 200


# ----------------------------------------------------------
# GET /api/admin/reports/ctc-bands
# Placement count per CTC band (Q33)
# ----------------------------------------------------------
@admin_bp.route("/reports/ctc-bands", methods=["GET"])
def report_ctc_bands():
    err = admin_required()
    if err: return err

    data = query(
        """SELECT ctc_band,
                  COUNT(*) AS placement_count,
                  ROUND(COUNT(*)*100.0/SUM(COUNT(*)) OVER(),2) AS percentage,
                  ROUND(AVG(total_ctc),2) AS avg_ctc_in_band,
                  ROUND(MIN(total_ctc),2) AS min_ctc,
                  ROUND(MAX(total_ctc),2) AS max_ctc
           FROM (
               SELECT placement_id,
                      ROUND(ctc_fixed+ctc_variable,2) AS total_ctc,
                      CASE
                          WHEN (ctc_fixed+ctc_variable)>=15 THEN 'Super Dream (>=15 LPA)'
                          WHEN (ctc_fixed+ctc_variable)>=10 THEN 'Dream (10-15 LPA)'
                          WHEN (ctc_fixed+ctc_variable)>=6  THEN 'Good (6-10 LPA)'
                          ELSE 'Normal (<6 LPA)'
                      END AS ctc_band
               FROM Placements
           ) banded
           GROUP BY ctc_band
           ORDER BY MIN(total_ctc) DESC""",
        fetchall=True
    )
    return jsonify(data), 200


# ----------------------------------------------------------
# GET /api/admin/reports/monthly-trend
# Month-wise placement trend (Q24)
# ----------------------------------------------------------
@admin_bp.route("/reports/monthly-trend", methods=["GET"])
def report_monthly_trend():
    err = admin_required()
    if err: return err

    data = query(
        """SELECT YEAR(placed_at) AS yr, MONTH(placed_at) AS mo,
                  MONTHNAME(placed_at) AS month_name,
                  COUNT(*) AS placements,
                  ROUND(AVG(ctc_fixed+ctc_variable),2) AS avg_ctc,
                  ROUND(MAX(ctc_fixed+ctc_variable),2) AS max_ctc
           FROM Placements
           GROUP BY YEAR(placed_at), MONTH(placed_at), MONTHNAME(placed_at)
           ORDER BY yr, mo""",
        fetchall=True
    )
    return jsonify(data), 200


# ----------------------------------------------------------
# GET /api/admin/reports/at-risk-students
# Unplaced students with high rejection rate
# ----------------------------------------------------------
@admin_bp.route("/reports/at-risk-students", methods=["GET"])
def report_at_risk():
    err = admin_required()
    if err: return err

    data = query(
        """SELECT s.student_id, s.full_name, s.department, s.cgpa,
                  COUNT(a.application_id) AS total_applied,
                  SUM(CASE WHEN a.status='Rejected' THEN 1 ELSE 0 END) AS total_rejected,
                  ROUND(SUM(CASE WHEN a.status='Rejected' THEN 1 ELSE 0 END)
                        *100.0/NULLIF(COUNT(a.application_id),0),2) AS rejection_rate,
                  CASE
                      WHEN SUM(CASE WHEN a.status='Rejected' THEN 1 ELSE 0 END)=COUNT(a.application_id) THEN 'High'
                      WHEN SUM(CASE WHEN a.status='Rejected' THEN 1 ELSE 0 END)>=COUNT(a.application_id)*0.6 THEN 'Medium'
                      ELSE 'Low'
                  END AS risk_level
           FROM Students s
           JOIN Applications a ON s.student_id=a.student_id
           WHERE s.is_placed=FALSE
           GROUP BY s.student_id, s.full_name, s.department, s.cgpa
           HAVING COUNT(a.application_id) >= 3
           ORDER BY rejection_rate DESC""",
        fetchall=True
    )
    return jsonify(data), 200