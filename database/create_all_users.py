import mysql.connector
import bcrypt

def create_all_users():
    print("Generating secure password hash for 'Placement@2026!' (this takes a moment)...")
    pw_hash = bcrypt.hashpw('Placement@2026!'.encode(), bcrypt.gensalt()).decode()
    
    try:
        conn = mysql.connector.connect(host='localhost', port=3306, user='root', password='Mysql@20', database='placement_db')
        cursor = conn.cursor(dictionary=True)
        
        # Clear existing student and company logins to start fresh
        print("Cleaning up old student and company login accounts...")
        cursor.execute("DELETE FROM Users WHERE role IN ('student', 'company')")
        
        # 1. PROCESS ALL STUDENTS
        cursor.execute('SELECT student_id, full_name FROM Students ORDER BY student_id')
        students = cursor.fetchall()
        
        print(f"Creating sequential logins for {len(students)} students...")
        for index, student in enumerate(students, start=1):
            username = f"student{index}"
            cursor.execute('''
                INSERT INTO Users (username, password_hash, role, entity_id) 
                VALUES (%s, %s, %s, %s)
            ''', (username, pw_hash, 'student', student['student_id']))
            
        # 2. PROCESS ALL COMPANIES
        cursor.execute('SELECT company_id, company_name FROM Companies ORDER BY company_id')
        companies = cursor.fetchall()
        
        print(f"Creating sequential logins for {len(companies)} companies...")
        for index, company in enumerate(companies, start=1):
            username = f"company{index}"
            cursor.execute('''
                INSERT INTO Users (username, password_hash, role, entity_id) 
                VALUES (%s, %s, %s, %s)
            ''', (username, pw_hash, 'company', company['company_id']))

        conn.commit()
        print(f"\n✅ Success! Bulk generated {len(students)} student accounts and {len(companies)} company accounts.")
        print(f"Example Student: student1  | Password: Placement@2026!")
        print(f"Example Company: company1  | Password: Placement@2026!")

        cursor.close()
        conn.close()
    except Exception as e:
        print('Error:', e)

if __name__ == "__main__":
    create_all_users()
