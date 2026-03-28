-- ============================================================
--  Campus Placement Cell Management System
--  COMPLETE QUERY SET — Q1 to Q35
--  (No CREATE or INSERT statements — queries only)
--
--  SECTIONS:
--  Q01–Q04  : Basic JOINs
--  Q05–Q08  : Aggregates + GROUP BY + HAVING
--  Q09–Q13  : Subqueries (correlated, EXISTS, NOT EXISTS)
--  Q14–Q18  : Window Functions (RANK, DENSE_RANK, ROW_NUMBER,
--              SUM OVER, AVG OVER, rolling average)
--  Q19–Q20  : CTEs (Common Table Expressions)
--  Q21–Q22  : CASE + Conditional Logic
--  Q23–Q25  : Admin Report Queries
--  Q26–Q28  : Student Portal (eligibility, skills gap, analytics)
--  Q29–Q32  : Company Portal (pipeline, shortlist, scores, time-to-hire)
--  Q33–Q35  : Admin Portal (CTC bands, YoY trend, company ranking)
-- ============================================================

USE placement_db;

-- ============================================================
-- SECTION 1: BASIC JOINs
-- ============================================================

-- Q1. List all students with their placement details
--     (only placed students — INNER JOIN)
SELECT
    s.student_id,
    s.full_name,
    s.department,
    s.cgpa,
    c.company_name,
    jp.job_title,
    p.ctc_fixed + p.ctc_variable AS total_ctc,
    p.joining_date
FROM Students s
INNER JOIN Placements p        ON s.student_id    = p.student_id
INNER JOIN Applications a      ON p.application_id = a.application_id
INNER JOIN Job_Postings jp     ON a.job_id         = jp.job_id
INNER JOIN Companies c         ON jp.company_id    = c.company_id
ORDER BY total_ctc DESC;


-- Q2. List ALL students and their placement status
--     (including unplaced students — LEFT JOIN)
SELECT
    s.student_id,
    s.full_name,
    s.department,
    s.cgpa,
    COALESCE(c.company_name, 'Not Placed')   AS company,
    COALESCE(jp.job_title,   'N/A')          AS role,
    COALESCE(p.ctc_fixed + p.ctc_variable, 0) AS total_ctc
FROM Students s
LEFT JOIN Placements p      ON s.student_id     = p.student_id
LEFT JOIN Applications a    ON p.application_id = a.application_id
LEFT JOIN Job_Postings jp   ON a.job_id         = jp.job_id
LEFT JOIN Companies c       ON jp.company_id    = c.company_id
ORDER BY s.department, total_ctc DESC;


-- Q3. All job postings with company name and number of applicants
SELECT
    jp.job_id,
    c.company_name,
    jp.job_title,
    jp.location,
    jp.ctc_fixed + jp.ctc_variable AS total_ctc,
    jp.openings,
    COUNT(a.application_id)        AS total_applications
FROM Job_Postings jp
INNER JOIN Companies c          ON jp.company_id = c.company_id
LEFT  JOIN Applications a       ON jp.job_id     = a.job_id
GROUP BY jp.job_id, c.company_name, jp.job_title,
         jp.location, jp.ctc_fixed, jp.ctc_variable, jp.openings
ORDER BY total_applications DESC;


-- Q4. Students with their skills (multi-table JOIN through Skill_Mappings)
SELECT
    s.student_id,
    s.full_name,
    s.department,
    sk.skill_name,
    sk.skill_type,
    sm.proficiency
FROM Students s
INNER JOIN Skill_Mappings sm ON sm.entity_id   = s.student_id
                             AND sm.entity_type = 'Student'
INNER JOIN Skills sk         ON sk.skill_id    = sm.skill_id
ORDER BY s.student_id, sk.skill_type, sk.skill_name;


-- ============================================================
-- SECTION 2: AGGREGATE FUNCTIONS + GROUP BY + HAVING
-- ============================================================

-- Q5. Department-wise placement statistics
SELECT
    s.department,
    COUNT(DISTINCT s.student_id)                          AS total_students,
    COUNT(DISTINCT p.student_id)                          AS placed_students,
    COUNT(DISTINCT s.student_id) - COUNT(DISTINCT p.student_id) AS unplaced_students,
    ROUND(COUNT(DISTINCT p.student_id) * 100.0
          / COUNT(DISTINCT s.student_id), 2)              AS placement_rate_pct,
    ROUND(AVG(p.ctc_fixed + p.ctc_variable), 2)          AS avg_ctc_lpa,
    ROUND(MAX(p.ctc_fixed + p.ctc_variable), 2)          AS max_ctc_lpa,
    ROUND(MIN(p.ctc_fixed + p.ctc_variable), 2)          AS min_ctc_lpa
