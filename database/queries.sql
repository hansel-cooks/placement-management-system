-- ============================================================
--  Campus Placement Cell Management System — Complete Query Set
--  Sections: Q01–Q35 | SP01–SP05 | TR01–TR05 | CU01–CU03
-- ============================================================

USE placement_db;

-- ============================================================
-- SECTION 1: BASIC JOINs
-- ============================================================

-- Q1. Placed students with company and CTC (INNER JOIN)
SELECT
    s.student_id, s.full_name, s.department, s.cgpa,
    c.company_name, jp.job_title,
    p.ctc_fixed + p.ctc_variable AS total_ctc,
    p.joining_date
FROM Students s
INNER JOIN Placements p    ON s.student_id     = p.student_id
INNER JOIN Applications a  ON p.application_id = a.application_id
INNER JOIN Job_Postings jp ON a.job_id         = jp.job_id
INNER JOIN Companies c     ON jp.company_id    = c.company_id
ORDER BY total_ctc DESC;


-- Q2. All students with placement status (LEFT JOIN, includes unplaced)
SELECT
    s.student_id, s.full_name, s.department, s.cgpa,
    COALESCE(c.company_name, 'Not Placed')     AS company,
    COALESCE(jp.job_title,   'N/A')            AS role,
    COALESCE(p.ctc_fixed + p.ctc_variable, 0)  AS total_ctc
FROM Students s
LEFT JOIN Placements p    ON s.student_id     = p.student_id
LEFT JOIN Applications a  ON p.application_id = a.application_id
LEFT JOIN Job_Postings jp ON a.job_id         = jp.job_id
LEFT JOIN Companies c     ON jp.company_id    = c.company_id
ORDER BY s.department, total_ctc DESC;


-- Q3. Job postings with company name and total applicants
SELECT
    jp.job_id, c.company_name, jp.job_title, jp.location,
    jp.ctc_fixed + jp.ctc_variable AS total_ctc,
    jp.openings,
    COUNT(a.application_id)        AS total_applications
FROM Job_Postings jp
INNER JOIN Companies c    ON jp.company_id = c.company_id
LEFT  JOIN Applications a ON jp.job_id     = a.job_id
GROUP BY jp.job_id, c.company_name, jp.job_title,
         jp.location, jp.ctc_fixed, jp.ctc_variable, jp.openings
ORDER BY total_applications DESC;


-- Q4. Students with their skills (multi-table JOIN via Skill_Mappings)
SELECT
    s.student_id, s.full_name, s.department,
    sk.skill_name, sk.skill_type, sm.proficiency
FROM Students s
INNER JOIN Skill_Mappings sm ON sm.entity_id = s.student_id AND sm.entity_type = 'Student'
INNER JOIN Skills sk         ON sk.skill_id  = sm.skill_id
ORDER BY s.student_id, sk.skill_type, sk.skill_name;


-- ============================================================
-- SECTION 2: AGGREGATE FUNCTIONS + GROUP BY + HAVING
-- ============================================================

-- Q5. Department-wise placement statistics
SELECT
    s.department,
    COUNT(DISTINCT s.student_id)                                   AS total_students,
    COUNT(DISTINCT p.student_id)                                   AS placed_students,
    COUNT(DISTINCT s.student_id) - COUNT(DISTINCT p.student_id)   AS unplaced_students,
    ROUND(COUNT(DISTINCT p.student_id) * 100.0
          / COUNT(DISTINCT s.student_id), 2)                       AS placement_rate_pct,
    ROUND(AVG(p.ctc_fixed + p.ctc_variable), 2)                   AS avg_ctc_lpa,
    ROUND(MAX(p.ctc_fixed + p.ctc_variable), 2)                   AS max_ctc_lpa,
    ROUND(MIN(p.ctc_fixed + p.ctc_variable), 2)                   AS min_ctc_lpa
FROM Students s
LEFT JOIN Placements p ON s.student_id = p.student_id
GROUP BY s.department
ORDER BY placement_rate_pct DESC;


-- Q6. Companies that hired more than 5 students (HAVING)
SELECT
    c.company_name, c.industry,
    COUNT(p.placement_id)                        AS students_hired,
    ROUND(AVG(p.ctc_fixed + p.ctc_variable), 2) AS avg_ctc_offered
FROM Companies c
INNER JOIN Job_Postings jp ON c.company_id     = jp.company_id
INNER JOIN Applications a  ON jp.job_id        = a.job_id
INNER JOIN Placements p    ON a.application_id = p.application_id
GROUP BY c.company_id, c.company_name, c.industry
HAVING COUNT(p.placement_id) > 5
ORDER BY students_hired DESC;


-- Q7. Unplaced students with more than 3 applications (HAVING)
SELECT
    s.student_id, s.full_name, s.department, s.cgpa,
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

-- Q9. Students with CGPA above their department average (correlated subquery)
SELECT student_id, full_name, department, cgpa
FROM Students s
WHERE cgpa > (SELECT AVG(cgpa) FROM Students WHERE department = s.department)
ORDER BY department, cgpa DESC;


-- Q10. Job postings with zero applications (NOT IN)
SELECT jp.job_id, c.company_name, jp.job_title, jp.application_deadline
FROM Job_Postings jp
INNER JOIN Companies c ON jp.company_id = c.company_id
WHERE jp.job_id NOT IN (SELECT DISTINCT job_id FROM Applications)
ORDER BY jp.created_at;


-- Q11. Top earning placement per department (subquery in FROM)
SELECT dept_max.department, s.full_name, c.company_name, dept_max.max_ctc AS total_ctc_lpa
FROM (
    SELECT st.department, MAX(p.ctc_fixed + p.ctc_variable) AS max_ctc
    FROM Students st
    INNER JOIN Placements p ON st.student_id = p.student_id
    GROUP BY st.department
) AS dept_max
INNER JOIN Students s      ON s.department  = dept_max.department
INNER JOIN Placements p    ON s.student_id  = p.student_id
                           AND (p.ctc_fixed + p.ctc_variable) = dept_max.max_ctc
INNER JOIN Applications a  ON p.application_id = a.application_id
INNER JOIN Job_Postings jp ON a.job_id         = jp.job_id
INNER JOIN Companies c     ON jp.company_id    = c.company_id
ORDER BY dept_max.max_ctc DESC;


