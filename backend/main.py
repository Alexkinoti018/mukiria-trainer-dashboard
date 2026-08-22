import os
import re
import json
import base64
import io
import docx
import difflib
import docx.shared
from http.server import HTTPServer, BaseHTTPRequestHandler

# Helper: Parse unit level from unit code
def get_level_from_code(code: str) -> int:
    match = re.search(r'/(\d)/', code)
    if match:
        return int(match.group(1))
    parts = code.split("/")
    for p in parts:
        try:
            val = int(p)
            if 3 <= val <= 8:
                return val
        except ValueError:
            continue
    return 6  # Default fallback

# Helper: Rule-based AI exam builder matching CDACC Level rules
def build_cdacc_exam(unit_code: str, course_name: str, level: int, topics: list, outcomes: list):
    title = f"{course_name} — End of Unit Assessment"
    
    questions_a = []
    questions_b = []
    
    import re
    def is_raw_question(text):
        return bool(re.search(r'\(\d+\s*marks?\)', text, re.IGNORECASE) or '?' in text or re.match(r'^\s*(?:[a-zA-Z]\)|\d+\.)', text))
        
    def format_q(text, fallback):
        if is_raw_question(text):
            return text
        return fallback.format(text)

    # Fallback lists to ensure we have enough items
    if not outcomes:
        outcomes = ["Analyze core operational principles", "Implement standard field procedures"]
    if not topics:
        topics = ["Core Principles", "Standard Operations"]
            
    if level in [5, 6]:
        # Section A: exactly 10 questions, each 4 marks (Total = 40)
        for i in range(10):
            outcome = outcomes[i % len(outcomes)]
            q_text = format_q(outcome, "Discuss the critical parameters regarding: '{}'. Explain its structural relevance under CDACC standards.")
            questions_a.append({
                "id": f"q-sa-{i+1}",
                "text": q_text,
                "type": "short_answer",
                "correct_answer": "Grading criteria: Clarity of definition, logical architecture.",
                "marks": 4,
                "critical_aspect": f"Demonstrates comprehensive mastery of {outcome[:20].lower()}..."
            })
            
        # Section B: exactly 4 questions (Choose 3), each 20 marks (Total = 60)
        for i in range(4):
            topic = topics[i % len(topics)]
            if is_raw_question(topic):
                q_text = topic
            else:
                q_text = (
                    f"a) Formulate a complete methodology targeting '{topic}'. (8 Marks)\n"
                    f"b) Outline equipment setup and error margins associated with this process. (6 Marks)\n"
                    f"c) Explain three procedures for managing risks associated with the process. (6 Marks)"
                )
            questions_b.append({
                "id": f"q-ex-{i+1}",
                "text": q_text,
                "type": "short_answer",
                "correct_answer": "Grading rubrics: Methodology (8m), Equipment (6m), Risk Management (6m).",
                "marks": 20,
                "critical_aspect": f"Demonstrated capability for {topic[:20].lower()}..."
            })
            
    elif level == 4:
        # Section A: exactly 5 MCQs, each 2 marks (Total = 10) - Strictly no True/False
        for i in range(5):
            topic = topics[i % len(topics)]
            is_raw = is_raw_question(topic)
            q_text = format_q(topic, "Which of the following describes the standard best practice for managing '{}' under Level 4 guidelines?")
            questions_a.append({
                "id": f"q-mcq-{i+1}",
                "text": q_text,
                "type": "short_answer",
                "correct_answer": 1 if not is_raw else "",
                "marks": 2,
                "critical_aspect": f"Selects standard practices for {topic[:20].lower()}."
            })
            
        # Section B: exactly 3 questions (Choose 2), each 20 marks (Total = 40)
        for i in range(3):
            topic = topics[i % len(topics)]
            if is_raw_question(topic):
                q_text = topic
            else:
                q_text = (
                    f"a) Describe the core requirements for setting up a standardized test case for '{topic}'. (12 Marks)\n"
                    f"b) Explain the validation criteria used to measure success in this process. (8 Marks)"
                )
            questions_b.append({
                "id": f"q-sb-{i+1}",
                "text": q_text,
                "type": "short_answer",
                "correct_answer": "a) Setup requirements (12m). b) Validation criteria (8m).",
                "marks": 20,
                "critical_aspect": f"Formulates test cases for {topic[:20].lower()}."
            })
            
    else:  # Level 3
        # Section A: exactly 5 questions, each 2 marks (Total = 10)
        for i in range(5):
            topic = topics[i % len(topics)]
            is_raw = is_raw_question(topic)
            q_text = format_q(topic, "Explain the baseline element associated with '{}'.")
            questions_a.append({
                "id": f"q-mcq-{i+1}",
                "text": q_text,
                "type": "short_answer",
                "correct_answer": 0 if not is_raw else "",
                "marks": 2,
                "critical_aspect": f"Identifies baseline parameter controls for {topic[:20].lower()}."
            })
            
        # Section B: exactly 3 questions (Choose 2), each 20 marks (Total = 40)
        for i in range(3):
            topic = topics[i % len(topics)]
            if is_raw_question(topic):
                q_text = topic
            else:
                q_text = (
                    f"a) Explain the operational steps to verify and document '{topic}' values. (12 Marks)\n"
                    f"b) Identify four potential risks during this process and how to mitigate them. (8 Marks)"
                )
            questions_b.append({
                "id": f"q-sb-{i+1}",
                "text": q_text,
                "type": "short_answer",
                "correct_answer": "a) Operational steps (12m). b) Risk mitigation (8m).",
                "marks": 20,
                "critical_aspect": f"Verifies values for {topic[:20].lower()}."
            })

    payload = {
        "title": title,
        "duration_minutes": 120 if level in [5, 6] else 90,
        "total_marks": 100 if level in [5, 6] else 50,
        "instructions": "Answer all questions in Section A, and follow instructions in Section B.",
        "section_a": {
            "title": "Section A — Cognitive Theory (CT)",
            "instructions": "Answer all questions in this section.",
            "total_marks": 40 if level in [5, 6] else 10,
            "questions": questions_a
        },
        "section_b": {
            "title": "Section B — Practical Performance (CP)",
            "instructions": "Answer ANY THREE questions in this section." if level in [5, 6] else "Answer ANY TWO questions in this section.",
            "total_marks": 60 if level in [5, 6] else 40,
            "questions": questions_b
        }
    }
    return payload