FROM Students s
LEFT JOIN Placements p ON s.student_id = p.student_id
GROUP BY s.department
ORDER BY placement_rate_pct DESC;


-- Q6. Companies that hired more than 5 students
SELECT
    c.company_name,
    c.industry,
    COUNT(p.placement_id)                        AS students_hired,
    ROUND(AVG(p.ctc_fixed + p.ctc_variable), 2) AS avg_ctc_offered
FROM Companies c
INNER JOIN Job_Postings jp  ON c.company_id    = jp.company_id
INNER JOIN Applications a   ON jp.job_id       = a.job_id
INNER JOIN Placements p     ON a.application_id = p.application_id
GROUP BY c.company_id, c.company_name, c.industry
HAVING COUNT(p.placement_id) > 5
ORDER BY students_hired DESC;


-- Q7. Students who applied to more than 3 jobs but are still unplaced
SELECT
    s.student_id,
    s.full_name,
    s.department,
    s.cgpa,
    COUNT(a.application_id) AS total_applications
FROM Students s
INNER JOIN Applications a ON s.student_id = a.student_id
WHERE s.is_placed = FALSE
GROUP BY s.student_id, s.full_name, s.department, s.cgpa
HAVING COUNT(a.application_id) > 3
ORDER BY total_applications DESC;


-- Q8. Average CGPA of placed vs unplaced students per department
SELECT
    department,
    ROUND(AVG(CASE WHEN is_placed = TRUE  THEN cgpa END), 2) AS avg_cgpa_placed,
    ROUND(AVG(CASE WHEN is_placed = FALSE THEN cgpa END), 2) AS avg_cgpa_unplaced,
    ROUND(AVG(cgpa), 2)                                       AS overall_avg_cgpa
FROM Students
GROUP BY department
ORDER BY department;


-- ============================================================
-- SECTION 3: SUBQUERIES
-- ============================================================

-- Q9. Students whose CGPA is above the average CGPA of their department
SELECT
    student_id,
    full_name,
    department,
    cgpa
FROM Students s
WHERE cgpa > (
    SELECT AVG(cgpa)
    FROM Students
    WHERE department = s.department   -- correlated subquery
)
ORDER BY department, cgpa DESC;


-- Q10. Jobs that received zero applications
SELECT
    jp.job_id,
    c.company_name,
    jp.job_title,
    jp.application_deadline
FROM Job_Postings jp
INNER JOIN Companies c ON jp.company_id = c.company_id
WHERE jp.job_id NOT IN (
    SELECT DISTINCT job_id FROM Applications
)
ORDER BY jp.created_at;


-- Q11. Top earning placement per department (subquery in FROM)
SELECT
    dept_max.department,
    s.full_name,
    c.company_name,
    dept_max.max_ctc AS total_ctc_lpa
FROM (
    SELECT
        st.department,
        MAX(p.ctc_fixed + p.ctc_variable) AS max_ctc
    FROM Students st
    INNER JOIN Placements p ON st.student_id = p.student_id
    GROUP BY st.department
) AS dept_max
INNER JOIN Students s       ON s.department = dept_max.department
INNER JOIN Placements p     ON s.student_id = p.student_id
                            AND (p.ctc_fixed + p.ctc_variable) = dept_max.max_ctc
INNER JOIN Applications a   ON p.application_id = a.application_id
INNER JOIN Job_Postings jp  ON a.job_id         = jp.job_id
INNER JOIN Companies c      ON jp.company_id    = c.company_id
ORDER BY dept_max.max_ctc DESC;


-- Q12. Students who have internship experience AND are placed
--      (EXISTS subquery)
SELECT
    s.student_id,
    s.full_name,
    s.department,
    s.cgpa
FROM Students s
WHERE EXISTS (
    SELECT 1 FROM Internships i WHERE i.student_id = s.student_id
)
AND EXISTS (
    SELECT 1 FROM Placements p WHERE p.student_id = s.student_id
)
ORDER BY s.cgpa DESC;


-- Q13. Students who have NO internship and are NOT placed
--      (NOT EXISTS subquery)
SELECT
    s.student_id,
    s.full_name,
    s.department,
    s.cgpa
FROM Students s
WHERE NOT EXISTS (
    SELECT 1 FROM Internships i WHERE i.student_id = s.student_id
)
AND NOT EXISTS (
    SELECT 1 FROM Placements p WHERE p.student_id = s.student_id
)
ORDER BY s.cgpa DESC;


