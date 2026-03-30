# Database schema (MySQL)

Baseline schema is implemented in `database/schema.sql` and seeded with realistic data.

## Core entities (11-table baseline)

- **Users**
  - Auth table for `student | company | admin`
  - `entity_id` points to `Students.student_id` or `Companies.company_id` depending on role
- **Students**
  - Profile, eligibility, resume link, placement flag (`is_placed`)
- **Companies**
  - Recruiter profile + approval flag (`is_approved`)
- **Job_Postings**
  - Job details + approval flag (`is_approved`) + eligibility rules (CGPA, departments, grad years)
- **Skills**
  - Skill catalog
- **Skill_Mappings**
  - Polymorphic link for skills to `Student` and `Job` (`entity_type`, `entity_id`)
- **Student_Projects**
- **Internships**
- **Applications**
  - Status-driven lifecycle for student job applications
- **Interview_Rounds**
  - Multi-round scheduling per application
- **Interview_Results**
  - Evaluation per round
- **Placements**
  - Offer/placement outcome per student (unique per student)

## Status systems

### Applications.status

Used for student/company pipeline tracking and KPIs.

Common values in code:
- `Applied`
- `Shortlisted`
- `Interview_Scheduled`
- `Selected`
- `Rejected`
- `Offer_Accepted`
- `Offer_Declined`

### Interview_Rounds.status

Round-level tracking (scheduled/completed/etc.)

### Placements.offer_status

- `Extended`
- `Accepted`
- `Declined`
- `Revoked`

## Notes

- The database includes stored procedures in `database/queries.sql` for interview results and offers.
- Backend logic uses raw SQL (`mysql-connector-python`) in `backend/db.py`.