def build_cdacc_practical(unit_code, course_name, level, topics, outcomes):
    title = f"FORMATIVE PRACTICAL ASSESSMENT"
    
    if not outcomes:
        outcomes = ["Analyze core operational principles", "Implement standard field procedures"]
    if not topics:
        topics = ["Core Principles", "Standard Operations"]
        
    tasks = []
    rubric = []
    
    total_marks = 100 if level in [5, 6] else 60
    
    # Generate 2 tasks
    for i in range(2):
        topic = topics[i % len(topics)]
        outcome = outcomes[i % len(outcomes)]
        
        task_marks = total_marks // 2
        tasks.append({
            "id": f"task-{i+1}",
            "title": f"TASK {i+1}: Practical implementation of {topic}",
            "marks": task_marks,
            "details": [
                f"Preparation: Ensure all tools and software are correctly configured for {topic[:30]}.",
                f"Execution: Demonstrate the ability to {outcome[:50].lower()}.",
                f"Output: Produce a verifiable output meeting industry standards."
            ]
        })
        
        rubric.append({
            "category": f"Execution of Task {i+1}",
            "max_marks": task_marks,
            "criteria": [
                { "description": f"Appropriate setup and tool selection for {topic[:20]}.", "marks": round(task_marks * 0.3) },
                { "description": f"Successful demonstration of {outcome[:30]}.", "marks": round(task_marks * 0.5) },
                { "description": "Quality and compliance of the final output.", "marks": round(task_marks * 0.2) }
            ]
        })
        
    payload = {
        "title": title,
        "type": "practical",
        "duration_minutes": 180,
        "total_marks": total_marks,
        "instructions": "Ensure all required resources for the assessment have been provided before beginning. The assessor will evaluate you dynamically as you perform the tasks.",
        "project_brief": f"In this project, the candidate will demonstrate competence in {course_name} by completing hands-on scenarios based on standard industry requirements.",
        "elements_covered": topics[:4],
        "tasks": tasks,
        "rubric": rubric
    }
    return payload