-- ============================================================
-- SECTION 4: WINDOW FUNCTIONS
-- ============================================================

-- Q14. Rank students within each department by CGPA
SELECT
    student_id,
    full_name,
    department,
    cgpa,
    RANK()       OVER (PARTITION BY department ORDER BY cgpa DESC) AS dept_rank,
    DENSE_RANK() OVER (PARTITION BY department ORDER BY cgpa DESC) AS dept_dense_rank,
    ROW_NUMBER() OVER (PARTITION BY department ORDER BY cgpa DESC) AS dept_row_num
FROM Students
ORDER BY department, dept_rank;


-- Q15. Running total of placements over time (cumulative count)
SELECT
    DATE(placed_at)                                      AS placement_date,
    COUNT(*)                                             AS placements_on_day,
    SUM(COUNT(*)) OVER (ORDER BY DATE(placed_at))        AS cumulative_placements,
    ROUND(AVG(ctc_fixed + ctc_variable), 2)             AS avg_ctc_on_day,
    ROUND(AVG(AVG(ctc_fixed + ctc_variable))
          OVER (ORDER BY DATE(placed_at)
                ROWS BETWEEN 6 PRECEDING AND CURRENT ROW), 2) AS rolling_7day_avg_ctc
FROM Placements
GROUP BY DATE(placed_at)
ORDER BY placement_date;


-- Q16. Each student's CTC compared to department average
--      (using AVG as window function)
SELECT
    s.student_id,
    s.full_name,
    s.department,
    ROUND(p.ctc_fixed + p.ctc_variable, 2)              AS student_ctc,
    ROUND(AVG(p.ctc_fixed + p.ctc_variable)
          OVER (PARTITION BY s.department), 2)           AS dept_avg_ctc,
    ROUND((p.ctc_fixed + p.ctc_variable) -
          AVG(p.ctc_fixed + p.ctc_variable)
          OVER (PARTITION BY s.department), 2)           AS diff_from_dept_avg
FROM Students s
INNER JOIN Placements p ON s.student_id = p.student_id
ORDER BY s.department, student_ctc DESC;


-- Q17. Top 3 highest CTC placements per department (RANK + filter)
SELECT *
FROM (
    SELECT
        s.department,
        s.full_name,
        c.company_name,
        jp.job_title,
        ROUND(p.ctc_fixed + p.ctc_variable, 2) AS total_ctc,
        RANK() OVER (PARTITION BY s.department
                     ORDER BY (p.ctc_fixed + p.ctc_variable) DESC) AS rnk
    FROM Students s
    INNER JOIN Placements p     ON s.student_id     = p.student_id
    INNER JOIN Applications a   ON p.application_id = a.application_id
    INNER JOIN Job_Postings jp  ON a.job_id         = jp.job_id
    INNER JOIN Companies c      ON jp.company_id    = c.company_id
) ranked
WHERE rnk <= 3
ORDER BY department, rnk;


-- Q18. Interview pass rate per round type across all companies
SELECT
    ir.round_type,
    COUNT(*)                                              AS total_rounds,
    SUM(CASE WHEN ires.outcome = 'Pass' THEN 1 ELSE 0 END) AS passed,
    SUM(CASE WHEN ires.outcome = 'Fail' THEN 1 ELSE 0 END) AS failed,
    ROUND(SUM(CASE WHEN ires.outcome = 'Pass' THEN 1 ELSE 0 END)
          * 100.0 / COUNT(*), 2)                          AS pass_rate_pct,
    ROUND(AVG(ires.score), 2)                             AS avg_score
FROM Interview_Rounds ir
INNER JOIN Interview_Results ires ON ir.round_id = ires.round_id
GROUP BY ir.round_type
ORDER BY pass_rate_pct DESC;


-- ============================================================
-- SECTION 5: CTEs (Common Table Expressions)
-- ============================================================

-- Q19. CTE: Students with full placement pipeline summary
WITH ApplicationSummary AS (
    SELECT
        student_id,
        COUNT(*)                                              AS total_applied,
        SUM(CASE WHEN status = 'Rejected'      THEN 1 END)  AS rejected,
        SUM(CASE WHEN status = 'Shortlisted'   THEN 1 END)  AS shortlisted,
        SUM(CASE WHEN status = 'Offer_Accepted'THEN 1 END)  AS offer_accepted
    FROM Applications
    GROUP BY student_id
),
InternshipCount AS (
    SELECT student_id, COUNT(*) AS internship_count
    FROM Internships
    GROUP BY student_id
),
ProjectCount AS (
    SELECT student_id, COUNT(*) AS project_count
    FROM Student_Projects
    GROUP BY student_id
)
SELECT
    s.student_id,
    s.full_name,
    s.department,
    s.cgpa,
    COALESCE(ic.internship_count, 0) AS internships,
    COALESCE(pc.project_count, 0)    AS projects,
    COALESCE(a.total_applied, 0)     AS jobs_applied,
    COALESCE(a.shortlisted, 0)       AS shortlisted,
    COALESCE(a.rejected, 0)          AS rejected,
    s.is_placed
