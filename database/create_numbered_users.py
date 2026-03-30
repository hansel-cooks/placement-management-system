import sys, os
sys.path.insert(0, '../backend')
from dotenv import load_dotenv
load_dotenv('../.env')
import mysql.connector, bcrypt

conn = mysql.connector.connect(
    host='localhost', port=3306, user='root',
    password=os.getenv('DB_PASSWORD', '').split()[0],
    database='placement_db'
)
cur = conn.cursor(dictionary=True)

password = 'Placement@2026!'
pw_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

# Get all students
cur.execute('SELECT student_id, full_name FROM Students ORDER BY student_id')
students = cur.fetchall()

# Get all companies
cur.execute('SELECT company_id, company_name FROM Companies ORDER BY company_id')
companies = cur.fetchall()

# Get existing usernames
cur.execute('SELECT username FROM Users')
existing = {r['username'] for r in cur.fetchall()}

created = []

for i, s in enumerate(students, start=1):
    uname = 'student' + str(i)
    if uname not in existing:
        cur.execute(
            'INSERT INTO Users (username, password_hash, role, entity_id) VALUES (%s, %s, %s, %s)',
            (uname, pw_hash, 'student', s['student_id'])
        )
        created.append(uname + ' -> ' + s['full_name'])

for i, c in enumerate(companies, start=1):
    uname = 'company' + str(i)
    if uname not in existing:
        cur.execute(
            'INSERT INTO Users (username, password_hash, role, entity_id) VALUES (%s, %s, %s, %s)',
            (uname, pw_hash, 'company', c['company_id'])
        )
        created.append(uname + ' -> ' + c['company_name'])

conn.commit()
conn.close()

print('Created ' + str(len(created)) + ' users with password: Placement@2026!')
for line in created:
    print('  ' + line)