-- Q12. Students with internship experience who are placed (EXISTS)
SELECT s.student_id, s.full_name, s.department, s.cgpa
FROM Students s
WHERE EXISTS (SELECT 1 FROM Internships i WHERE i.student_id = s.student_id)
  AND EXISTS (SELECT 1 FROM Placements  p WHERE p.student_id = s.student_id)
ORDER BY s.cgpa DESC;


-- Q13. Students with no internship and not placed (NOT EXISTS)
SELECT s.student_id, s.full_name, s.department, s.cgpa
FROM Students s
WHERE NOT EXISTS (SELECT 1 FROM Internships i WHERE i.student_id = s.student_id)
  AND NOT EXISTS (SELECT 1 FROM Placements  p WHERE p.student_id = s.student_id)
ORDER BY s.cgpa DESC;


-- ============================================================
-- SECTION 4: WINDOW FUNCTIONS
-- ============================================================

-- Q14. Rank students within each department by CGPA
SELECT
    student_id, full_name, department, cgpa,
    RANK()       OVER (PARTITION BY department ORDER BY cgpa DESC) AS dept_rank,
    DENSE_RANK() OVER (PARTITION BY department ORDER BY cgpa DESC) AS dept_dense_rank,
    ROW_NUMBER() OVER (PARTITION BY department ORDER BY cgpa DESC) AS dept_row_num
FROM Students
ORDER BY department, dept_rank;


-- Q15. Cumulative placements over time with 7-day rolling avg CTC
SELECT
    DATE(placed_at)                                                 AS placement_date,
    COUNT(*)                                                        AS placements_on_day,
    SUM(COUNT(*)) OVER (ORDER BY DATE(placed_at))                   AS cumulative_placements,
    ROUND(AVG(ctc_fixed + ctc_variable), 2)                        AS avg_ctc_on_day,
    ROUND(AVG(AVG(ctc_fixed + ctc_variable))
          OVER (ORDER BY DATE(placed_at)
                ROWS BETWEEN 6 PRECEDING AND CURRENT ROW), 2)      AS rolling_7day_avg_ctc
FROM Placements
GROUP BY DATE(placed_at)
ORDER BY placement_date;


-- Q16. Each placed student's CTC vs their department average
SELECT
    s.student_id, s.full_name, s.department,
    ROUND(p.ctc_fixed + p.ctc_variable, 2)                                    AS student_ctc,
    ROUND(AVG(p.ctc_fixed + p.ctc_variable) OVER (PARTITION BY s.department), 2) AS dept_avg_ctc,
    ROUND((p.ctc_fixed + p.ctc_variable)
          - AVG(p.ctc_fixed + p.ctc_variable) OVER (PARTITION BY s.department), 2) AS diff_from_avg
FROM Students s
INNER JOIN Placements p ON s.student_id = p.student_id
ORDER BY s.department, student_ctc DESC;


-- Q17. Top 3 CTC placements per department (RANK + filter)
SELECT * FROM (
    SELECT
        s.department, s.full_name, c.company_name, jp.job_title,
        ROUND(p.ctc_fixed + p.ctc_variable, 2)                     AS total_ctc,
        RANK() OVER (PARTITION BY s.department
                     ORDER BY (p.ctc_fixed + p.ctc_variable) DESC) AS rnk
    FROM Students s
    INNER JOIN Placements p    ON s.student_id     = p.student_id
    INNER JOIN Applications a  ON p.application_id = a.application_id
    INNER JOIN Job_Postings jp ON a.job_id         = jp.job_id
    INNER JOIN Companies c     ON jp.company_id    = c.company_id
) ranked
WHERE rnk <= 3
ORDER BY department, rnk;


-- Q18. Interview pass rate and average score per round type
SELECT
    ir.round_type,
    COUNT(*)                                                          AS total_rounds,
    SUM(CASE WHEN ires.outcome = 'Pass' THEN 1 ELSE 0 END)          AS passed,
    SUM(CASE WHEN ires.outcome = 'Fail' THEN 1 ELSE 0 END)          AS failed,
    ROUND(SUM(CASE WHEN ires.outcome = 'Pass' THEN 1 ELSE 0 END)
          * 100.0 / COUNT(*), 2)                                      AS pass_rate_pct,
    ROUND(AVG(ires.score), 2)                                        AS avg_score
FROM Interview_Rounds ir
INNER JOIN Interview_Results ires ON ir.round_id = ires.round_id
GROUP BY ir.round_type
ORDER BY pass_rate_pct DESC;


-- ============================================================
-- SECTION 5: CTEs
-- ============================================================

-- Q19. Full student pipeline summary using multiple CTEs
WITH ApplicationSummary AS (
    SELECT student_id,
        COUNT(*)                                             AS total_applied,
        SUM(CASE WHEN status = 'Rejected'       THEN 1 END) AS rejected,
        SUM(CASE WHEN status = 'Shortlisted'    THEN 1 END) AS shortlisted,
        SUM(CASE WHEN status = 'Offer_Accepted' THEN 1 END) AS offer_accepted
    FROM Applications GROUP BY student_id
),
InternshipCount AS (
    SELECT student_id, COUNT(*) AS internship_count FROM Internships GROUP BY student_id
),
ProjectCount AS (
    SELECT student_id, COUNT(*) AS project_count FROM Student_Projects GROUP BY student_id
)
SELECT
    s.student_id, s.full_name, s.department, s.cgpa,
    COALESCE(ic.internship_count, 0) AS internships,
    COALESCE(pc.project_count,    0) AS projects,
    COALESCE(a.total_applied,     0) AS jobs_applied,
    COALESCE(a.shortlisted,       0) AS shortlisted,
    COALESCE(a.rejected,          0) AS rejected,
    s.is_placed
FROM Students s
LEFT JOIN ApplicationSummary a  ON s.student_id = a.student_id
LEFT JOIN InternshipCount    ic ON s.student_id = ic.student_id
LEFT JOIN ProjectCount       pc ON s.student_id = pc.student_id
ORDER BY s.department, s.cgpa DESC;


-- Q20. Companies ranked by offer-to-application conversion rate (CTE)
WITH CompanyStats AS (
    SELECT
        c.company_id, c.company_name,
        COUNT(DISTINCT a.application_id) AS total_applications,
        COUNT(DISTINCT p.placement_id)   AS total_placements
    FROM Companies c
    INNER JOIN Job_Postings jp ON c.company_id     = jp.company_id
    LEFT  JOIN Applications a  ON jp.job_id        = a.job_id
    LEFT  JOIN Placements p    ON a.application_id = p.application_id
    GROUP BY c.company_id, c.company_name
)
SELECT
    company_name, total_applications, total_placements,
    ROUND(total_placements * 100.0 / NULLIF(total_applications, 0), 2) AS conversion_rate_pct
