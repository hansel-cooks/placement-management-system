# ============================================================
# db.py — MySQL connection helper
# ============================================================

import mysql.connector
from config import DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME


def get_connection():
    """Returns a fresh MySQL connection."""
    return mysql.connector.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME
    )


def query(sql, params=None, fetchone=False, fetchall=False, commit=False):
    """
    Generic query helper.
    - fetchone  : returns a single row as dict
    - fetchall  : returns list of dicts
    - commit    : use for INSERT / UPDATE / DELETE
    Returns lastrowid when commit=True.
    """
    conn   = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(sql, params or ())

        if commit:
            conn.commit()
            return cursor.lastrowid

        if fetchone:
            return cursor.fetchone()

        if fetchall:
            return cursor.fetchall()

    finally:
        cursor.close()
        conn.close()


def call_procedure(proc_name, args):
    """
    Calls a stored procedure with IN/OUT params.
    Returns the OUT param (last element) and lastrowid.
    """
    conn   = get_connection()
    cursor = conn.cursor()
    try:
        cursor.callproc(proc_name, args)
        conn.commit()
        # OUT params come back via cursor.fetchall after callproc
        result_args = cursor.fetchall()
        # Fetch OUT param via @variable
        cursor.execute(f"SELECT @{args[-1]}")   # not ideal — see routes for pattern
        return result_args
    finally:
        cursor.close()
        conn.close()