FROM Students s
LEFT JOIN ApplicationSummary a  ON s.student_id = a.student_id
LEFT JOIN InternshipCount    ic ON s.student_id = ic.student_id
LEFT JOIN ProjectCount       pc ON s.student_id = pc.student_id
ORDER BY s.department, s.cgpa DESC;


-- Q20. CTE: Identify companies with highest offer-to-application ratio
WITH CompanyStats AS (
    SELECT
        c.company_id,
        c.company_name,
        COUNT(DISTINCT a.application_id)  AS total_applications,
        COUNT(DISTINCT p.placement_id)    AS total_placements
    FROM Companies c
    INNER JOIN Job_Postings jp ON c.company_id = jp.company_id
    LEFT  JOIN Applications a  ON jp.job_id    = a.job_id
    LEFT  JOIN Placements p    ON a.application_id = p.application_id
    GROUP BY c.company_id, c.company_name
)
SELECT
    company_name,
    total_applications,
    total_placements,
    ROUND(total_placements * 100.0 / NULLIF(total_applications, 0), 2) AS conversion_rate_pct
FROM CompanyStats
WHERE total_applications > 0
ORDER BY conversion_rate_pct DESC;


-- ============================================================
-- SECTION 6: CASE + CONDITIONAL LOGIC
-- ============================================================

-- Q21. Classify students into performance bands
SELECT
    student_id,
    full_name,
    department,
    cgpa,
    CASE
        WHEN cgpa >= 9.0 THEN 'Outstanding'
        WHEN cgpa >= 8.0 THEN 'Excellent'
        WHEN cgpa >= 7.0 THEN 'Good'
        WHEN cgpa >= 6.0 THEN 'Average'
        ELSE                  'Below Average'
    END AS performance_band,
    CASE
        WHEN is_placed = TRUE THEN 'Placed'
        ELSE 'Unplaced'
    END AS placement_status
FROM Students
ORDER BY cgpa DESC;


-- Q22. Classify placements by CTC range
SELECT
    s.full_name,
    s.department,
    c.company_name,
    ROUND(p.ctc_fixed + p.ctc_variable, 2) AS total_ctc,
    CASE
        WHEN (p.ctc_fixed + p.ctc_variable) >= 15 THEN 'Super Dream (15+ LPA)'
        WHEN (p.ctc_fixed + p.ctc_variable) >= 10 THEN 'Dream (10–15 LPA)'
        WHEN (p.ctc_fixed + p.ctc_variable) >=  6 THEN 'Good (6–10 LPA)'
        ELSE                                            'Normal (< 6 LPA)'
    END AS ctc_category
FROM Placements p
INNER JOIN Students s       ON p.student_id     = s.student_id
INNER JOIN Applications a   ON p.application_id = a.application_id
INNER JOIN Job_Postings jp  ON a.job_id         = jp.job_id
INNER JOIN Companies c      ON jp.company_id    = c.company_id
ORDER BY total_ctc DESC;


-- ============================================================
-- SECTION 7: ADMIN REPORT QUERIES
-- ============================================================

-- Q23. Overall placement dashboard summary (single-row report)
SELECT
    (SELECT COUNT(*) FROM Students)                        AS total_students,
    (SELECT COUNT(*) FROM Students WHERE is_placed = TRUE) AS placed_students,
    (SELECT COUNT(*) FROM Students WHERE is_placed = FALSE)AS unplaced_students,
    ROUND(
        (SELECT COUNT(*) FROM Students WHERE is_placed = TRUE) * 100.0
        / (SELECT COUNT(*) FROM Students), 2
    )                                                      AS overall_placement_pct,
    (SELECT COUNT(*) FROM Companies WHERE is_approved = TRUE) AS participating_companies,
    (SELECT COUNT(*) FROM Job_Postings WHERE is_approved = TRUE) AS total_jobs_posted,
    (SELECT ROUND(AVG(ctc_fixed + ctc_variable), 2) FROM Placements) AS avg_package_lpa,
    (SELECT ROUND(MAX(ctc_fixed + ctc_variable), 2) FROM Placements) AS highest_package_lpa;