FROM CompanyStats
WHERE total_applications > 0
ORDER BY conversion_rate_pct DESC;


-- ============================================================
-- SECTION 6: CASE + CONDITIONAL LOGIC
-- ============================================================

-- Q21. Classify students into CGPA performance bands
SELECT
    student_id, full_name, department, cgpa,
    CASE
        WHEN cgpa >= 9.0 THEN 'Outstanding'
        WHEN cgpa >= 8.0 THEN 'Excellent'
        WHEN cgpa >= 7.0 THEN 'Good'
        WHEN cgpa >= 6.0 THEN 'Average'
        ELSE                  'Below Average'
    END AS performance_band,
    CASE WHEN is_placed = TRUE THEN 'Placed' ELSE 'Unplaced' END AS placement_status
FROM Students
ORDER BY cgpa DESC;


-- Q22. Classify placements by CTC range
SELECT
    s.full_name, s.department, c.company_name,
    ROUND(p.ctc_fixed + p.ctc_variable, 2) AS total_ctc,
    CASE
        WHEN (p.ctc_fixed + p.ctc_variable) >= 15 THEN 'Super Dream (15+ LPA)'
        WHEN (p.ctc_fixed + p.ctc_variable) >= 10 THEN 'Dream (10-15 LPA)'
        WHEN (p.ctc_fixed + p.ctc_variable) >=  6 THEN 'Good (6-10 LPA)'
        ELSE                                            'Normal (< 6 LPA)'
    END AS ctc_category
FROM Placements p
INNER JOIN Students s      ON p.student_id     = s.student_id
INNER JOIN Applications a  ON p.application_id = a.application_id
INNER JOIN Job_Postings jp ON a.job_id         = jp.job_id
INNER JOIN Companies c     ON jp.company_id    = c.company_id
ORDER BY total_ctc DESC;


-- ============================================================
-- SECTION 7: ADMIN REPORT QUERIES
-- ============================================================

-- Q23. Overall placement dashboard — single row summary
SELECT
    (SELECT COUNT(*) FROM Students)                            AS total_students,
    (SELECT COUNT(*) FROM Students WHERE is_placed = TRUE)     AS placed_students,
    (SELECT COUNT(*) FROM Students WHERE is_placed = FALSE)    AS unplaced_students,
    ROUND((SELECT COUNT(*) FROM Students WHERE is_placed = TRUE) * 100.0
          / (SELECT COUNT(*) FROM Students), 2)                AS overall_placement_pct,
    (SELECT COUNT(*) FROM Companies    WHERE is_approved = TRUE) AS participating_companies,
    (SELECT COUNT(*) FROM Job_Postings WHERE is_approved = TRUE) AS total_jobs_posted,
    (SELECT ROUND(AVG(ctc_fixed + ctc_variable), 2) FROM Placements) AS avg_package_lpa,
    (SELECT ROUND(MAX(ctc_fixed + ctc_variable), 2) FROM Placements) AS highest_package_lpa;


-- Q24. Month-wise placement trend
SELECT
    YEAR(placed_at)      AS yr,
    MONTH(placed_at)     AS mo,
    MONTHNAME(placed_at) AS month_name,
    COUNT(*)             AS placements,
    ROUND(AVG(ctc_fixed + ctc_variable), 2) AS avg_ctc,
    ROUND(MAX(ctc_fixed + ctc_variable), 2) AS max_ctc
FROM Placements
GROUP BY YEAR(placed_at), MONTH(placed_at), MONTHNAME(placed_at)
ORDER BY yr, mo;


-- Q25. Most in-demand skills among placed students
SELECT
    sk.skill_name, sk.skill_type,
    COUNT(DISTINCT sm.entity_id)                                  AS students_with_skill,
    SUM(CASE WHEN s.is_placed = TRUE THEN 1 ELSE 0 END)          AS placed_with_skill,
    ROUND(SUM(CASE WHEN s.is_placed = TRUE THEN 1 ELSE 0 END)
          * 100.0 / COUNT(DISTINCT sm.entity_id), 2)              AS placement_rate_pct
FROM Skills sk
INNER JOIN Skill_Mappings sm ON sk.skill_id = sm.skill_id AND sm.entity_type = 'Student'
INNER JOIN Students s        ON sm.entity_id = s.student_id
GROUP BY sk.skill_id, sk.skill_name, sk.skill_type
HAVING COUNT(DISTINCT sm.entity_id) >= 5
ORDER BY placement_rate_pct DESC, placed_with_skill DESC;


-- ============================================================
-- SECTION 8: STUDENT PORTAL QUERIES
-- ============================================================

-- Q26. Jobs a specific student is eligible for (FIND_IN_SET eligibility check)
-- Replace @student_id with the logged-in student's ID
SET @student_id = 1;

SELECT
    jp.job_id, c.company_name, c.industry, jp.job_title,
    jp.location, jp.job_type,
    ROUND(jp.ctc_fixed + jp.ctc_variable, 2) AS total_ctc,
    jp.min_cgpa, jp.openings, jp.application_deadline,
    CASE WHEN a.application_id IS NOT NULL THEN 'Applied' ELSE 'Eligible' END AS apply_status
FROM Job_Postings jp
INNER JOIN Companies c ON jp.company_id = c.company_id
INNER JOIN Students s  ON s.student_id  = @student_id
    AND s.cgpa     >= jp.min_cgpa
    AND s.backlogs <= COALESCE(jp.max_backlogs, 0)
    AND (jp.eligible_depts IS NULL OR jp.eligible_depts = ''
         OR FIND_IN_SET(s.department, jp.eligible_depts) > 0)
    AND (jp.eligible_grad_years IS NULL OR jp.eligible_grad_years = ''
         OR FIND_IN_SET(CAST(s.graduation_year AS CHAR), jp.eligible_grad_years) > 0)
LEFT JOIN Applications a ON a.job_id = jp.job_id AND a.student_id = @student_id
WHERE jp.is_approved = TRUE
  AND (jp.application_deadline IS NULL OR jp.application_deadline >= CURDATE())
ORDER BY jp.application_deadline ASC, total_ctc DESC;


-- Q27. Skills gap for a student vs a specific job (GAP / MATCHED / EXTRA)
SET @student_id = 1;
SET @job_id     = 1;

