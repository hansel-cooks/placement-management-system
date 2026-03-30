import mysql.connector
import bcrypt

try:
    conn = mysql.connector.connect(host='localhost', port=3306, user='root', password='spartan15#$$', database='placement_db')
    cursor = conn.cursor(dictionary=True)
    
    # Get all companies
    cursor.execute("SELECT company_id, company_name FROM Companies")
    companies = cursor.fetchall()
    print(f"Syncing login accounts for {len(companies)} companies...")
    
    # Secure password hash
    password = "Placement@2026!"
    pw_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    
    updated_count = 0
    created_count = 0
    
    for company in companies:
        username = f"company{company['company_id']}"
        
        # Check if user already exists
        cursor.execute("SELECT user_id, role, entity_id FROM Users WHERE username = %s", (username,))
        user_record = cursor.fetchone()
        
        if user_record:
            # Update password for existing user
            cursor.execute("UPDATE Users SET password_hash = %s, role = 'company', entity_id = %s WHERE username = %s",
                           (pw_hash, company['company_id'], username))
            updated_count += 1
        else:
            # Create new user
            cursor.execute("INSERT INTO Users (username, password_hash, role, entity_id) VALUES (%s, %s, %s, %s)",
                           (username, pw_hash, 'company', company['company_id']))
            created_count += 1
            
    conn.commit()
    cursor.close()
    conn.close()
    print(f"Synchronization complete!")
    print(f"Created: {created_count} | Updated: {updated_count}")
    print(f"All company users can now login with password: {password}")
except Exception as e:
    print('Error:', e)