-- Q24. Month-wise placement trend
SELECT
    YEAR(placed_at)                                      AS yr,
    MONTH(placed_at)                                     AS mo,
    MONTHNAME(placed_at)                                 AS month_name,
    COUNT(*)                                             AS placements,
    ROUND(AVG(ctc_fixed + ctc_variable), 2)             AS avg_ctc,
    ROUND(MAX(ctc_fixed + ctc_variable), 2)             AS max_ctc
FROM Placements
GROUP BY YEAR(placed_at), MONTH(placed_at), MONTHNAME(placed_at)
ORDER BY yr, mo;


-- Q25. Most in-demand skills among placed students
SELECT
    sk.skill_name,
    sk.skill_type,
    COUNT(DISTINCT sm.entity_id) AS students_with_skill,
    SUM(CASE WHEN s.is_placed = TRUE THEN 1 ELSE 0 END) AS placed_with_skill,
    ROUND(
        SUM(CASE WHEN s.is_placed = TRUE THEN 1 ELSE 0 END) * 100.0
        / COUNT(DISTINCT sm.entity_id), 2
    ) AS placement_rate_pct
FROM Skills sk
INNER JOIN Skill_Mappings sm ON sk.skill_id    = sm.skill_id
                             AND sm.entity_type = 'Student'
INNER JOIN Students s        ON sm.entity_id   = s.student_id
GROUP BY sk.skill_id, sk.skill_name, sk.skill_type
HAVING COUNT(DISTINCT sm.entity_id) >= 5
ORDER BY placement_rate_pct DESC, placed_with_skill DESC;

-- ============================================================
-- END OF QUERIES
-- ============================================================
-- ============================================================
--  Campus Placement Cell Management System
--  MISSING QUERIES (9) — Matched to Prototype UI
--  Covers: Student Portal, Company Portal, Admin Portal
-- ============================================================

USE placement_db;

-- ============================================================
-- STUDENT PORTAL QUERIES
-- (Prototype shows: job cards with skill tags, eligibility
--  criteria, application table, offers section)
-- ============================================================

-- Q26. Jobs a specific student is ELIGIBLE for
--      Feeds the "Available Jobs" section with Apply Now button.
--      Filters by min_cgpa, eligible_depts, eligible_grad_years.
--      Replace @student_id with the logged-in student's ID.
SET @student_id = 1;

SELECT
    jp.job_id,
    c.company_name,
    c.industry,
    jp.job_title,
    jp.location,
    jp.job_type,
    jp.ctc_fixed,
    jp.ctc_variable,
    ROUND(jp.ctc_fixed + jp.ctc_variable, 2)  AS total_ctc,
    jp.min_cgpa,
    jp.openings,
    jp.application_deadline,
    -- Check if student has already applied
    CASE
        WHEN a.application_id IS NOT NULL THEN 'Applied'
        ELSE 'Eligible'
    END AS apply_status
FROM Job_Postings jp
INNER JOIN Companies c ON jp.company_id = c.company_id

-- Eligibility check 1: CGPA must meet minimum requirement
INNER JOIN Students s ON s.student_id = @student_id
    AND s.cgpa >= jp.min_cgpa
    AND s.backlogs <= COALESCE(jp.max_backlogs, 0)

-- Eligibility check 2: Student's department must be in eligible list
-- (eligible_depts stored as comma-separated string)
    AND (
        jp.eligible_depts IS NULL
        OR jp.eligible_depts = ''
        OR FIND_IN_SET(s.department, jp.eligible_depts) > 0
    )

-- Eligibility check 3: Graduation year must match
    AND (
        jp.eligible_grad_years IS NULL
        OR jp.eligible_grad_years = ''
        OR FIND_IN_SET(CAST(s.graduation_year AS CHAR), jp.eligible_grad_years) > 0
    )

-- Left join to check if student already applied
LEFT JOIN Applications a
    ON a.job_id = jp.job_id
    AND a.student_id = @student_id

WHERE jp.is_approved = TRUE
  AND (jp.application_deadline IS NULL OR jp.application_deadline >= CURDATE())

ORDER BY jp.application_deadline ASC, total_ctc DESC;


-- Q27. Skills gap for a student against a specific job
--      Powers the "Skills Required vs Skills Possessed" comparison
--      shown in the job detail view of the student portal.
SET @student_id = 1;
SET @job_id     = 1;