SELECT
    sk.skill_name, sk.skill_type,
    CASE WHEN job_sm.skill_id IS NOT NULL THEN 'Yes' ELSE 'No' END AS required_by_job,
    CASE WHEN stu_sm.skill_id IS NOT NULL THEN 'Yes' ELSE 'No' END AS student_has,
    COALESCE(stu_sm.proficiency, '-') AS proficiency,
    CASE
        WHEN job_sm.skill_id IS NOT NULL AND stu_sm.skill_id IS NULL  THEN 'GAP'
        WHEN job_sm.skill_id IS NOT NULL AND stu_sm.skill_id IS NOT NULL THEN 'MATCHED'
        ELSE 'EXTRA'
    END AS match_status
FROM Skills sk
LEFT JOIN Skill_Mappings job_sm ON sk.skill_id = job_sm.skill_id
    AND job_sm.entity_type = 'Job'     AND job_sm.entity_id = @job_id
LEFT JOIN Skill_Mappings stu_sm ON sk.skill_id = stu_sm.skill_id
    AND stu_sm.entity_type = 'Student' AND stu_sm.entity_id = @student_id
WHERE job_sm.skill_id IS NOT NULL OR stu_sm.skill_id IS NOT NULL
ORDER BY FIELD(match_status, 'GAP', 'MATCHED', 'EXTRA'), sk.skill_type, sk.skill_name;


-- Q28. Student's personal application success analytics (dashboard stat cards)
SET @student_id = 1;

SELECT
    COUNT(*)                                                             AS total_applied,
    SUM(CASE WHEN a.status = 'Shortlisted'         THEN 1 ELSE 0 END)  AS shortlisted,
    SUM(CASE WHEN a.status = 'Interview_Scheduled' THEN 1 ELSE 0 END)  AS interviews_scheduled,
    SUM(CASE WHEN a.status = 'Selected'            THEN 1 ELSE 0 END)  AS selected,
    SUM(CASE WHEN a.status = 'Rejected'            THEN 1 ELSE 0 END)  AS rejected,
    SUM(CASE WHEN a.status = 'Offer_Accepted'      THEN 1 ELSE 0 END)  AS offers_accepted,
    ROUND(SUM(CASE WHEN a.status NOT IN ('Applied','Rejected') THEN 1 ELSE 0 END)
          * 100.0 / COUNT(*), 2)                                         AS shortlist_rate_pct,
    ROUND(SUM(CASE WHEN a.status IN ('Selected','Offer_Accepted','Offer_Declined')
                   THEN 1 ELSE 0 END) * 100.0
          / NULLIF(SUM(CASE WHEN a.status NOT IN ('Applied','Rejected')
                            THEN 1 ELSE 0 END), 0), 2)                  AS selection_rate_pct
FROM Applications a
WHERE a.student_id = @student_id;


-- ============================================================
-- SECTION 9: COMPANY PORTAL QUERIES
-- ============================================================

-- Q29. Candidate count at each application stage per job (pipeline funnel)
SET @job_id = 1;

SELECT
    jp.job_title, c.company_name, a.status,
    COUNT(*) AS candidate_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY a.job_id), 2) AS stage_pct
FROM Applications a
INNER JOIN Job_Postings jp ON a.job_id      = jp.job_id
INNER JOIN Companies c     ON jp.company_id = c.company_id
WHERE a.job_id = @job_id
GROUP BY a.job_id, jp.job_title, c.company_name, a.status
ORDER BY FIELD(a.status,
    'Applied','Shortlisted','Interview_Scheduled',
    'Selected','Offer_Accepted','Offer_Declined','Rejected');


-- Q30. Ranked shortlist for a job — CGPA (60%) + skill match (40%)
SET @job_id = 1;

WITH JobSkillCount AS (
    SELECT COUNT(*) AS total_required
    FROM Skill_Mappings WHERE entity_type = 'Job' AND entity_id = @job_id
),
StudentSkillMatch AS (
    SELECT sm_stu.entity_id AS student_id, COUNT(*) AS matched_skills
    FROM Skill_Mappings sm_stu
    INNER JOIN Skill_Mappings sm_job
        ON sm_stu.skill_id = sm_job.skill_id
       AND sm_job.entity_type = 'Job' AND sm_job.entity_id = @job_id
    WHERE sm_stu.entity_type = 'Student'
    GROUP BY sm_stu.entity_id
)
SELECT
    s.student_id, s.full_name, s.department, s.cgpa, s.backlogs,
    a.status AS application_status, a.applied_at,
    COALESCE(ssm.matched_skills, 0)                                  AS skills_matched,
    jsc.total_required                                               AS skills_required,
    ROUND(COALESCE(ssm.matched_skills, 0) * 100.0
          / NULLIF(jsc.total_required, 0), 0)                        AS skill_match_pct,
    RANK() OVER (ORDER BY
        (s.cgpa * 0.6 + COALESCE(ssm.matched_skills,0) * 0.4
         / NULLIF(jsc.total_required,1)) DESC)                       AS candidate_rank
FROM Applications a
INNER JOIN Students s ON a.student_id = s.student_id
CROSS JOIN JobSkillCount jsc
LEFT  JOIN StudentSkillMatch ssm ON ssm.student_id = s.student_id
WHERE a.job_id = @job_id
ORDER BY candidate_rank;


-- Q31. Average interview score per round type per company
SET @company_id = 1;

SELECT
    c.company_name, jp.job_title, jp.job_id, ir.round_type,
    COUNT(*)                                                         AS total_candidates,
    SUM(CASE WHEN ires.outcome = 'Pass' THEN 1 ELSE 0 END)         AS passed,
    SUM(CASE WHEN ires.outcome = 'Fail' THEN 1 ELSE 0 END)         AS failed,
    ROUND(AVG(ires.score), 2)                                       AS avg_score,
    ROUND(MIN(ires.score), 2)                                       AS min_score,
    ROUND(MAX(ires.score), 2)                                       AS max_score,
    ROUND(SUM(CASE WHEN ires.outcome = 'Pass' THEN 1 ELSE 0 END)
          * 100.0 / COUNT(*), 2)                                     AS pass_rate_pct
FROM Companies c
INNER JOIN Job_Postings jp        ON c.company_id     = jp.company_id
INNER JOIN Applications a         ON jp.job_id        = a.job_id
INNER JOIN Interview_Rounds ir    ON a.application_id = ir.application_id
INNER JOIN Interview_Results ires ON ir.round_id      = ires.round_id
WHERE c.company_id = @company_id
GROUP BY c.company_name, jp.job_id, jp.job_title, ir.round_type
ORDER BY jp.job_id,
    FIELD(ir.round_type,'Aptitude','Coding Test','Technical','Group Discussion','Managerial','HR');


