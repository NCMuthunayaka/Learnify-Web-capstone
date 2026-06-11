import os
import urllib.parse
from sqlalchemy import create_engine
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def main():
    database_url = os.getenv(
        "DATABASE_URL", "mysql+pymysql://root:@localhost:3306/learnify"
    )

    script_path = os.path.join(os.path.dirname(__file__), "..", "db", "init_schema.sql")
    script_path = os.path.normpath(script_path)

    # Parse URL to separate database name
    parsed = urllib.parse.urlparse(database_url)
    db_name = parsed.path.lstrip('/')
    
    # Reconstruct root URL pointing to 'mysql' system database to drop/create
    root_parsed = parsed._replace(path='/mysql')
    root_url = urllib.parse.urlunparse(root_parsed)

    print(f"Connecting to MySQL server to recreate database '{db_name}'...")
    root_engine = create_engine(root_url)
    root_conn = root_engine.raw_connection()
    try:
        root_cursor = root_conn.cursor()
        root_cursor.execute(f"DROP DATABASE IF EXISTS {db_name}")
        root_cursor.execute(f"CREATE DATABASE {db_name} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
        root_conn.commit()
        print(f"Database '{db_name}' dropped and recreated successfully.")
    except Exception as e:
        print(f"Failed to recreate database: {e}")
        # Continue anyway, in case user has restricted permissions
    finally:
        try:
            root_cursor.close()
        except Exception:
            pass
        try:
            root_conn.close()
        except Exception:
            pass

    engine = create_engine(database_url)

    with open(script_path, "r", encoding="utf-8") as f:
        sql = f.read()

    # Split on semicolons and execute statements individually.
    stmts = [s.strip() for s in sql.split(";") if s.strip()]

    conn = engine.raw_connection()
    try:
        cursor = conn.cursor()
        for stmt in stmts:
            if not stmt:
                continue
            try:
                cursor.execute(stmt)
            except Exception as e:
                # Print statement error and continue
                print(f"Failed statement: {stmt[:100]}... | Error: {e}")
        conn.commit()
        print("Database schema executed successfully.")
    finally:
        try:
            cursor.close()
        except Exception:
            pass
        conn.close()


if __name__ == "__main__":
    main()
