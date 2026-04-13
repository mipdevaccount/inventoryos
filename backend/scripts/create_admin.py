"""
Script to create initial admin user
"""
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from db.database import SessionLocal
from db.models.user import User
from auth.utils import get_password_hash


def create_admin_user():
    """Create initial admin user"""
    print("Creating admin user...")
    
    db = SessionLocal()
    try:
        # Check if admin exists
        existing_admin = db.query(User).filter(User.email == "admin@commander.com").first()
        
        if existing_admin:
            print("⚠ Admin user already exists")
            return
        
        # Read from environment variables to make it secure for Production!
        admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")

        # Create admin user
        admin = User(
            email="admin@commander.com",
            password_hash=get_password_hash(admin_password),
            full_name="System Administrator",
            role="admin",
            is_active=True
        )
        
        db.add(admin)
        db.commit()
        
        print("✓ Admin user created successfully")
        print("  Email: admin@commander.com")
        print(f"  Password: {'[Hidden from logs]' if os.environ.get('ADMIN_PASSWORD') else 'admin123 (Update immediately)'}")
        
    except Exception as e:
        print(f"✗ Error creating admin user: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    create_admin_user()