SELECT
    sk.skill_name,
    sk.skill_type,
    -- Is this skill required by the job?
    CASE WHEN job_sm.skill_id IS NOT NULL THEN 'Yes' ELSE 'No' END AS required_by_job,
    -- Does the student have this skill?
    CASE WHEN stu_sm.skill_id IS NOT NULL THEN 'Yes' ELSE 'No' END AS student_has,
    COALESCE(stu_sm.proficiency, '—')                              AS proficiency,
    -- Gap flag: required but student doesn't have it
    CASE
        WHEN job_sm.skill_id IS NOT NULL AND stu_sm.skill_id IS NULL
        THEN 'GAP'
        WHEN job_sm.skill_id IS NOT NULL AND stu_sm.skill_id IS NOT NULL
        THEN 'MATCHED'
        ELSE 'EXTRA'
    END AS match_status
FROM Skills sk

-- All skills required by the job
LEFT JOIN Skill_Mappings job_sm
    ON sk.skill_id      = job_sm.skill_id
    AND job_sm.entity_type = 'Job'
    AND job_sm.entity_id   = @job_id

-- All skills the student has
LEFT JOIN Skill_Mappings stu_sm
    ON sk.skill_id       = stu_sm.skill_id
    AND stu_sm.entity_type = 'Student'
    AND stu_sm.entity_id   = @student_id

-- Only show skills relevant to this job or student
WHERE job_sm.skill_id IS NOT NULL OR stu_sm.skill_id IS NOT NULL

ORDER BY
    FIELD(match_status, 'GAP', 'MATCHED', 'EXTRA'),
    sk.skill_type,
    sk.skill_name;


-- Q28. A student's personal application success analytics
--      Powers the stats cards at the top of the student dashboard:
--      "Applications Sent", "Interviews Scheduled", "Offers Received"
--      and the personal success rate breakdown.
SET @student_id = 1;

SELECT
    COUNT(*)                                                           AS total_applied,
    SUM(CASE WHEN a.status = 'Shortlisted'        THEN 1 ELSE 0 END)  AS shortlisted,
    SUM(CASE WHEN a.status = 'Interview_Scheduled' THEN 1 ELSE 0 END) AS interviews_scheduled,
    SUM(CASE WHEN a.status = 'Selected'           THEN 1 ELSE 0 END)  AS selected,
    SUM(CASE WHEN a.status = 'Rejected'           THEN 1 ELSE 0 END)  AS rejected,
    SUM(CASE WHEN a.status = 'Offer_Accepted'     THEN 1 ELSE 0 END)  AS offers_accepted,
    SUM(CASE WHEN a.status = 'Offer_Declined'     THEN 1 ELSE 0 END)  AS offers_declined,
    -- Shortlist rate: how many applications led to shortlisting
    ROUND(
        SUM(CASE WHEN a.status != 'Applied' AND a.status != 'Rejected'
                 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2
    )                                                                  AS shortlist_rate_pct,
    -- Selection rate: out of shortlisted, how many got selected
    ROUND(
        SUM(CASE WHEN a.status IN ('Selected','Offer_Accepted','Offer_Declined')
                 THEN 1 ELSE 0 END) * 100.0
        / NULLIF(SUM(CASE WHEN a.status NOT IN ('Applied','Rejected')
                          THEN 1 ELSE 0 END), 0), 2
    )                                                                  AS selection_rate_pct
FROM Applications a
WHERE a.student_id = @student_id;


-- ============================================================
-- COMPANY PORTAL QUERIES
-- (Prototype shows: applicant table with Shortlist/Reject
--  buttons, interview schedule, offers pending)
-- ============================================================

-- Q29. Candidate pipeline per job — count at each stage
--      Powers the pipeline/funnel view in the company portal.
--      Shows how many candidates are at each application stage.
SET @job_id = 1;

SELECT
    jp.job_title,
    c.company_name,
    a.status,
    COUNT(*)                                   AS candidate_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*))
          OVER (PARTITION BY a.job_id), 2)     AS stage_pct
FROM Applications a
INNER JOIN Job_Postings jp ON a.job_id     = jp.job_id
INNER JOIN Companies    c  ON jp.company_id = c.company_id
WHERE a.job_id = @job_id
GROUP BY a.job_id, jp.job_title, c.company_name, a.status
ORDER BY
    FIELD(a.status,
        'Applied','Shortlisted','Interview_Scheduled',
        'Selected','Offer_Accepted','Offer_Declined','Rejected');


-- Q30. Ranked shortlist for a job — top candidates by CGPA + skills match
--      Powers the "Recent Applications" table in company portal
--      with an automatic ranking so recruiters can bulk-shortlist.
SET @job_id = 1;

