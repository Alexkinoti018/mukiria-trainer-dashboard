import json
import re

with open("scripts/raw_timetable_pages.json", "r", encoding="utf-8") as f:
    pages = json.load(f)

# Days of week and periods
DAYS = ["Mo", "Tu", "We", "Th", "Fr"]
PERIODS = ["1", "TEA BREAK", "2", "LUNCH HR", "3", "SHORT BREAK", "4"]

all_classes = set()
all_units = set()
teacher_assignments = []

# Class patterns in MTTI
# Examples:
# ICT4/ITECH6/S/26 MOD 1
# ITECH6/J/26 MOD 3
# ITECH5/S/26 MOD1
# ITECH5/S/25 MOD 4
# ITECH5/6/M/26/ICT4/M/26
# ITECH6/S/24/J/M/25MOD IV
# FBS5/6/J/26
# FBS5/S/26
# FBP4/M/26
# FBP5/S/25
# FBP6/S/26
# LS5/6/S/26
# LS5/6/M/26
# LS6/S/25
# CE6/M/26
# CE6/S/26
# CE6/M/25
# CE6/J/26
# CE6/J/S/25
# BTECH5/6/J/S/25
# BTECH6/M/25
# BTECH6/M/24
# BTECH6/S/24
# MSN4/M/26/BTECH5/6/M/26
# MSN4/S/26/BTECH5/6/S/26
# AT6/M/26
# AT6/J/26
# PL4/5/M/26
# PL4/5/S/26
# PL5/J/26
# PL5/S/25
# EE5/S/25 A
# EE5/S/25 B
# EE5/M/25
# EE6/S/25
# EE6/J/M/25
# EE5/6/M/26
# EE5/6/S/26
# EE5/6/J/26/EL5/J/26
# EI4/S/26
# EI4/M/26
# EL4/5/M/26
# EL4/5/S/26
# EL5/J/26
# DEE/M/25
# IAR5/6/M/26
# IAR5/6/J/S/25
# SW5/6/S/26 MOD 1
# SW6/M/S/25 MOD 4
# SW5/J/26 MOD 3
# BF6/M/26 MOD 2
# BF6/S/26 MOD 1
# BF6/J/26 MOD 3
# BF6/S/24/J/S/25 MOD 4
# BF6/M/25 MOD 5
# PM5/6/J/26 MOD 3
# PM5/6/S/25 MOD 4
# PM5/6/S/26 MOD 1
# ADMIN5/6/J/26 MOD 3
# ADMIN5/6/M/26 MOD 2
# ADMIN4/5/6/S/26 MOD 1
# ADMN5/6/S/24/J/S/25
# COSME4/6/M/26
# COSME4/6/S/26
# COSME5/M/26
# COSME5/S/26
# COSME5/6/J/26
# COSME6/J/M/25
# COSME6/M/S/24/S/25/5/S/24
# AUT4/M/26 MOD I
# AUT4/S/26 MOD I
# AUT5/6/M/26 MOD I
# AUT5/6/S/26 MOD I
# AUT5/J/26 MOD III
# AUT6/J/26 MOD III
# AUT5/S/25 MOD IV
# AUT6/S/25 MOD IV
# AUT6/S/24/J/M/25 MOD V
# WEF4/M/26 MOD I
# WEF4/5/S/26
# WEF5/J/26 MOD III
# WEF5/M/S/25 MOD IV
# FDM6/FDT5/4/S/26 MOD I
# FDM6/5/4/M/26 MOD II
# FDM6/FDT5/J/26 MOD III
# FDM6/FDT5/S/25 MOD IV
# FDM6/M/25 MOD V
# AGRE 5/6/M/26
# AGRE 4/5/6/S/26
# AGRE 5/6/J/26
# AGRE 6/M/25
# AGRE 5/S/25
# AGRE 6/S/24/J/25
# AGRE 6/S/25/5/J/25
# DGA M/25

# Let's inspect each page's raw lines
for p in pages:
    teacher = p["teacher"]
    lines = p["raw_lines"]
    
    # We want to identify the entries in the timetable
    # In each timetable page, lines that are NOT header/footer/breaks are:
    # Class code (often uppercase with / and numbers)
    # Unit/Subject title
    # Room/Venue (e.g. LAB1A, LAB1B, LAB2, LAB3, H1..H18, D1..D8, C2, BCE1..BCE3, MSN/W, CAP/W, FARM, PL/W, E/W, SALON*, etc.)
    
    i = 0
    while i < len(lines):
        line = lines[i]
        if line.startswith("Timetable generated") or line in DAYS or line in PERIODS or line.startswith("Teacher") or "aSc Timetables" in line or re.match(r"^\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}$", line):
            i += 1
            continue
        i += 1

print(f"Loaded pages from {len(pages)} teachers.")