-- Q32. Time-to-hire per company (DATEDIFF from application to placement)
SELECT
    c.company_name, c.industry,
    COUNT(p.placement_id)                              AS total_hires,
    ROUND(AVG(DATEDIFF(p.placed_at, a.applied_at)), 0) AS avg_days_to_hire,
    MIN(DATEDIFF(p.placed_at, a.applied_at))           AS fastest_hire_days,
    MAX(DATEDIFF(p.placed_at, a.applied_at))           AS slowest_hire_days,
    ROUND(AVG(p.ctc_fixed + p.ctc_variable), 2)       AS avg_ctc_offered
FROM Companies c
INNER JOIN Job_Postings jp ON c.company_id     = jp.company_id
INNER JOIN Applications a  ON jp.job_id        = a.job_id
INNER JOIN Placements p    ON a.application_id = p.application_id
GROUP BY c.company_id, c.company_name, c.industry
ORDER BY avg_days_to_hire ASC;


-- ============================================================
-- SECTION 10: ADMIN PORTAL QUERIES
-- ============================================================

-- Q33. Placement count and percentage per CTC band
SELECT
    ctc_band,
    COUNT(*)                                           AS placement_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) AS percentage,
    ROUND(AVG(total_ctc), 2)                           AS avg_ctc_in_band,
    ROUND(MIN(total_ctc), 2)                           AS min_ctc,
    ROUND(MAX(total_ctc), 2)                           AS max_ctc
FROM (
    SELECT placement_id,
        ROUND(ctc_fixed + ctc_variable, 2) AS total_ctc,
        CASE
            WHEN (ctc_fixed + ctc_variable) >= 15 THEN 'Super Dream (>=15 LPA)'
            WHEN (ctc_fixed + ctc_variable) >= 10 THEN 'Dream (10-15 LPA)'
            WHEN (ctc_fixed + ctc_variable) >=  6 THEN 'Good (6-10 LPA)'
            ELSE                                       'Normal (<6 LPA)'
        END AS ctc_band
    FROM Placements
) banded
GROUP BY ctc_band
ORDER BY MIN(total_ctc) DESC;


-- Q34. Year-over-year placement comparison using LAG()
SELECT
    yr, total_placements, avg_ctc, max_ctc, placement_rate_pct,
    LAG(total_placements) OVER (ORDER BY yr) AS prev_year_placements,
    ROUND((total_placements - LAG(total_placements) OVER (ORDER BY yr))
          * 100.0 / NULLIF(LAG(total_placements) OVER (ORDER BY yr), 0), 2) AS placement_yoy_pct,
    LAG(avg_ctc) OVER (ORDER BY yr) AS prev_year_avg_ctc,
    ROUND((avg_ctc - LAG(avg_ctc) OVER (ORDER BY yr))
          * 100.0 / NULLIF(LAG(avg_ctc) OVER (ORDER BY yr), 0), 2)          AS avg_ctc_yoy_pct
FROM (
    SELECT
        YEAR(p.placed_at)                             AS yr,
        COUNT(p.placement_id)                         AS total_placements,
        ROUND(AVG(p.ctc_fixed + p.ctc_variable), 2)  AS avg_ctc,
        ROUND(MAX(p.ctc_fixed + p.ctc_variable), 2)  AS max_ctc,
        ROUND(COUNT(p.placement_id) * 100.0
              / NULLIF((SELECT COUNT(*) FROM Students s2
                        WHERE YEAR(s2.created_at) <= YEAR(p.placed_at)), 0), 2) AS placement_rate_pct
    FROM Placements p
    GROUP BY YEAR(p.placed_at)
) yearly
ORDER BY yr;


-- Q35. Top companies ranked by average CTC (RANK window function)
SELECT company_rank, company_name, industry,
    students_hired, avg_ctc_lpa, max_ctc_lpa, total_applications,
    ROUND(students_hired * 100.0 / NULLIF(total_applications, 0), 2) AS offer_conversion_pct
FROM (
    SELECT
        c.company_id, c.company_name, c.industry,
        COUNT(DISTINCT p.placement_id)               AS students_hired,
        ROUND(AVG(p.ctc_fixed + p.ctc_variable), 2) AS avg_ctc_lpa,
        ROUND(MAX(p.ctc_fixed + p.ctc_variable), 2) AS max_ctc_lpa,
        COUNT(DISTINCT a.application_id)             AS total_applications,
        RANK() OVER (ORDER BY AVG(p.ctc_fixed + p.ctc_variable) DESC) AS company_rank
    FROM Companies c
    INNER JOIN Job_Postings jp ON c.company_id     = jp.company_id
    LEFT  JOIN Applications a  ON jp.job_id        = a.job_id
    LEFT  JOIN Placements p    ON a.application_id = p.application_id
    WHERE c.is_approved = TRUE
    GROUP BY c.company_id, c.company_name, c.industry
) ranked
WHERE students_hired > 0
ORDER BY company_rank;


-- ============================================================
-- SECTION 11: STORED PROCEDURES
-- ============================================================

DELIMITER $$

