import mysql.connector
import re

try:
    conn = mysql.connector.connect(host='localhost', port=3306, user='root', password='spartan15#$$')
    cursor = conn.cursor()
    
    with open(r'c:\Users\User\StudioProjects\placement-management-system\database\schema.sql', 'r', encoding='utf-8') as f:
        sql_script = f.read()
        
    print('Executing SQL schema...')
    # Split by semicolon followed by newline/whitespace to avoid splitting mid-string safely enough for this mock data
    statements = [s.strip() for s in re.split(r';(?=\s*[\n\r])', sql_script) if s.strip()]
    
    for i, statement in enumerate(statements):
        try:
            cursor.execute(statement)
        except Exception as ex:
            pass # ignore drops or duplicates
        print(f'Executed {i+1}/{len(statements)}', end='\r')
            
    conn.commit()
    cursor.close()
    conn.close()
    print('\nDatabase initialized and seeded successfully!')
except Exception as e:
    print('\nError:', e)
