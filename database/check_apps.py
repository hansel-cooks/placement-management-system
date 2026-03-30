import mysql.connector

try:
    conn = mysql.connector.connect(host='localhost', port=3306, user='root', password='spartan15#$$', database='placement_db')
    cursor = conn.cursor(dictionary=True)
    
    # Check applications for student_id 1
    cursor.execute("""
        SELECT a.application_id, a.status, jp.job_title, c.company_name 
        FROM Applications a 
        JOIN Job_Postings jp ON a.job_id = jp.job_id 
        JOIN Companies c ON jp.company_id = c.company_id 
        WHERE a.student_id = 1
    """)
    rows = cursor.fetchall()
    print(f"Total Applications for student 1: {len(rows)}")
    for row in rows:
        print(row)
        
    cursor.close()
    conn.close()
except Exception as e:
    print('Error:', e)