-- SP01. Validate eligibility and submit a job application
DROP PROCEDURE IF EXISTS sp_apply_to_job$$
CREATE PROCEDURE sp_apply_to_job(
    IN  p_student_id INT,
    IN  p_job_id     INT,
    OUT p_status     VARCHAR(100)
)
BEGIN
    DECLARE v_cgpa            DECIMAL(4,2);
    DECLARE v_dept            VARCHAR(100);
    DECLARE v_grad_year       YEAR;
    DECLARE v_backlogs        INT;
    DECLARE v_min_cgpa        DECIMAL(4,2);
    DECLARE v_eligible_dept   TEXT;
    DECLARE v_eligible_year   TEXT;
    DECLARE v_max_backlogs    INT;
    DECLARE v_deadline        DATE;
    DECLARE v_is_approved     BOOLEAN;
    DECLARE v_already_applied INT DEFAULT 0;

    SELECT cgpa, department, graduation_year, backlogs
    INTO   v_cgpa, v_dept, v_grad_year, v_backlogs
    FROM   Students WHERE student_id = p_student_id;

    SELECT min_cgpa, eligible_depts, eligible_grad_years,
           max_backlogs, application_deadline, is_approved
    INTO   v_min_cgpa, v_eligible_dept, v_eligible_year,
           v_max_backlogs, v_deadline, v_is_approved
    FROM   Job_Postings WHERE job_id = p_job_id;

    IF v_is_approved IS NULL OR v_is_approved = FALSE THEN
        SET p_status = 'ERROR: Job not found or not approved';
    ELSEIF v_deadline IS NOT NULL AND v_deadline < CURDATE() THEN
        SET p_status = 'ERROR: Application deadline has passed';
    ELSEIF v_cgpa < v_min_cgpa THEN
        SET p_status = CONCAT('ERROR: CGPA ', v_cgpa, ' below minimum ', v_min_cgpa);
    ELSEIF v_backlogs > COALESCE(v_max_backlogs, 0) THEN
        SET p_status = CONCAT('ERROR: Backlogs (', v_backlogs, ') exceed allowed limit');
    ELSEIF v_eligible_dept IS NOT NULL AND v_eligible_dept != ''
           AND FIND_IN_SET(v_dept, v_eligible_dept) = 0 THEN
        SET p_status = CONCAT('ERROR: Department ', v_dept, ' not eligible');
    ELSEIF v_eligible_year IS NOT NULL AND v_eligible_year != ''
           AND FIND_IN_SET(CAST(v_grad_year AS CHAR), v_eligible_year) = 0 THEN
        SET p_status = CONCAT('ERROR: Graduation year ', v_grad_year, ' not eligible');
    ELSE
        SELECT COUNT(*) INTO v_already_applied
        FROM Applications WHERE student_id = p_student_id AND job_id = p_job_id;

        IF v_already_applied > 0 THEN
            SET p_status = 'ERROR: Already applied to this job';
        ELSE
            INSERT INTO Applications (student_id, job_id, status)
            VALUES (p_student_id, p_job_id, 'Applied');
            SET p_status = 'SUCCESS: Application submitted';
        END IF;
    END IF;
END$$


-- SP02. Record interview result and auto-advance application status
DROP PROCEDURE IF EXISTS sp_record_interview_result$$
CREATE PROCEDURE sp_record_interview_result(
    IN  p_round_id   INT,
    IN  p_score      DECIMAL(5,2),
    IN  p_feedback   TEXT,
    IN  p_strengths  TEXT,
    IN  p_weaknesses TEXT,
    IN  p_outcome    ENUM('Pass','Fail','Hold'),
    OUT p_status     VARCHAR(100)
)
BEGIN
    DECLARE v_application_id INT;
    DECLARE v_total_rounds   INT;
    DECLARE v_passed_rounds  INT;
    DECLARE v_round_exists   INT DEFAULT 0;
    DECLARE v_result_exists  INT DEFAULT 0;

    SELECT COUNT(*) INTO v_round_exists  FROM Interview_Rounds  WHERE round_id  = p_round_id;
    SELECT COUNT(*) INTO v_result_exists FROM Interview_Results WHERE round_id  = p_round_id;

    IF v_round_exists = 0 THEN
        SET p_status = 'ERROR: Interview round not found';
    ELSEIF v_result_exists > 0 THEN
        SET p_status = 'ERROR: Result already recorded for this round';
    ELSE
        SELECT application_id INTO v_application_id FROM Interview_Rounds WHERE round_id = p_round_id;

        INSERT INTO Interview_Results (round_id, score, feedback, strengths, weaknesses, outcome)
        VALUES (p_round_id, p_score, p_feedback, p_strengths, p_weaknesses, p_outcome);

        UPDATE Interview_Rounds SET status = 'Completed' WHERE round_id = p_round_id;

        IF p_outcome = 'Fail' THEN
            UPDATE Applications SET status = 'Rejected' WHERE application_id = v_application_id;
            SET p_status = 'SUCCESS: Round failed. Application marked Rejected.';

        ELSEIF p_outcome = 'Pass' THEN
            SELECT COUNT(*) INTO v_total_rounds  FROM Interview_Rounds WHERE application_id = v_application_id;
            SELECT COUNT(*) INTO v_passed_rounds
            FROM Interview_Rounds ir
            INNER JOIN Interview_Results ires ON ir.round_id = ires.round_id
            WHERE ir.application_id = v_application_id AND ires.outcome = 'Pass';

            IF v_passed_rounds = v_total_rounds THEN
                UPDATE Applications SET status = 'Selected' WHERE application_id = v_application_id;
                SET p_status = 'SUCCESS: All rounds passed. Marked Selected.';
            ELSE
                UPDATE Applications SET status = 'Interview_Scheduled' WHERE application_id = v_application_id;
                SET p_status = 'SUCCESS: Round passed. Awaiting next round.';
            END IF;
        ELSE
            SET p_status = 'SUCCESS: Result recorded. Status on Hold.';
        END IF;
    END IF;
END$$


-- SP03. Extend a placement offer to a selected student
DROP PROCEDURE IF EXISTS sp_extend_offer$$
CREATE PROCEDURE sp_extend_offer(
    IN  p_application_id   INT,
    IN  p_ctc_fixed        DECIMAL(10,2),
    IN  p_ctc_variable     DECIMAL(10,2),
    IN  p_joining_date     DATE,
    IN  p_offer_letter_url VARCHAR(255),
    OUT p_status           VARCHAR(100)
)
BEGIN
    DECLARE v_student_id     INT;
    DECLARE v_app_status     VARCHAR(50);
    DECLARE v_already_placed INT DEFAULT 0;

    SELECT student_id, status INTO v_student_id, v_app_status
    FROM Applications WHERE application_id = p_application_id;

    IF v_student_id IS NULL THEN
        SET p_status = 'ERROR: Application not found';
    ELSEIF v_app_status != 'Selected' THEN
        SET p_status = CONCAT('ERROR: Status is ', v_app_status, '. Must be Selected.');
    ELSE
        SELECT COUNT(*) INTO v_already_placed FROM Placements WHERE student_id = v_student_id;

        IF v_already_placed > 0 THEN
            SET p_status = 'ERROR: Student already has a placement offer';
        ELSE
            INSERT INTO Placements
                (student_id, application_id, ctc_fixed, ctc_variable,
                 joining_date, offer_letter_url, offer_status)
            VALUES
                (v_student_id, p_application_id, p_ctc_fixed, p_ctc_variable,
                 p_joining_date, p_offer_letter_url, 'Extended');
            UPDATE Applications SET status = 'Offer_Accepted' WHERE application_id = p_application_id;
            SET p_status = 'SUCCESS: Offer extended successfully';
        END IF;
    END IF;
