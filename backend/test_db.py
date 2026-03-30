from db import get_connection

try:
    conn = get_connection()
    conn.close()
    print('SUCCESS! Connected to MySQL.')
except Exception as e:
    print('FAILED:', e)
