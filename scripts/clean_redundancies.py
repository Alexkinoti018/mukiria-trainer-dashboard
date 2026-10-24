"""
Mukiria Trainer Dashboard - Redundancy Cleanup Script (Polished & Non-Destructive)
Safely removes orphaned root test files while preserving core application code.
Supports an optional dry-run mode to preview removals before executing.
"""

import os
import sys

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Define the exact list of orphaned test and scratch artifacts to clean up
FILES_TO_REMOVE = [
    "test_4col.docx",
    "test_4col.py",
    "test_5col.docx",
    "test_5col.py",
    "test_exam.docx",
    "test_learning_plan.docx",
    "test_perfect.py",
    "test_practical_exam.docx",
    os.path.join("scripts", "raw_timetable_pages.json"),
    os.path.join("scripts", "extracted_classes_units.json")
]

def clean_redundancies(dry_run=False):
    # Assumes this script is located inside the 'scripts/' directory
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    removed_count = 0
    not_found_count = 0

    print("=" * 65)
    print(f"MTTI REPOSITORY CLEANUP: REMOVING ROOT ARTIFACTS {'[DRY RUN MODE]' if dry_run else ''}")
    print("=" * 65)

    for rel_path in FILES_TO_REMOVE:
        full_path = os.path.join(base_dir, rel_path)
        
        if os.path.exists(full_path):
            try:
                if dry_run:
                    print(f"[DRY-RUN] Would remove: {rel_path}")
                else:
                    os.remove(full_path)
                    print(f"[OK] Removed: {rel_path}")
                removed_count += 1
            except Exception as e:
                print(f"[!] Error handling {rel_path}: {e}")
        else:
            print(f"[-] Not found (already clean): {rel_path}")
            not_found_count += 1

    action_word = "Would remove" if dry_run else "Removed"
    print(f"\nCleanup complete. {action_word} {removed_count} redundant artifact(s). ({not_found_count} skipped)")
    print("=" * 65)

if __name__ == "__main__":
    # Check if user requested a dry run via command line argument (e.g., python clean_redundancies.py --dry-run)
    is_dry_run = "--dry-run" in sys.argv
    clean_redundancies(dry_run=is_dry_run)