END$$


-- SP04. Get full student profile — info, skills, projects, internships
DROP PROCEDURE IF EXISTS sp_get_student_profile$$
CREATE PROCEDURE sp_get_student_profile(IN p_student_id INT)
BEGIN
    SELECT student_id, full_name, email, phone, department, degree,
           graduation_year, cgpa, backlogs, resume_url, linkedin_url, github_url, is_placed
    FROM Students WHERE student_id = p_student_id;

    SELECT sk.skill_name, sk.skill_type, sm.proficiency
    FROM Skill_Mappings sm
    INNER JOIN Skills sk ON sm.skill_id = sk.skill_id
    WHERE sm.entity_type = 'Student' AND sm.entity_id = p_student_id
    ORDER BY sk.skill_type, sk.skill_name;

    SELECT project_title, description, technologies, project_type, project_url, start_date, end_date
    FROM Student_Projects WHERE student_id = p_student_id ORDER BY end_date DESC;

    SELECT company_name, role, start_date, end_date, duration_months, stipend, description
    FROM Internships WHERE student_id = p_student_id ORDER BY start_date DESC;
END$$


-- SP05. Department-wise placement report (pass NULL for all departments)
DROP PROCEDURE IF EXISTS sp_dept_placement_report$$
CREATE PROCEDURE sp_dept_placement_report(IN p_department VARCHAR(100))
BEGIN
    SELECT
        s.department,
        COUNT(DISTINCT s.student_id)                                      AS total_students,
        COUNT(DISTINCT p.student_id)                                      AS placed_students,
        COUNT(DISTINCT s.student_id) - COUNT(DISTINCT p.student_id)      AS unplaced_students,
        ROUND(COUNT(DISTINCT p.student_id) * 100.0
              / NULLIF(COUNT(DISTINCT s.student_id), 0), 2)               AS placement_rate_pct,
        ROUND(AVG(p.ctc_fixed + p.ctc_variable), 2)                      AS avg_ctc_lpa,
        ROUND(MAX(p.ctc_fixed + p.ctc_variable), 2)                      AS highest_ctc_lpa,
        ROUND(MIN(p.ctc_fixed + p.ctc_variable), 2)                      AS lowest_ctc_lpa,
        ROUND(AVG(s.cgpa), 2)                                             AS avg_cgpa
    FROM Students s
    LEFT JOIN Placements p ON s.student_id = p.student_id
    WHERE (p_department IS NULL OR s.department = p_department)
    GROUP BY s.department
    ORDER BY placement_rate_pct DESC;
END$$

DELIMITER ;

-- CALL sp_apply_to_job(1, 5, @out); SELECT @out;
-- CALL sp_record_interview_result(3, 82.5, 'Good', 'Strong DSA', 'Weak design', 'Pass', @out); SELECT @out;
-- CALL sp_extend_offer(10, 8.00, 2.00, '2025-07-01', '/offers/s10.pdf', @out); SELECT @out;
-- CALL sp_get_student_profile(1);
-- CALL sp_dept_placement_report(NULL);
-- CALL sp_dept_placement_report('Computer Science and Engineering');


-- ============================================================
-- SECTION 12: TRIGGERS
-- ============================================================

DELIMITER $$

-- TR01. Set is_placed = TRUE when a placement record is inserted
DROP TRIGGER IF EXISTS trg_after_placement_insert$$
CREATE TRIGGER trg_after_placement_insert
AFTER INSERT ON Placements FOR EACH ROW
BEGIN
    UPDATE Students SET is_placed = TRUE WHERE student_id = NEW.student_id;
END$$


-- TR02. Revert is_placed = FALSE if offer is revoked or declined
DROP TRIGGER IF EXISTS trg_after_placement_update$$
CREATE TRIGGER trg_after_placement_update
AFTER UPDATE ON Placements FOR EACH ROW
BEGIN
    IF NEW.offer_status IN ('Revoked','Declined')
       AND OLD.offer_status NOT IN ('Revoked','Declined') THEN
        UPDATE Students SET is_placed = FALSE WHERE student_id = NEW.student_id;
    END IF;
    IF NEW.offer_status = 'Accepted' AND OLD.offer_status != 'Accepted' THEN
        UPDATE Students SET is_placed = TRUE WHERE student_id = NEW.student_id;
        UPDATE Applications SET status = 'Offer_Accepted' WHERE application_id = NEW.application_id;
    END IF;
END$$


-- TR03. Block already-placed students from submitting new applications
DROP TRIGGER IF EXISTS trg_before_application_insert$$
CREATE TRIGGER trg_before_application_insert
BEFORE INSERT ON Applications FOR EACH ROW
BEGIN
    DECLARE v_is_placed BOOLEAN;
    SELECT is_placed INTO v_is_placed FROM Students WHERE student_id = NEW.student_id;
    IF v_is_placed = TRUE THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Student is already placed and cannot apply to new jobs.';
    END IF;
END$$


-- TR04. Auto-set application to Interview_Scheduled when a round is added
DROP TRIGGER IF EXISTS trg_after_interview_round_insert$$
CREATE TRIGGER trg_after_interview_round_insert
AFTER INSERT ON Interview_Rounds FOR EACH ROW
BEGIN
    UPDATE Applications
    SET    status = 'Interview_Scheduled'
    WHERE  application_id = NEW.application_id AND status = 'Shortlisted';
END$$


-- TR05. Sync Placements.offer_status when application status is declined
DROP TRIGGER IF EXISTS trg_after_application_update$$
CREATE TRIGGER trg_after_application_update
AFTER UPDATE ON Applications FOR EACH ROW
BEGIN
    IF NEW.status = 'Offer_Declined' AND OLD.status != 'Offer_Declined' THEN
        UPDATE Placements SET offer_status = 'Declined' WHERE application_id = NEW.application_id;
    END IF;
END$$

DELIMITER ;

-- SHOW TRIGGERS FROM placement_db;


-- ============================================================
-- SECTION 13: CURSORS
-- ============================================================

DELIMITER $$