class APIHandler(BaseHTTPRequestHandler):
    def send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type,Authorization")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()

    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        post_data = self.rfile.read(content_length)
        
        # Determine path
        path = self.path.split("?")[0]
        
        try:
            if path == "/api/parse-doc":
                payload = json.loads(post_data.decode("utf-8"))
                file_base64 = payload.get("file_data")
                context = payload.get("context", "learning_plan")
                role = payload.get("role", "trainer")
                
                if not file_base64:
                    self.send_response(400)
                    self.send_cors_headers()
                    self.end_headers()
                    self.wfile.write(json.dumps({"error": "No file data"}).encode("utf-8"))
                    return

                # Decode file bytes
                file_bytes = base64.b64decode(file_base64)
                
                # If this is a trainee uploading an assignment, bypass the CDACC curriculum parsing
                if context == "trainee_assignment":
                    self.send_response(200)
                    self.send_cors_headers()
                    self.end_headers()
                    self.wfile.write(json.dumps({
                        "message": "Assignment uploaded successfully",
                        "status": "success",
                        "grade_status": "pending"
                    }).encode("utf-8"))
                    return

                # Determine file type
                filename = payload.get("filename", "").lower()
                
                full_text = []
                if filename.endswith(".pdf") or payload.get("content_type") == "application/pdf":
                    import pdfplumber
                    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                        for page in pdf.pages:
                            extracted = page.extract_text()
                            if extracted:
                                full_text.append(extracted)
                            # Extract tables
                            tables = page.extract_tables()
                            for table in tables:
                                for row in table:
                                    row_cells = [str(cell).strip() for cell in row if cell]
                                    if row_cells:
                                        full_text.append(" | ".join(row_cells))
                else:
                    # Default to docx
                    doc = docx.Document(io.BytesIO(file_bytes))
                    for p in doc.paragraphs:
                        if p.text.strip():
                            full_text.append(p.text.strip())
                            
                    for table in doc.tables:
                        for row in table.rows:
                            row_cells = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                            if row_cells:
                                full_text.append(" | ".join(row_cells))
                                
                combined_text = "\n".join(full_text)
                
                # Resilient CDACC Unit Code finder
                unit_code = None
                course_name = ""
                unit_name = ""
                
                # Extract Course Name and Unit Name
                course_name_match = re.search(r'(?:Course Name|Course|Programme):\s*(.*)', combined_text, re.IGNORECASE)
                if course_name_match:
                    course_name = course_name_match.group(1).strip()
                    
                unit_name_match = re.search(r'(?:Unit Name|Module Name|Subject):\s*(.*)', combined_text, re.IGNORECASE)
                if unit_name_match:
                    unit_name = unit_name_match.group(1).strip()
                
                # 1. Look for explicit unit keyword
                unit_match = re.search(r'(?:Unit Code|Unit Code of Competency|Module Code|Code):\s*([A-Z0-9/\-]+)', combined_text, re.IGNORECASE)
                if unit_match:
                    unit_code = unit_match.group(1).strip()
                else:
                    # 2. Search standard CDACCSurveys formats: (e.g. CON/OS/SUR/CR/01/6/A or SUR/OS/SUR/CR/01/6)
                    cdacc_match = re.search(r'\b([A-Z0-9]{2,6}/OS/[A-Z0-9]{2,6}/[A-Z0-9]{2,6}/\d{2}/\d(?:/[A-Z0-9])?)\b', combined_text, re.IGNORECASE)
                    if cdacc_match:
                        unit_code = cdacc_match.group(1).strip()
                    else:
                        # 3. Match any slash separated string containing level digit
                        general_match = re.search(r'\b([A-Z0-9]{2,6}/[A-Z0-9]{2,6}/[A-Z0-9]{2,6}/\d)\b', combined_text, re.IGNORECASE)
                        if general_match:
                            unit_code = general_match.group(1).strip()
                
                if not unit_code:
                    unit_code = "CON/OS/SUR/CR/01/6"  # Default to land survey if failed to parse

                # Trainer & Class & Series extraction
                trainer_match = re.search(r'(?:Trainer|Name|Instructor|Author):\s*(.*)', combined_text, re.IGNORECASE)
                class_match = re.search(r'(?:Class Code|Class):\s*(.*)', combined_text, re.IGNORECASE)
                series_match = re.search(r'(?:Series|Term|Semester):\s*(.*)', combined_text, re.IGNORECASE)
                
                trainer = trainer_match.group(1).strip() if trainer_match else "MR. ALEXANDER KINOTI"
                class_code = class_match.group(1).strip() if class_match else ""
                series = series_match.group(1).strip() if series_match else ""
                
                # Parse outcomes & topics
                topic_match = re.findall(r'(?:Topic|Lesson|Session Title|Module):\s*(.*)', combined_text, re.IGNORECASE)
                outcomes_match = re.findall(r'(?:Outcome|Objective|Trainee should be able to|LO|Element):\s*(.*)', combined_text, re.IGNORECASE)
                
                outcomes = [o.strip() for o in outcomes_match if o.strip()]
                if not outcomes:
                    # Look for performance criteria elements
                    outcomes = [line.strip() for line in full_text if ("element" in line.lower() or "outcome" in line.lower()) and len(line.strip()) < 200]
                    
                if not outcomes:
                    outcomes = [
                        "Perform topographical surveys and map physical configurations accurately",
                        "Configure geodetic measurement reference systems and verify coordinate grids",
                        "Generate standard cadastre documents and align surveying instruments correctly"
                    ]
                    
                topics = [t.strip() for t in topic_match if t.strip()]
                if not topics:
                    topics = ["Topographical Surveying", "Geodetic reference system", "Cadastre Alignment"]
                    
                level = get_level_from_code(unit_code)
                
                # Warnings: quiet warnings for Trainer and Class Code since syllabus/OS don't contain them
                warnings = []
                if not unit_match and unit_code == "CON/OS/SUR/CR/01/6":
                    warnings.append("Defaulting Unit Code to standard Land Survey Level 6.")

                response_data = {
                    "success": True,
                    "trainer": trainer,
                    "unit_code": unit_code,
                    "course_name": course_name,
                    "unit_name": unit_name,
                    "class_code": class_code,
                    "series": series,
                    "level": level,
                    "topics": topics,
                    "outcomes": outcomes,
                    "warnings": warnings
                }
                
                self.send_response(200)
                self.send_cors_headers()
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps(response_data).encode("utf-8"))
                
            elif path == "/api/generate-exam":
                payload = json.loads(post_data.decode("utf-8"))
                unit_code = payload.get("unit_code", "ICT/OS/CS/CR/11/6/A")
                course_name = payload.get("course_name", "Software Engineering Fundamentals")
                level = payload.get("level")
                
                if level is None:
                    level = get_level_from_code(unit_code)
                    
                topics = payload.get("topics", [])
                outcomes = payload.get("outcomes", [])
                is_practical = payload.get("is_practical", False)
                
                if is_practical:
                    exam_payload = build_cdacc_practical(unit_code, course_name, level, topics, outcomes)
                else:
                    exam_payload = build_cdacc_exam(unit_code, course_name, level, topics, outcomes)
                
                response_data = {
                    "success": True,
                    "unit_code": unit_code,
                    "course_name": course_name,
                    "payload": exam_payload
                }
                
                self.send_response(200)
                self.send_cors_headers()
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps(response_data).encode("utf-8"))

            elif path == "/api/complete-session":
                payload = json.loads(post_data.decode("utf-8"))
                session_plan_id = payload.get("session_plan_id")
                unit_code = payload.get("unit_code", "COMP-204")
                week_number = payload.get("week_number", 1)
                
                row_draft = {
                    "session_plan_id": session_plan_id,
                    "date_delivered": "2026-07-07",
                    "work_actually_covered": f"Delivered learning outcomes matching week {week_number} syllabus plan.",
                    "trainees_present": 42,
                    "signature": "Alexander Kinoti",
                    "status": "unsigned"
                }
                
                formative_questions = [
                    {
                        "id": "fq-1",
                        "text": f"Define the core operating workflow configured for week {week_number} units.",
                        "type": "short_answer",
                        "marks": 5
                    },
                    {
                        "id": "fq-2",
                        "text": f"Explain why redundancy elimination is vital during database schema creation.",
                        "type": "short_answer",
                        "marks": 5
                    }
                ]
                
                response_data = {
                    "success": True,
                    "record_of_work_draft": row_draft,
                    "formative_assessment_draft": {
                        "title": f"Formative Quiz — Week {week_number} ({unit_code})",
                        "questions": formative_questions
                    },
                    "timestamp": "2026-07-07T23:55:00Z"
                }
                
                self.send_response(200)
                self.send_cors_headers()
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps(response_data).encode("utf-8"))
            elif path == "/api/auto-grade":
                payload = json.loads(post_data.decode("utf-8"))
                student_answer = payload.get("student_answer", "")
                correct_answer = payload.get("correct_answer", "")
                max_marks = float(payload.get("marks", 0))
                question_type = payload.get("question_type", "short_answer")
                
                # Basic NLP Heuristic: Token similarity
                def tokenize(text):
                    text = re.sub(r'[^\w\s]', '', text.lower())
                    return set(text.split())
                
                student_tokens = tokenize(student_answer)
                correct_tokens = tokenize(correct_answer)
                
                if not correct_tokens:
                    # Fallback if no correct answer provided
                    auto_score = max_marks * 0.5
                    reasoning = "No reference rubric provided. Defaulted to 50% for manual review."
                    confidence = 0.3
                else:
                    overlap = student_tokens.intersection(correct_tokens)
                    recall = len(overlap) / len(correct_tokens)
                    
                    # Fuzzy match using difflib for overall semantic structure
                    seq_match = difflib.SequenceMatcher(None, student_answer.lower(), correct_answer.lower()).ratio()
                    
                    # Weighted score: 70% keyword recall, 30% structural match
                    final_ratio = (recall * 0.7) + (seq_match * 0.3)
                    
                    # Ensure score isn't overly punitive for short answers
                    if len(student_tokens) > len(correct_tokens) * 0.5 and final_ratio < 0.4:
                        final_ratio += 0.2
                    
                    final_ratio = min(final_ratio, 1.0)
                    auto_score = round(max_marks * final_ratio, 1)
                    confidence = round(0.5 + (final_ratio * 0.4), 2)
                    
                    if final_ratio > 0.8:
                        reasoning = f"High semantic overlap ({round(final_ratio*100)}%). Student demonstrated mastery of core concepts."
                    elif final_ratio > 0.5:
                        missing = correct_tokens - student_tokens
                        missing_sample = ", ".join(list(missing)[:3])
                        reasoning = f"Partial mastery ({round(final_ratio*100)}%). Missing key concepts like: {missing_sample}."
                    else:
                        reasoning = f"Low relevance ({round(final_ratio*100)}%). Answer does not align with expected rubric."
                
                response_data = {
                    "score": auto_score,
                    "reasoning": reasoning,
                    "confidence": confidence
                }
                
                self.send_response(200)
                self.send_cors_headers()
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps(response_data).encode("utf-8"))

            elif path == "/api/export-docx":
                payload = json.loads(post_data.decode("utf-8"))
                unit_code = payload.get("unit_code", "COMP-204")
                course_name = payload.get("course_name", "Software Engineering")
                unit_name = payload.get("unit_name", "")
                class_code = payload.get("class_code", "")
                series = payload.get("series", "")
                exam = payload.get("payload", {})
                level = get_level_from_code(unit_code)
                
                meta_course_name = course_name.upper() if course_name else "ICT TECHNICIAN LEVEL 6"
                meta_course_code = unit_code.upper() if unit_code else "061006T91CT"
                meta_unit_name = unit_name.upper() if unit_name else course_name.upper()
                meta_unit_code = unit_code.upper() if unit_code else "ICT/OS/ENV/CR/01/6"
                meta_class = class_code.upper() if class_code else "ITECH6/M/24"
                meta_series = series if series else "Jan./April 2026"
                
                # Resilient matching for unit specifics (legacy fallback removed to prioritize user inputs)
                
                # Add Brand Logo if exists
                current_dir = os.path.dirname(os.path.abspath(__file__))
                project_root = os.path.dirname(current_dir)
                logo_path = os.path.join(project_root, "client", "public", "mtti-logo.jpg")
                
                doc = docx.Document()
                style = doc.styles['Normal']
                style.font.name = 'Maiandra GD'
                
                if os.path.exists(logo_path):
                    p_logo = doc.add_paragraph()
                    p_logo.alignment = 1 # Center
                    p_logo.add_run().add_picture(logo_path, width=docx.shared.Inches(1.2))
                
                # Center aligned brand headers
                p = doc.add_paragraph()
                p.alignment = 1 # Center
                p.paragraph_format.space_after = docx.shared.Pt(0)
                
                r = p.add_run("MUKIRIA TECHNICAL TRAINING INSTITUTE\n")
                r.bold = True
                r.font.size = docx.shared.Pt(14)
                
                r2 = p.add_run("\nCOMPUTING AND INFORMATICS DEPARTMENT\n")
                r2.bold = True
                r2.font.name = "Maiandra GD"
                r2.font.size = docx.shared.Pt(12)
                
                is_practical = "practical" in exam.get("title", "").lower()
                assessment_title = "WRITTEN ASSESSMENT I"
                if is_practical:
                    assessment_title = "FORMATIVE PRACTICAL ASSESSMENT I"
                elif "ii" in exam.get("title", "").lower() or "2" in exam.get("title", "").lower():
                    assessment_title = "WRITTEN ASSESSMENT II"
                elif "iii" in exam.get("title", "").lower() or "3" in exam.get("title", "").lower():
                    assessment_title = "WRITTEN ASSESSMENT III"
                    
                r3 = p.add_run(f"{assessment_title}\n")
                r3.bold = True
                r3.font.name = "Maiandra GD"
                r3.font.size = docx.shared.Pt(12)
                
                r4 = p.add_run(f"TIME: {exam.get('duration_minutes', 120) // 60} HOURS\n\n")
                r4.bold = True
                r4.font.size = docx.shared.Pt(11)
                
                # Left aligned metadata fields
                p_meta = doc.add_paragraph()
                p_meta.paragraph_format.line_spacing = 1.0
                p_meta.paragraph_format.space_after = docx.shared.Pt(0)
                
                fields = [
                    ("COURSE NAME", meta_course_name),
                    ("COURSE CODE", meta_course_code),
                    ("UNIT NAME", meta_unit_name),
                    ("UNIT CODE", meta_unit_code),
                    ("CLASS", meta_class),
                    ("SERIES", meta_series)
                ]
                
                for key, val in fields:
                    r_key = p_meta.add_run(f"{key}: ")
                    r_key.bold = True
                    p_meta.add_run(f"{val}\n")
                    
                # Instructions to candidate
                p_inst_hdr = doc.add_paragraph()
                p_inst_hdr.paragraph_format.space_before = docx.shared.Pt(12)
                r_inst_hdr = p_inst_hdr.add_run("INSTRUCTIONS TO THE CANDIDATE:")
                r_inst_hdr.bold = True
                r_inst_hdr.font.size = docx.shared.Pt(11)
                
                instructions = [
                    "Write your NAME, ADM, CLASS and DATE on the answer booklet provided",
                    "Answer all questions in section A",
                    f"Answer ANY three questions in section B" if level in [5, 6] else "Answer all questions in Section A and follow instructions in Section B."
                ]
                for inst in instructions:
                    p_inst = doc.add_paragraph(style='List Bullet')
                    p_inst.paragraph_format.space_after = docx.shared.Pt(0)
                    r_inst = p_inst.add_run(inst)
                is_practical = exam.get("type") == "practical" or "practical" in exam.get("title", "").lower()
                
                if is_practical:
                    # Render Practical Assessment Format
                    # Project Brief
                    p_brief = doc.add_paragraph()
                    r_brief_hdr = p_brief.add_run("PROJECT BRIEF\n")
                    r_brief_hdr.bold = True
                    p_brief.add_run(exam.get("project_brief", ""))
                    
                    # Elements Covered
                    p_elements = doc.add_paragraph()
                    r_elem_hdr = p_elements.add_run("Elements Covered:\n")
                    r_elem_hdr.bold = True
                    for elem in exam.get("elements_covered", []):
                        p_elem = doc.add_paragraph(style='List Bullet')
                        p_elem.add_run(elem)
                        
                    # Tasks
                    for task in exam.get("tasks", []):
                        p_task = doc.add_paragraph()
                        r_task_hdr = p_task.add_run(f"{task.get('title')} ({task.get('marks')} Marks)\n")
                        r_task_hdr.bold = True
                        for detail in task.get("details", []):
                            p_detail = doc.add_paragraph(style='List Bullet')
                            p_detail.add_run(detail)
                            
                    # Rubrics
                    for r_idx, rubric_cat in enumerate(exam.get("rubric", [])):
                        p_rubric = doc.add_paragraph()
                        p_rubric.paragraph_format.space_before = docx.shared.Pt(12)
                        
                        table = doc.add_table(rows=1, cols=4)
                        table.style = 'Table Grid'
                        
                        hdr_cells = table.rows[0].cells
                        hdr_cells[0].text = 'No.'
                        hdr_cells[1].text = 'Items to be Evaluated: Kindly award marks as appropriate.'
                        hdr_cells[2].text = 'Max Marks'
                        hdr_cells[3].text = 'Awarded'
                        
                        # Style headers
                        for cell in hdr_cells:
                            for p_cell in cell.paragraphs:
                                p_cell.alignment = 1
                                for run in p_cell.runs:
                                    run.bold = True
                                    run.font.name = "Maiandra GD"
                                    
                        # Add criteria rows
                        for c_idx, criteria in enumerate(rubric_cat.get("criteria", [])):
                            row_cells = table.add_row().cells
                            row_cells[0].text = str(r_idx + 1) + chr(97 + c_idx)
                            row_cells[1].text = criteria.get("description", "")
                            row_cells[2].text = str(criteria.get("marks", 0))
                            row_cells[3].text = ""
                            
                            # Style rows
                            for cell in row_cells:
                                for p_cell in cell.paragraphs:
                                    for run in p_cell.runs:
                                        run.font.name = "Maiandra GD"
                else:
                    # Render Written Assessment Format
                    # Section A
                    sec_a = exam.get("section_a", {})
                    p_sec_a_hdr = doc.add_paragraph()
                    p_sec_a_hdr.paragraph_format.space_before = docx.shared.Pt(12)
                    r_sec_a_hdr = p_sec_a_hdr.add_run(f"SECTION A: ({sec_a.get('total_marks', 40)} MARKS)")
                    r_sec_a_hdr.bold = True
                    r_sec_a_hdr.font.size = docx.shared.Pt(11)
                    
                    for idx, q in enumerate(sec_a.get("questions", [])):
                        p_q = doc.add_paragraph()
                        r_q_num = p_q.add_run(f"{idx+1}. ")
                        r_q_num.bold = True
                        
                        r_q_text = p_q.add_run(f"{q.get('text', '')} ")
                        
                        r_q_marks = p_q.add_run(f"({q.get('marks', 0)} Marks)")
                        r_q_marks.bold = True
                        
                        # Options rendering removed as requested
                                
                    # Section B
                    sec_b = exam.get("section_b", {})
                    p_sec_b_hdr = doc.add_paragraph()
                    p_sec_b_hdr.paragraph_format.space_before = docx.shared.Pt(12)
                    sec_b_title = "SECTION TWO" if level in [5, 6] else "SECTION B"
                    r_sec_b_hdr = p_sec_b_hdr.add_run(f"{sec_b_title} ({sec_b.get('total_marks', 60)} MARKS)")
                    r_sec_b_hdr.bold = True
                    r_sec_b_hdr.font.size = docx.shared.Pt(11)
                    
                    p_sec_b_inst = doc.add_paragraph()
                    r_sec_b_inst = p_sec_b_inst.add_run(sec_b.get("instructions", "Answer subjective items as guided."))
                    r_sec_b_inst.italic = True
                    
                    for idx, q in enumerate(sec_b.get("questions", [])):
                        p_q = doc.add_paragraph()
                        # Number starts after section A questions (11 or 6)
                        sec_a_len = len(sec_a.get("questions", []))
                        r_q_num = p_q.add_run(f"{idx + sec_a_len + 1}. ")
                        r_q_num.bold = True
                        
                        # Note: In main.py build_cdacc_exam, we already formatted a, b, c inside text!
                        # We just need to split it by new lines to render cleanly
                        q_parts = q.get('text', '').split('\n')
                        for part_idx, part in enumerate(q_parts):
                            if part_idx == 0:
                                p_q.add_run(f"{part} ")
                            else:
                                p_sub = doc.add_paragraph()
                                p_sub.paragraph_format.left_indent = docx.shared.Inches(0.5)
                                p_sub.add_run(part)
                                
                        r_q_marks = p_q.add_run(f"({q.get('marks', 0)} Marks)")
                        r_q_marks.bold = True
                
                # Save to BytesIO
                f_stream = io.BytesIO()
                doc.save(f_stream)
                doc_base64 = base64.b64encode(f_stream.getvalue()).decode("utf-8")
                
                response_data = {
                    "success": True,
                    "filename": f"{unit_code.replace('/', '_')}_Exam.docx",
                    "file_data": doc_base64
                }
                
                self.send_response(200)
                self.send_cors_headers()
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps(response_data).encode("utf-8"))

            elif path == "/api/export-session-plan":
                # ── MTTI/F/CUR/05 Session Plan ─────────────────────────────────
                payload = json.loads(post_data.decode("utf-8"))
                plan = payload.get("payload", {})
                steps = plan.get("delivery_steps", [])
                n_step_rows = max(1, len(steps))

                doc = docx.Document()

                # Set page margins to narrow
                from docx.oxml.ns import qn as _qn
                from docx.oxml import OxmlElement as _OxmlElement
                section = doc.sections[0]
                section.top_margin    = docx.shared.Inches(0.6)
                section.bottom_margin = docx.shared.Inches(0.6)
                section.left_margin   = docx.shared.Inches(0.8)
                section.right_margin  = docx.shared.Inches(0.8)

                # Set default font
                style = doc.styles['Normal']
                style.font.name = 'Maiandra GD'
                style.font.size = docx.shared.Pt(11)

                # ── Header paragraphs ────────────────────────────────────────────
                current_dir  = os.path.dirname(os.path.abspath(__file__))
                project_root = os.path.dirname(current_dir)
                logo_path    = os.path.join(project_root, "client", "public", "mtti-logo.jpg")

                p_code = doc.add_paragraph()
                p_code.alignment = 2  # Right aligned
                p_code.add_run("MTTI/F/CUR/05").bold = True

                p_hdr = doc.add_paragraph()
                p_hdr.alignment = 1  # Center
                if os.path.exists(logo_path):
                    p_hdr.add_run().add_picture(logo_path, width=docx.shared.Inches(1.0))
                r_inst = p_hdr.add_run("\nMUKIRIA TECHNICAL TRAINING INSTITUTE\n\n")
                r_inst.bold = True
                r_inst.font.size = docx.shared.Pt(14)
                
                r_sp = p_hdr.add_run("SESSION PLAN")
                r_sp.bold = True

                total_rows = 15 + n_step_rows + 7
                tbl = doc.add_table(rows=total_rows, cols=4)
                tbl.style = 'Table Grid'
                
                # Set precise 4-column widths matching the image exactly (15%, 35%, 25%, 25%)
                # Total width = 6.9 inches (8.5 - 0.8*2)
                from docx.shared import Inches
                widths = [Inches(1.035), Inches(2.415), Inches(1.725), Inches(1.725)]
                for row in tbl.rows:
                    for idx, width in enumerate(widths):
                        row.cells[idx].width = width

                def _set_labeled_cell(cell, label, value=""):
                    cell.text = ""
                    p = cell.paragraphs[0]
                    run_label = p.add_run(label)
                    run_label.bold = True
                    run_label.font.name = 'Maiandra GD'
                    if value:
                        run_val = p.add_run(" " + str(value))
                        run_val.font.name = 'Maiandra GD'

                def _set_header_cell(cell, text, fill="D9D9D9", align=None):
                    cell.text = ""
                    p = cell.paragraphs[0]
                    if align is not None:
                        p.alignment = align
                    run = p.add_run(text)
                    run.bold = True
                    run.font.name = 'Maiandra GD'
                    if fill:
                        from docx.oxml.ns import nsdecls
                        from docx.oxml import parse_xml
                        tcPr = cell._tc.get_or_add_tcPr()
                        shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill}"/>')
                        tcPr.append(shd)

                def _merge(row, start_col, end_col):
                    row.cells[start_col].merge(row.cells[end_col])

                # Row 0
                _set_labeled_cell(tbl.rows[0].cells[0], "Date:", plan.get("date", ""))
                _merge(tbl.rows[0], 0, 1) # Left side (50%)
                _set_labeled_cell(tbl.rows[0].cells[2], "Time:", plan.get("time_duration", ""))
                _merge(tbl.rows[0], 2, 3) # Right side (50%)
                tbl.rows[0].cells[2].merge(tbl.rows[1].cells[3]) # Vertical merge on right

                # Row 1
                _set_labeled_cell(tbl.rows[1].cells[0], "Week:", plan.get("week_number", ""))
                _merge(tbl.rows[1], 0, 1)

                # Row 2
                _set_labeled_cell(tbl.rows[2].cells[0], "Trainer name:", plan.get("trainer_name", "Alexander Kinoti"))
                _merge(tbl.rows[2], 0, 1)
                _set_labeled_cell(tbl.rows[2].cells[2], "Department:", plan.get("department", "Computing & Informatics"))
                _merge(tbl.rows[2], 2, 3)

                # Row 3, 4, 5
                _set_labeled_cell(tbl.rows[3].cells[0], "Unit of Competence:", plan.get("unit_name", ""))
                _merge(tbl.rows[3], 0, 1)
                tbl.rows[3].cells[0].merge(tbl.rows[5].cells[1]) # Vertical merge on left
                
                _set_labeled_cell(tbl.rows[3].cells[2], "Level:", plan.get("level", "6"))
                _merge(tbl.rows[3], 2, 3)
                _set_labeled_cell(tbl.rows[4].cells[2], "Class:", plan.get("class_code", ""))
                _merge(tbl.rows[4], 2, 3)
                _set_labeled_cell(tbl.rows[5].cells[2], "Number of Trainees:", plan.get("trainees_count", 20))
                _merge(tbl.rows[5], 2, 3)

                # Row 6, 7
                _set_labeled_cell(tbl.rows[6].cells[0], "Unit Code:", plan.get("unit_code", ""))
                _merge(tbl.rows[6], 0, 3)
                _set_labeled_cell(tbl.rows[7].cells[0], "Session Title:", plan.get("session_title", ""))
                _merge(tbl.rows[7], 0, 3)

                # Row 8
                _set_labeled_cell(tbl.rows[8].cells[0], "Learning outcome(s)")
                _merge(tbl.rows[8], 0, 1)
                
                outcomes_text = "\n".join([f"\u2610 {o}" for o in plan.get("learning_outcomes", [])])
                _set_labeled_cell(tbl.rows[8].cells[2], "By the end of the session the learner should be able to;\n", "\n" + outcomes_text)
                _merge(tbl.rows[8], 2, 3)

                # Row 9, 10
                resources_text = "\n".join([f"\u2610 {res}" for res in plan.get("resources", [])])
                _set_labeled_cell(tbl.rows[9].cells[0], "Resources (references, and learning aids)")
                _merge(tbl.rows[9], 0, 1)
                _merge(tbl.rows[9], 2, 3)
                tbl.rows[9].cells[2].text = "\n" + (resources_text or "\u2610 OS/Curriculum\n\u2610 Learning guides")
                
                _set_labeled_cell(tbl.rows[10].cells[0], "Safety requirements")
                _merge(tbl.rows[10], 0, 1)
                _merge(tbl.rows[10], 2, 3)
                tbl.rows[10].cells[2].text = "\n\u2610 " + plan.get("safety_requirements", "Adhere to lab safety rules.")

                # Row 11, 12, 13
                _set_header_cell(tbl.rows[11].cells[0], "Session presentation", align=1)
                _merge(tbl.rows[11], 0, 3)

                _set_header_cell(tbl.rows[12].cells[0], "1. Introduction", align=0)
                _merge(tbl.rows[12], 0, 3)
                tbl.rows[12].cells[0].paragraphs[0].add_run("\n" + plan.get("introduction", ""))

                _set_header_cell(tbl.rows[13].cells[0], "2. Session Delivery", align=0)
                _merge(tbl.rows[13], 0, 3)

                # Row 14 headers
                _set_header_cell(tbl.rows[14].cells[0], "Time (in minutes)", fill=None)
                _set_header_cell(tbl.rows[14].cells[1], "Trainer Activity", fill=None)
                _set_header_cell(tbl.rows[14].cells[2], "Learner Activity", fill=None)
                _set_header_cell(tbl.rows[14].cells[3], "Learning Check/Assessment", fill=None)

                # Steps
                for si, step in enumerate(steps):
                    rs = tbl.rows[15 + si]
                    rs.cells[0].text = str(step.get("time_minutes", ""))
                    rs.cells[1].text = step.get("trainer_activity", "")
                    rs.cells[2].text = step.get("learner_activity", "")
                    rs.cells[3].text = step.get("assessment", "")

                footer_start = 15 + n_step_rows

                # Footer rows
                _set_header_cell(tbl.rows[footer_start].cells[0], "3. Session review", fill=None, align=0)
                tbl.rows[footer_start].cells[1].text = plan.get("session_review", "Critique session: Highlight good use of alignment.")
                _merge(tbl.rows[footer_start], 1, 3)

                _set_header_cell(tbl.rows[footer_start+1].cells[0], "Assignment:", fill=None, align=0)
                tbl.rows[footer_start+1].cells[0].paragraphs[0].runs[0].italic = True
                tbl.rows[footer_start+1].cells[1].text = plan.get("assignment", "Sketch a logo idea on paper for a fictional \"Tech Company\" to be digitized next class.")
                tbl.rows[footer_start+1].cells[1].paragraphs[0].runs[0].italic = True
                _merge(tbl.rows[footer_start+1], 1, 3)

                total_time = plan.get("total_time", f"{sum(int(s.get('time_minutes', 0)) for s in steps)}Hrs")
                _set_header_cell(tbl.rows[footer_start+2].cells[0], f"TOTAL TIME:    {total_time}", fill=None, align=1)
                _merge(tbl.rows[footer_start+2], 0, 3)

                _set_header_cell(tbl.rows[footer_start+3].cells[0], "Session reflection", fill=None, align=0)
                _merge(tbl.rows[footer_start+3], 0, 3)

                # Blank row for reflection content
                tbl.rows[footer_start+4].cells[0].text = "\n" + plan.get("reflection", "") + "\n"
                _merge(tbl.rows[footer_start+4], 0, 3)

                _set_labeled_cell(tbl.rows[footer_start+5].cells[0], "Signature:", plan.get("trainer_name", "______________________________________________________"))
                _merge(tbl.rows[footer_start+5], 0, 3)

                f_stream = io.BytesIO()
                doc.save(f_stream)
                doc_base64 = base64.b64encode(f_stream.getvalue()).decode("utf-8")

                self.send_response(200)
                self.send_cors_headers()
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({
                    "success": True,
                    "filename": f"MTTI_CUR05_SessionPlan_W{plan.get('week_number', 1)}.docx",
                    "file_data": doc_base64
                }).encode("utf-8"))

            elif path == "/api/export-learning-plan":
                # ── MTTI/F/CUR/02 Learning Plan ────────────────────────────────
                payload = json.loads(post_data.decode("utf-8"))
                lp = payload.get("payload", {})

                doc = docx.Document()
                section = doc.sections[0]
                section.top_margin    = docx.shared.Inches(0.6)
                section.bottom_margin = docx.shared.Inches(0.6)
                section.left_margin   = docx.shared.Inches(0.8)
                section.right_margin  = docx.shared.Inches(0.8)

                style = doc.styles['Normal']
                style.font.name = 'Maiandra GD'
                style.font.size = docx.shared.Pt(11)

                # Form code (top-left)
                pc = doc.add_paragraph()
                pc.alignment = 0
                pc.add_run("MTTI/F/CUR/02").bold = True

                # Title block
                current_dir  = os.path.dirname(os.path.abspath(__file__))
                project_root = os.path.dirname(current_dir)
                logo_path    = os.path.join(project_root, "client", "public", "mtti-logo.jpg")

                ph = doc.add_paragraph()
                ph.alignment = 1
                if os.path.exists(logo_path):
                    ph.add_run().add_picture(logo_path, width=docx.shared.Inches(1.0))
                rh1 = ph.add_run("\nMUKIRIA TECHNICAL TRAINING INSTITUTE")
                rh1.bold = True
                rh1.font.size = docx.shared.Pt(14)
                rh2 = ph.add_run("\nLEARNING PLAN TEMPLATE")
                rh2.bold = True
                rh2.underline = True
                rh2.font.size = docx.shared.Pt(12)

                # ── Metadata table (7 rows × 2 cols) ────────────────────────────
                meta = doc.add_table(rows=7, cols=2)
                meta.style = 'Table Grid'

                def _lp_row(row_idx, label_l, val_l, label_r="", val_r=""):
                    meta.rows[row_idx].cells[0].text = f"{label_l}{val_l}"
                    meta.rows[row_idx].cells[1].text = f"{label_r}{val_r}"
                    if meta.rows[row_idx].cells[0].paragraphs[0].runs:
                        meta.rows[row_idx].cells[0].paragraphs[0].runs[0].bold = True
                    if label_r and meta.rows[row_idx].cells[1].paragraphs[0].runs:
                        meta.rows[row_idx].cells[1].paragraphs[0].runs[0].bold = True

                _lp_row(0, "UNIT OF COMPETENCE: ", lp.get("unit_name", ""), "Unit Code: ", lp.get("unit_code", ""))
                _lp_row(1, "Name of Trainer: ", lp.get("trainer_name", "Alexander Kinoti"))
                _lp_row(2, "Institution: ", lp.get("institution", "Mukiria Technical Training Institute"), "Level: ", str(lp.get("level", "6")))
                _lp_row(3, "Date of Preparation: ", lp.get("date_prepared", ""), "Date of Revision: ", lp.get("date_revised", ""))
                _lp_row(4, "Number of Trainees: ", str(lp.get("trainees_count", 20)), "Class: ", lp.get("class_code", ""))
                _lp_row(5, "Duration: ", lp.get("duration", ""), "Series: ", lp.get("series", ""))
                _lp_row(6, "Qualification: ", lp.get("qualification", ""), "Department: ", lp.get("department", "Computing & Informatics"))

                # ── Weekly schedule table (9 cols) ───────────────────────────────
                weeks = lp.get("weeks", [])
                sched = doc.add_table(rows=len(weeks) + 1, cols=9)
                sched.style = 'Table Grid'

                col_headers = [
                    "Week", "Session No.", "Session Title", "Learning Outcome",
                    "Trainer\nActivities", "Trainee\nActivities",
                    "Resources & Refs", "Learning Checks/\nAssessments", "Reflections\n& Date"
                ]
                for ci, hdr in enumerate(col_headers):
                    cell = sched.rows[0].cells[ci]
                    cell.text = hdr
                    if cell.paragraphs[0].runs:
                        cell.paragraphs[0].runs[0].bold = True

                for wi, week_data in enumerate(weeks):
                    row = sched.rows[wi + 1]
                    row.cells[0].text = str(week_data.get("week", wi + 1))
                    row.cells[1].text = str(week_data.get("session_no", wi + 1))
                    row.cells[2].text = week_data.get("title", "")
                    row.cells[3].text = week_data.get("outcome", "")
                    row.cells[4].text = week_data.get("trainer_activities", "")
                    row.cells[5].text = week_data.get("trainee_activities", "")
                    row.cells[6].text = week_data.get("resources", "Refs:\n1. OS/Curr\n2. Learning Guide")
                    row.cells[7].text = week_data.get("assessments", "1. oral questioning\n2. written tests\n3. observation")
                    row.cells[8].text = week_data.get("reflections", "")

                # Signature line
                p_sig = doc.add_paragraph()
                p_sig.add_run(f"\nPrepared by: {lp.get('trainer_name', 'Alexander Kinoti')}     "
                               f"Date: {lp.get('date_prepared', '')}     Sign: _______________")

                f_stream = io.BytesIO()
                doc.save(f_stream)
                doc_base64 = base64.b64encode(f_stream.getvalue()).decode("utf-8")

                self.send_response(200)
                self.send_cors_headers()
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({
                    "success": True,
                    "filename": f"MTTI_CUR02_LearningPlan_{lp.get('unit_code', '').replace('/', '_')}.docx",
                    "file_data": doc_base64
                }).encode("utf-8"))

            elif path == "/api/export-practical-exam":
                # ── CDACC Practical Assessment (4-table layout) ─────────────────
                payload = json.loads(post_data.decode("utf-8"))
                pe = payload.get("payload", {})

                doc = docx.Document()
                section = doc.sections[0]
                section.top_margin    = docx.shared.Inches(0.6)
                section.bottom_margin = docx.shared.Inches(0.6)
                section.left_margin   = docx.shared.Inches(0.8)
                section.right_margin  = docx.shared.Inches(0.8)

                style = doc.styles['Normal']
                style.font.name = 'Maiandra GD'
                style.font.size = docx.shared.Pt(11)

                current_dir  = os.path.dirname(os.path.abspath(__file__))
                project_root = os.path.dirname(current_dir)
                logo_path    = os.path.join(project_root, "client", "public", "mtti-logo.jpg")

                # Institution header
                ph = doc.add_paragraph()
                ph.alignment = 1
                if os.path.exists(logo_path):
                    ph.add_run().add_picture(logo_path, width=docx.shared.Inches(1.0))
                rh1 = ph.add_run("\nMUKIRIA TECHNICAL TRAINING INSTITUTE")
                rh1.bold = True
                rh1.font.size = docx.shared.Pt(14)
                dept_run = ph.add_run(f"\n{pe.get('department', 'DEPARTMENT OF COMPUTING AND INFORMATICS')}")
                dept_run.bold = True
                dept_run.font.size = docx.shared.Pt(11)
                pt1 = ph.add_run("\nINTERNAL EXAMINATION")
                pt1.bold = True
                pt2 = ph.add_run("\nPRACTICAL ASSESSMENT")
                pt2.bold = True
                pt2.underline = True

                if pe.get("time"):
                    pt = ph.add_run(f"\nTIME: {pe['time']}")
                    pt.bold = True

                # ── Table 0: Course info (6 rows × 2 cols) ──────────────────────
                t0 = doc.add_table(rows=6, cols=2)
                t0.style = 'Table Grid'
                info_rows = [
                    ("COURSE NAME:", pe.get("course_name", "")),
                    ("COURSE CODE:", pe.get("course_code", "")),
                    ("UNIT NAME",   pe.get("unit_name", "")),
                    ("UNIT CODE",   pe.get("unit_code", "")),
                    ("CLASS",       pe.get("class_code", "")),
                    ("SERIES",      pe.get("series", "")),
                ]
                for ri, (lbl, val) in enumerate(info_rows):
                    t0.rows[ri].cells[0].text = lbl
                    t0.rows[ri].cells[1].text = val
                    if t0.rows[ri].cells[0].paragraphs[0].runs:
                        t0.rows[ri].cells[0].paragraphs[0].runs[0].bold = True

                doc.add_paragraph()

                # CANDIDATE & ASSESSOR DETAILS header
                ph2 = doc.add_paragraph()
                ph2.alignment = 1
                ph2.add_run("CANDIDATE & ASSESSOR DETAILS").bold = True

                # ── Table 1: Candidate/Assessor (3 rows × 4 cols) ───────────────
                t1 = doc.add_table(rows=3, cols=4)
                t1.style = 'Table Grid'
                t1.rows[0].cells[0].text = "Candidate Name:"
                t1.rows[0].cells[2].text = "Reg. Code:"
                t1.rows[1].cells[0].text = "Assessor Name:"
                t1.rows[1].cells[2].text = "Date:"
                t1.rows[2].cells[0].text = "Venue:"
                for ri in range(3):
                    for ci in [0, 2]:
                        if t1.rows[ri].cells[ci].paragraphs[0].runs:
                            t1.rows[ri].cells[ci].paragraphs[0].runs[0].bold = True

                # Instructions
                doc.add_paragraph()
                pi = doc.add_paragraph()
                pi.add_run("INSTRUCTIONS:").bold = True
                for instr in pe.get("instructions", [
                    "The assessment shall include a practical session and an oral assessment.",
                    "The assessor will take photos and videos as you perform the tasks at critical points.",
                    "Ensure all required resources have been provided before beginning.",
                ]):
                    doc.add_paragraph(instr, style='List Bullet')

                # Project brief
                doc.add_paragraph()
                pb = doc.add_paragraph()
                pb.add_run("PROJECT BRIEF").bold = True
                doc.add_paragraph(pe.get("project_brief", "In this project, the candidate will be required to demonstrate competence in the unit."))

                # Elements covered
                doc.add_paragraph()
                pe_sec = doc.add_paragraph()
                pe_sec.add_run("SECTION 1\nElements Covered").bold = True
                for el in pe.get("elements", []):
                    doc.add_paragraph(el, style='List Number')

                # Tasks
                pt_hdr = doc.add_paragraph()
                pt_hdr.add_run("Tasks").bold = True
                for task in pe.get("tasks", []):
                    doc.add_paragraph(task, style='List Number')

                doc.add_paragraph()
                po = doc.add_paragraph()
                po.add_run("ORAL ASSESSMENT").bold = True
                doc.add_paragraph("The assessor will proceed to ask you oral questions based on the work done.")
                doc.add_page_break()

                # ── Table 2: Performance Checklist ──────────────────────────────
                criteria = pe.get("criteria", [])
                n_criteria = max(len(criteria), 10)
                t2 = doc.add_table(rows=n_criteria + 2, cols=5)
                t2.style = 'Table Grid'

                for ci, hdr in enumerate(["No.", "Performance Criterion", "Max Marks", "Awarded", "Remarks"]):
                    t2.rows[0].cells[ci].text = hdr
                    if t2.rows[0].cells[ci].paragraphs[0].runs:
                        t2.rows[0].cells[ci].paragraphs[0].runs[0].bold = True

                total_marks = 0
                for ri in range(n_criteria):
                    row = t2.rows[ri + 1]
                    row.cells[0].text = str(ri + 1)
                    if ri < len(criteria):
                        crit = criteria[ri]
                        row.cells[1].text = crit.get("criterion", "")
                        marks = crit.get("marks", 4)
                        row.cells[2].text = str(marks)
                        total_marks += marks
                    else:
                        row.cells[2].text = ""

                # Total row
                tr = t2.rows[n_criteria + 1]
                tr.cells[0].text = "Total score"
                tr.cells[0].merge(tr.cells[1])
                tr.cells[2].text = str(total_marks)
                if tr.cells[0].paragraphs[0].runs:
                    tr.cells[0].paragraphs[0].runs[0].bold = True

                doc.add_paragraph()

                # ── Table 3: Verdict / Feedback (5 rows × 4 cols) ───────────────
                t3 = doc.add_table(rows=5, cols=4)
                t3.style = 'Table Grid'

                v_cell = t3.rows[0].cells[0]
                v_cell.text = "The candidate was found to be\n\n        \u2610 Competent        \u2610 Not Yet Competent"
                v_cell.merge(t3.rows[0].cells[3])

                for ri, lbl in enumerate(["Feedback from candidate:", "Feedback to candidate:"], start=1):
                    fc = t3.rows[ri].cells[0]
                    fc.text = lbl
                    fc.merge(t3.rows[ri].cells[3])
                    if fc.paragraphs[0].runs:
                        fc.paragraphs[0].runs[0].bold = True

                t3.rows[3].cells[0].text = "Candidate's signature:"
                t3.rows[3].cells[2].text = "Date:"
                t3.rows[4].cells[0].text = "Assessor's signature:"
                t3.rows[4].cells[2].text = "Date:"
                for ri in [3, 4]:
                    for ci in [0, 2]:
                        if t3.rows[ri].cells[ci].paragraphs[0].runs:
                            t3.rows[ri].cells[ci].paragraphs[0].runs[0].bold = True

                f_stream = io.BytesIO()
                doc.save(f_stream)
                doc_base64 = base64.b64encode(f_stream.getvalue()).decode("utf-8")

                self.send_response(200)
                self.send_cors_headers()
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({
                    "success": True,
                    "filename": f"MTTI_PracticalExam_{pe.get('unit_code', '').replace('/', '_')}.docx",
                    "file_data": doc_base64
                }).encode("utf-8"))



            else:
                self.send_response(404)
                self.send_cors_headers()
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Not Found"}).encode("utf-8"))

        except Exception as e:
            import traceback
            traceback.print_exc()
            self.send_response(500)
            self.send_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))

def run(server_class=HTTPServer, handler_class=APIHandler, port=8000):
    server_address = ("", port)
    httpd = server_class(server_address, handler_class)
    print(f"Starting MTTI Python standard HTTP server on port {port}...")
    httpd.serve_forever()

if __name__ == "__main__":
    run()
