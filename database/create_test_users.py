import mysql.connector
import bcrypt

try:
    conn = mysql.connector.connect(host='localhost', port=3306, user='root', password='spartan15#$$', database='placement_db')
    cursor = conn.cursor(dictionary=True)
    
    # Check if student1 exists in Users
    cursor.execute('SELECT user_id FROM Users WHERE username=%s', ('student1',))
    if not cursor.fetchone():
        # Get first student from Students table to link to
        cursor.execute('SELECT student_id, email, full_name FROM Students LIMIT 1')
        student = cursor.fetchone()
        
        if student:
            pw_hash = bcrypt.hashpw('password123'.encode(), bcrypt.gensalt()).decode()
            cursor.execute('INSERT INTO Users (username, password_hash, role, entity_id) VALUES (%s, %s, %s, %s)',
                           ('student1', pw_hash, 'student', student['student_id']))
            print(f"Created student login -> Username: student1 | Password: password123 | linked to: {student['full_name']}")
    
    # Check if recruiter exists in Users
    cursor.execute('SELECT user_id FROM Users WHERE username=%s', ('techcorp',))
    if not cursor.fetchone():
        # Get first company
        cursor.execute('SELECT company_id, company_name FROM Companies LIMIT 1')
        company = cursor.fetchone()
        
        if company:
            pw_hash = bcrypt.hashpw('password123'.encode(), bcrypt.gensalt()).decode()
            cursor.execute('INSERT INTO Users (username, password_hash, role, entity_id) VALUES (%s, %s, %s, %s)',
                           ('techcorp', pw_hash, 'company', company['company_id']))
            print(f"Created company login -> Username: techcorp | Password: password123 | linked to: {company['company_name']}")

    conn.commit()
    cursor.close()
    conn.close()
except Exception as e:
    print('Error:', e)
