import mysql.connector
import bcrypt

try:
    conn = mysql.connector.connect(host='localhost', port=3306, user='root', password='spartan15#$$', database='placement_db')
    cursor = conn.cursor(dictionary=True)
    
    # Hash a stronger password that won't trigger Chrome alerts
    new_password = "Placement@2026!"
    pw_hash = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode()
    
    # Update the passwords for both test accounts
    cursor.execute('UPDATE Users SET password_hash=%s WHERE username IN (%s, %s)', (pw_hash, 'student1', 'techcorp'))
    
    conn.commit()
    cursor.close()
    conn.close()
    print("Successfully updated passwords to:", new_password)
except Exception as e:
    print('Error:', e)