WITH JobSkillCount AS (
    -- Total number of skills required by this job
    SELECT COUNT(*) AS total_required
    FROM Skill_Mappings
    WHERE entity_type = 'Job' AND entity_id = @job_id
),
StudentSkillMatch AS (
    -- For each applicant, count how many required skills they have
    SELECT
        sm_stu.entity_id AS student_id,
        COUNT(*)         AS matched_skills
    FROM Skill_Mappings sm_stu
    INNER JOIN Skill_Mappings sm_job
        ON sm_stu.skill_id      = sm_job.skill_id
        AND sm_job.entity_type  = 'Job'
        AND sm_job.entity_id    = @job_id
    WHERE sm_stu.entity_type = 'Student'
    GROUP BY sm_stu.entity_id
)
SELECT
    s.student_id,
    s.full_name,
    s.department,
    s.cgpa,
    s.backlogs,
    a.status                                                        AS application_status,
    a.applied_at,
    COALESCE(ssm.matched_skills, 0)                                 AS skills_matched,
    jsc.total_required                                              AS skills_required,
    ROUND(COALESCE(ssm.matched_skills, 0) * 100.0
          / NULLIF(jsc.total_required, 0), 0)                       AS skill_match_pct,
    -- Composite rank: weighted CGPA (60%) + skills match (40%)
    RANK() OVER (
        ORDER BY
            (s.cgpa * 0.6 + COALESCE(ssm.matched_skills,0) * 0.4 / NULLIF(jsc.total_required,1)) DESC
    )                                                               AS candidate_rank
FROM Applications a
INNER JOIN Students s ON a.student_id = s.student_id
CROSS JOIN JobSkillCount jsc
LEFT  JOIN StudentSkillMatch ssm ON ssm.student_id = s.student_id
WHERE a.job_id = @job_id
ORDER BY candidate_rank;


-- Q31. Average interview score per round type per job
--      Powers the "Interview Analytics" panel companies see
--      to understand where candidates are dropping off.
SET @company_id = 1;

SELECT
    c.company_name,
    jp.job_title,
    jp.job_id,
    ir.round_type,
    COUNT(*)                               AS total_candidates,
    SUM(CASE WHEN ires.outcome = 'Pass' THEN 1 ELSE 0 END) AS passed,
    SUM(CASE WHEN ires.outcome = 'Fail' THEN 1 ELSE 0 END) AS failed,
    ROUND(AVG(ires.score), 2)             AS avg_score,
    ROUND(MIN(ires.score), 2)             AS min_score,
    ROUND(MAX(ires.score), 2)             AS max_score,
    ROUND(SUM(CASE WHEN ires.outcome = 'Pass' THEN 1 ELSE 0 END)
          * 100.0 / COUNT(*), 2)          AS pass_rate_pct
FROM Companies c
INNER JOIN Job_Postings jp      ON c.company_id     = jp.company_id
INNER JOIN Applications a       ON jp.job_id        = a.job_id
INNER JOIN Interview_Rounds ir  ON a.application_id = ir.application_id
INNER JOIN Interview_Results ires ON ir.round_id    = ires.round_id
WHERE c.company_id = @company_id
GROUP BY c.company_name, jp.job_id, jp.job_title, ir.round_type
ORDER BY jp.job_id, FIELD(ir.round_type,
    'Aptitude','Coding Test','Technical','Group Discussion','Case Study','Managerial','HR');


-- Q32. Time-to-hire per company
--      Shows how long the recruitment cycle takes from
--      application → placement (avg, fastest, slowest).
SELECT
    c.company_name,
    c.industry,
    COUNT(p.placement_id)                              AS total_hires,
    ROUND(AVG(DATEDIFF(p.placed_at, a.applied_at)), 0) AS avg_days_to_hire,
    MIN(DATEDIFF(p.placed_at, a.applied_at))           AS fastest_hire_days,
    MAX(DATEDIFF(p.placed_at, a.applied_at))           AS slowest_hire_days,
    ROUND(AVG(p.ctc_fixed + p.ctc_variable), 2)        AS avg_ctc_offered
FROM Companies c
INNER JOIN Job_Postings jp  ON c.company_id     = jp.company_id
INNER JOIN Applications a   ON jp.job_id        = a.job_id
INNER JOIN Placements p     ON a.application_id = p.application_id
GROUP BY c.company_id, c.company_name, c.industry
ORDER BY avg_days_to_hire ASC;


-- ============================================================
-- ADMIN PORTAL QUERIES
-- (Prototype shows: dept stats table, top companies table,
--  overall placement % stat card)
-- ============================================================

