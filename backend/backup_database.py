#!/usr/bin/env python3
"""
Database backup utility for FoodBridge
Automatically creates timestamped backups of the database
"""

import shutil
import os
from datetime import datetime
from pathlib import Path

def backup_database():
    """Create a timestamped backup of the database"""
    
    # Paths
    backend_dir = Path(__file__).parent
    db_file = backend_dir / "database.db"
    backups_dir = backend_dir / "backups"
    
    # Create backups directory if it doesn't exist
    backups_dir.mkdir(exist_ok=True)
    
    # Generate timestamp for backup filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_filename = f"database_backup_{timestamp}.db"
    backup_path = backups_dir / backup_filename
    
    # Create backup
    if db_file.exists():
        shutil.copy2(db_file, backup_path)
        print(f"✅ Database backed up to: {backup_path}")
        
        # Keep only last 10 backups to save space
        backups = sorted(backups_dir.glob("database_backup_*.db"))
        if len(backups) > 10:
            for old_backup in backups[:-10]:
                old_backup.unlink()
                print(f"🗑️ Removed old backup: {old_backup.name}")
                
        return backup_path
    else:
        print("❌ No database file found to backup")
        return None

def restore_database(backup_path):
    """Restore database from a backup"""
    backend_dir = Path(__file__).parent
    db_file = backend_dir / "database.db"
    
    if Path(backup_path).exists():
        shutil.copy2(backup_path, db_file)
        print(f"✅ Database restored from: {backup_path}")
    else:
        print(f"❌ Backup file not found: {backup_path}")

if __name__ == "__main__":
    backup_database()
