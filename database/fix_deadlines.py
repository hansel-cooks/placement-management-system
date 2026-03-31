import mysql.connector
import sys
import os

# Add backend directory to path so we can import config
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))
from config import DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME

def fix_deadlines():
    print("Connecting to database to fix job application deadlines...")
    try:
        conn = mysql.connector.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME
        )
        cursor = conn.cursor()
        
        # Shift all application deadlines by 2 years (from 2024 to 2026)
        update_query = """
        UPDATE Job_Postings 
        SET application_deadline = DATE_ADD(application_deadline, INTERVAL 2 YEAR)
        """
        cursor.execute(update_query)
        conn.commit()
        
        print(f"Success! Updated {cursor.rowcount} job postings. Deadlines are now extended to 2026.")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals() and conn.is_connected():
            conn.close()

if __name__ == "__main__":
    fix_deadlines()