-- Q33. CTC band distribution — count per band
--      Feeds the pie/bar chart in the admin analytics section
--      showing how placements are distributed by salary range.
SELECT
    ctc_band,
    COUNT(*)                                            AS placement_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2)  AS percentage,
    ROUND(AVG(total_ctc), 2)                            AS avg_ctc_in_band,
    ROUND(MIN(total_ctc), 2)                            AS min_ctc,
    ROUND(MAX(total_ctc), 2)                            AS max_ctc
FROM (
    SELECT
        p.placement_id,
        ROUND(p.ctc_fixed + p.ctc_variable, 2) AS total_ctc,
        CASE
            WHEN (p.ctc_fixed + p.ctc_variable) >= 15 THEN 'Super Dream (≥15 LPA)'
            WHEN (p.ctc_fixed + p.ctc_variable) >= 10 THEN 'Dream (10–15 LPA)'
            WHEN (p.ctc_fixed + p.ctc_variable) >=  6 THEN 'Good (6–10 LPA)'
            ELSE                                            'Normal (<6 LPA)'
        END AS ctc_band
    FROM Placements p
) banded
GROUP BY ctc_band
ORDER BY MIN(total_ctc) DESC;


-- Q34. Year-over-year placement comparison with % change
--      Powers the "Trend Analysis" section in the admin portal.
--      Uses LAG() window function to calculate year-on-year change.
SELECT
    yr,
    total_placements,
    avg_ctc,
    max_ctc,
    placement_rate_pct,
    -- YoY change in placement count
    LAG(total_placements) OVER (ORDER BY yr)           AS prev_year_placements,
    ROUND(
        (total_placements - LAG(total_placements) OVER (ORDER BY yr))
        * 100.0 / NULLIF(LAG(total_placements) OVER (ORDER BY yr), 0), 2
    )                                                  AS placement_yoy_change_pct,
    -- YoY change in average CTC
    LAG(avg_ctc) OVER (ORDER BY yr)                   AS prev_year_avg_ctc,
    ROUND(
        (avg_ctc - LAG(avg_ctc) OVER (ORDER BY yr))
        * 100.0 / NULLIF(LAG(avg_ctc) OVER (ORDER BY yr), 0), 2
    )                                                  AS avg_ctc_yoy_change_pct
FROM (
    SELECT
        YEAR(p.placed_at)                                           AS yr,
        COUNT(p.placement_id)                                       AS total_placements,
        ROUND(AVG(p.ctc_fixed + p.ctc_variable), 2)                AS avg_ctc,
        ROUND(MAX(p.ctc_fixed + p.ctc_variable), 2)                AS max_ctc,
        -- Placement rate = placed that year / total students enrolled that year
        ROUND(COUNT(p.placement_id) * 100.0
              / NULLIF((SELECT COUNT(*) FROM Students s2
                        WHERE YEAR(s2.created_at) <= YEAR(p.placed_at)), 0), 2) AS placement_rate_pct
    FROM Placements p
    GROUP BY YEAR(p.placed_at)
) yearly
ORDER BY yr;


-- Q35. Top companies ranked by average CTC offered
--      Directly feeds the "Top Recruiting Companies" table
--      in the admin portal with an automatic rank column.
SELECT
    company_rank,
    company_name,
    industry,
    students_hired,
    avg_ctc_lpa,
    max_ctc_lpa,
    total_applications,
    ROUND(students_hired * 100.0 / NULLIF(total_applications, 0), 2) AS offer_conversion_pct
FROM (
    SELECT
        c.company_id,
        c.company_name,
        c.industry,
        COUNT(DISTINCT p.placement_id)                      AS students_hired,
        ROUND(AVG(p.ctc_fixed + p.ctc_variable), 2)        AS avg_ctc_lpa,
        ROUND(MAX(p.ctc_fixed + p.ctc_variable), 2)        AS max_ctc_lpa,
        COUNT(DISTINCT a.application_id)                   AS total_applications,
        RANK() OVER (
            ORDER BY AVG(p.ctc_fixed + p.ctc_variable) DESC
        )                                                  AS company_rank
    FROM Companies c
    INNER JOIN Job_Postings jp  ON c.company_id     = jp.company_id
    LEFT  JOIN Applications a   ON jp.job_id        = a.job_id
    LEFT  JOIN Placements p     ON a.application_id = p.application_id
    WHERE c.is_approved = TRUE
    GROUP BY c.company_id, c.company_name, c.industry
) ranked
WHERE students_hired > 0
ORDER BY company_rank;

-- ============================================================
-- END OF MISSING QUERIES
-- ============================================================
