import pdfplumber

pdf_path = r"C:\Users\Administrator\.gemini\antigravity\brain\b5e1f511-781f-46cb-bb10-060f2a9e6646\.user_uploaded\uploaded_media_1791175017165.pdf"

with pdfplumber.open(pdf_path) as pdf:
    # Page 56 is index 55
    page = pdf.pages[55]
    print(f"Page dimensions: width={page.width}, height={page.height}")
    
    # Try extract_tables
    tables = page.extract_tables()
    print(f"Tables found: {len(tables)}")
    if tables:
        for r_idx, row in enumerate(tables[0]):
            print(f"Row {r_idx}: {row}")
    else:
        # inspect words
        words = page.extract_words()
        print(f"Words count: {len(words)}")