-- CU01. Iterate each department and build a placement summary report
DROP PROCEDURE IF EXISTS cur_dept_placement_summary$$
CREATE PROCEDURE cur_dept_placement_summary()
BEGIN
    DECLARE v_done    INT DEFAULT FALSE;
    DECLARE v_dept    VARCHAR(100);
    DECLARE v_total   INT;
    DECLARE v_placed  INT;
    DECLARE v_avg_ctc DECIMAL(10,2);
    DECLARE v_rate    DECIMAL(5,2);

    DECLARE dept_cursor CURSOR FOR
        SELECT DISTINCT department FROM Students ORDER BY department;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;

    DROP TEMPORARY TABLE IF EXISTS tmp_dept_report;
    CREATE TEMPORARY TABLE tmp_dept_report (
        department        VARCHAR(100),
        total_students    INT,
        placed_students   INT,
        unplaced_students INT,
        placement_rate    DECIMAL(5,2),
        avg_ctc_lpa       DECIMAL(10,2)
    );

    OPEN dept_cursor;
    dept_loop: LOOP
        FETCH dept_cursor INTO v_dept;
        IF v_done THEN LEAVE dept_loop; END IF;

        SELECT COUNT(*) INTO v_total FROM Students WHERE department = v_dept;

        SELECT COUNT(*) INTO v_placed
        FROM Students s
        INNER JOIN Placements p ON s.student_id = p.student_id
        WHERE s.department = v_dept AND p.offer_status IN ('Extended','Accepted');

        SELECT COALESCE(ROUND(AVG(p.ctc_fixed + p.ctc_variable), 2), 0) INTO v_avg_ctc
        FROM Students s
        INNER JOIN Placements p ON s.student_id = p.student_id
        WHERE s.department = v_dept;

        SET v_rate = ROUND(v_placed * 100.0 / NULLIF(v_total, 0), 2);

        INSERT INTO tmp_dept_report
        VALUES (v_dept, v_total, v_placed, v_total - v_placed, v_rate, v_avg_ctc);
    END LOOP;
    CLOSE dept_cursor;

    SELECT * FROM tmp_dept_report ORDER BY placement_rate DESC;
    DROP TEMPORARY TABLE IF EXISTS tmp_dept_report;
END$$


-- CU02. Identify unplaced students with 3+ applications and assign risk level
DROP PROCEDURE IF EXISTS cur_flag_at_risk_students$$
CREATE PROCEDURE cur_flag_at_risk_students()
BEGIN
    DECLARE v_done            INT DEFAULT FALSE;
    DECLARE v_student_id      INT;
    DECLARE v_full_name       VARCHAR(100);
    DECLARE v_dept            VARCHAR(100);
    DECLARE v_cgpa            DECIMAL(4,2);
    DECLARE v_app_count       INT;
    DECLARE v_rejection_count INT;

    DECLARE at_risk_cursor CURSOR FOR
        SELECT s.student_id, s.full_name, s.department, s.cgpa,
               COUNT(a.application_id) AS app_count
        FROM Students s
        INNER JOIN Applications a ON s.student_id = a.student_id
        WHERE s.is_placed = FALSE
        GROUP BY s.student_id, s.full_name, s.department, s.cgpa
        HAVING COUNT(a.application_id) >= 3
        ORDER BY app_count DESC;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;

    DROP TEMPORARY TABLE IF EXISTS tmp_at_risk;
    CREATE TEMPORARY TABLE tmp_at_risk (
        student_id     INT, full_name VARCHAR(100), department VARCHAR(100),
        cgpa           DECIMAL(4,2), total_applied INT, total_rejected INT,
        rejection_rate DECIMAL(5,2), risk_level VARCHAR(20)
    );

    OPEN at_risk_cursor;
    risk_loop: LOOP
        FETCH at_risk_cursor INTO v_student_id, v_full_name, v_dept, v_cgpa, v_app_count;
        IF v_done THEN LEAVE risk_loop; END IF;

        SELECT COUNT(*) INTO v_rejection_count
        FROM Applications WHERE student_id = v_student_id AND status = 'Rejected';

        INSERT INTO tmp_at_risk VALUES (
            v_student_id, v_full_name, v_dept, v_cgpa,
            v_app_count, v_rejection_count,
            ROUND(v_rejection_count * 100.0 / NULLIF(v_app_count, 0), 2),
            CASE
                WHEN v_rejection_count = v_app_count        THEN 'High'
                WHEN v_rejection_count >= v_app_count * 0.6 THEN 'Medium'
                ELSE 'Low'
            END
        );
    END LOOP;
    CLOSE at_risk_cursor;

    SELECT * FROM tmp_at_risk ORDER BY risk_level, rejection_rate DESC;
    DROP TEMPORARY TABLE IF EXISTS tmp_at_risk;
END$$


-- CU03. Bulk shortlist Applied candidates for a job above a CGPA threshold
DROP PROCEDURE IF EXISTS cur_bulk_shortlist$$
CREATE PROCEDURE cur_bulk_shortlist(
    IN  p_job_id      INT,
    IN  p_min_cgpa    DECIMAL(4,2),
    OUT p_shortlisted INT,
    OUT p_skipped     INT
)
BEGIN
    DECLARE v_done         INT DEFAULT FALSE;
    DECLARE v_app_id       INT;
    DECLARE v_student_id   INT;
    DECLARE v_student_cgpa DECIMAL(4,2);
    DECLARE v_count_sl     INT DEFAULT 0;
    DECLARE v_count_sk     INT DEFAULT 0;

    DECLARE shortlist_cursor CURSOR FOR
        SELECT a.application_id, a.student_id, s.cgpa
        FROM Applications a
        INNER JOIN Students s ON a.student_id = s.student_id
        WHERE a.job_id = p_job_id AND a.status = 'Applied'
        ORDER BY s.cgpa DESC;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;

    OPEN shortlist_cursor;
    sl_loop: LOOP
        FETCH shortlist_cursor INTO v_app_id, v_student_id, v_student_cgpa;
        IF v_done THEN LEAVE sl_loop; END IF;

        IF v_student_cgpa >= p_min_cgpa THEN
            UPDATE Applications SET status = 'Shortlisted' WHERE application_id = v_app_id;
            SET v_count_sl = v_count_sl + 1;
        ELSE
            SET v_count_sk = v_count_sk + 1;
        END IF;
    END LOOP;
    CLOSE shortlist_cursor;

    SET p_shortlisted = v_count_sl;
    SET p_skipped     = v_count_sk;
END$$

DELIMITER ;

-- CALL cur_dept_placement_summary();
-- CALL cur_flag_at_risk_students();
-- CALL cur_bulk_shortlist(1, 7.5, @shortlisted, @skipped);
-- SELECT @shortlisted AS shortlisted, @skipped AS skipped;

-- ============================================================
-- END OF FILE
-- ============================================================