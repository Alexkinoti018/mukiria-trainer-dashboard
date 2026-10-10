import type { Exam } from "./supabase";

export const DIGITAL_LITERACY_EXAMS: Exam[] = [
  {
    id: "exam-061155101A-wa1",
    unit_code: "061155101A-WA1",
    course_name: "Apply Digital Literacy (Office Admin & Land Survey L5/L6)",
    created_at: "2026-09-01T08:00:00Z",
    payload: {
      title: "WRITTEN ASSESSMENT 1",
      department: "HOSPITALITY DEPARTMENT / BUILDING DEPARTMENT",
      course_name: "OFFICE ADMINISTRATION LEVEL 5 & 6, LAND SURVEY LEVEL 5 & 6",
      course_code: "061155101A",
      unit_name: "APPLY DIGITAL LITERACY",
      class: "FBS5/6/J/25, LS5/6/S/25",
      series: "SEP – NOV 2026",
      time_allowed: "2 HOURS",
      duration_minutes: 120,
      total_marks: 70,
      type: "written",
      instructions: "1. This paper consists of two sections A and B;\n2. Answer ALL the question as guided in each section;\n3. Marks for each question are as indicated in the brackets;\n4. You are provided with a separate answer booklet to answer the questions;\n5. Do not write in this question paper.",
      section_a: {
        title: "SECTION A (30 MARKS) — Answer ALL Questions",
        instructions: "Answer ALL Questions (30 Marks total).",
        total_marks: 30,
        questions: [
          {
            id: "dl1_a1",
            q_num: 1,
            text: "Define digital literacy and state its importance in a modern workplace.",
            type: "short_answer",
            marks: 2,
            critical_aspect: "Define digital literacy and workplace relevance",
            correct_answer: "Digital literacy is the ability to access, manage, evaluate, and create information safely and effectively using digital technologies and devices. In the workplace, it enables automated task completion, effective communication, and enhanced productivity.",
            breakdown: [
              { criterion: "Definition of digital literacy", marks: 1 },
              { criterion: "Workplace importance & productivity benefit", marks: 1 }
            ]
          },
          {
            id: "dl1_a2",
            q_num: 2,
            text: "List two input devices and two output devices commonly used in a professional setting.",
            type: "short_answer",
            marks: 4,
            critical_aspect: "Identify standard office input and output peripherals",
            correct_answer: "Input devices: Keyboard, Optical Mouse, Document Scanner. Output devices: Computer Monitor (Display), Laser Printer, Multimedia Projector.",
            breakdown: [
              { criterion: "Two professional input devices listed (1 mk each)", marks: 2 },
              { criterion: "Two professional output devices listed (1 mk each)", marks: 2 }
            ]
          },
          {
            id: "dl1_a3",
            q_num: 3,
            text: "Explain the correct sequence of steps to safely shut down a computer device as per workplace procedure.",
            type: "short_answer",
            marks: 3,
            critical_aspect: "Safe OS shutdown procedure",
            correct_answer: "1. Save all open working files. 2. Close all active running applications. 3. Click the Start button on the taskbar, select Power icon, and click 'Shut down'. 4. Wait for system unit to power off before switching off monitor and wall socket.",
            breakdown: [
              { criterion: "Step 1: Saving active work and open files", marks: 1 },
              { criterion: "Step 2: Gracefully closing active software applications", marks: 1 },
              { criterion: "Step 3: Executing Start > Power > Shut Down command", marks: 1 }
            ]
          },
          {
            id: "dl1_a4",
            q_num: 4,
            text: "Describe two keyboard techniques that enhance efficiency when typing a report.",
            type: "short_answer",
            marks: 2,
            critical_aspect: "Ergonomic and efficient keyboard techniques",
            correct_answer: "1. Touch typing: Placing fingers on home row keys (ASDF JKL;) without looking at keyboard. 2. Utilizing keyboard shortcuts (e.g. Ctrl+C, Ctrl+V, Ctrl+S) for rapid editing.",
            breakdown: [
              { criterion: "Technique 1: Touch typing on home row keys", marks: 1 },
              { criterion: "Technique 2: Use of productivity shortcut keys", marks: 1 }
            ]
          },
          {
            id: "dl1_a5",
            q_num: 5,
            text: "You have just completed drafting a confidential report. Outline the steps you would take to create a new folder, save the report into it, and then password protect the folder, ensuring data security.",
            type: "short_answer",
            marks: 4,
            critical_aspect: "Folder creation, file saving, and password protection",
            correct_answer: "1. Create folder: Right-click desktop/drive > New > Folder > name it appropriately > press Enter. 2. Save report: In application, click File > Save As > Browse to new folder > save file. 3. Password protect: In Save As dialog, click Tools > General Options (or File > Info > Protect Document > Encrypt with Password) > set strong password > confirm.",
            breakdown: [
              { criterion: "Step 1: New folder creation procedure", marks: 1 },
              { criterion: "Step 2: Saving confidential report into target folder", marks: 1 },
              { criterion: "Step 3: Setting password encryption / access protection", marks: 2 }
            ]
          },
          {
            id: "dl1_a6",
            q_num: 6,
            text: "Identify three common areas where computers are used",
            type: "short_answer",
            marks: 3,
            critical_aspect: "Common societal and enterprise computing areas",
            correct_answer: "1. Healthcare / Hospitals: Patient records, diagnostic equipment, appointment scheduling. 2. Banking & Finance: Electronic fund transfers, ATM transactions, accounting records. 3. Education / Schools: Computer-assisted learning, digital research, trainee administration.",
            breakdown: [
              { criterion: "Area 1 identified with application context", marks: 1 },
              { criterion: "Area 2 identified with application context", marks: 1 },
              { criterion: "Area 3 identified with application context", marks: 1 }
            ]
          },
          {
            id: "dl1_a7",
            q_num: 7,
            text: "A colleague needs to present a document from their laptop to a large screen. Describe the steps to connect an external projector to a laptop.",
            type: "short_answer",
            marks: 3,
            critical_aspect: "External display / projector configuration",
            correct_answer: "1. Connect HDMI or VGA cable between laptop video port and projector input, then power on projector. 2. On laptop, press Windows Key + P to open display projection menu. 3. Select 'Duplicate' (or 'Extend') to mirror the screen, then adjust projector focus.",
            breakdown: [
              { criterion: "Step 1: Physical video cable connection and power on", marks: 1 },
              { criterion: "Step 2: Windows display shortcut (Win + P > Duplicate)", marks: 1 },
              { criterion: "Step 3: Screen calibration and projector focus adjustment", marks: 1 }
            ]
          },
          {
            id: "dl1_a8",
            q_num: 8,
            text: "Differentiate between System Software and Application Software, providing two examples for each.",
            type: "short_answer",
            marks: 4,
            critical_aspect: "System vs application software distinction",
            correct_answer: "System software manages and coordinates hardware resources and provides a base platform (e.g. Microsoft Windows 11, Linux OS). Application software is designed for end-users to perform specific productive tasks (e.g. Microsoft Word, Microsoft Excel).",
            breakdown: [
              { criterion: "Conceptual distinction (Hardware control vs End-user tasks)", marks: 2 },
              { criterion: "Two system software examples (Windows, Linux)", marks: 1 },
              { criterion: "Two application software examples (MS Word, MS Excel)", marks: 1 }
            ]
          },
          {
            id: "dl1_a9",
            q_num: 9,
            text: "Explain the concept of 'drag and drop' in the context of file management",
            type: "short_answer",
            marks: 2,
            critical_aspect: "Drag and drop GUI operation in file management",
            correct_answer: "Drag and drop is a graphical user interface operation where the user points to a file, holds down the primary mouse button, drags the pointer to a target folder or directory, and releases the button to move or copy the item.",
            breakdown: [
              { criterion: "Explanation of mouse action (Click, hold, move, release)", marks: 1 },
              { criterion: "File management context (Moving/copying files into folders)", marks: 1 }
            ]
          },
          {
            id: "dl1_a10",
            q_num: 10,
            text: "State two workplace policies or regulations that guide the operation of computer devices.",
            type: "short_answer",
            marks: 3,
            critical_aspect: "Workplace ICT policies and regulatory compliance",
            correct_answer: "1. Acceptable Use Policy (AUP): Defines allowable hardware and internet usage, prohibiting unauthorized downloads or non-work activities. 2. Password & Data Security Policy: Mandates regular password updates, screen locking when unattended, and adherence to confidentiality rules.",
            breakdown: [
              { criterion: "Workplace Policy 1 (Acceptable Use / Internet Policy)", marks: 1.5 },
              { criterion: "Workplace Policy 2 (Password Security / Data Confidentiality)", marks: 1.5 }
            ]
          }
        ]
      },
      section_b: {
        title: "SECTION B (40 MARKS) - Answer ANY TWO Questions",
        instructions: "Answer ANY TWO Questions from this section. Each question carries 20 marks.",
        total_marks: 40,
        questions: [
          {
            id: "dl1_b11",
            q_num: 11,
            text: "11.\na) Describe the primary function of a word processing application and list two features that differentiate it from a plain text editor. (4 Marks)\nb) You are tasked with creating a newsletter in a word processing application. List four formatting options you would apply to make it visually appealing and easy to read. (4 Marks)\nc) What is the function of the following key combinations in Ms Office? (6 Marks)\n   i. CTRL + Z\n   ii. CTRL + X\n   iii. CTRL + V\nd) Describe three differences between a calculator and a computer (6 Marks)",
            type: "structured",
            marks: 20,
            critical_aspect: "Word processing capabilities, office shortcuts, and computer architecture",
            sub_parts: [
              {
                part: "a",
                prompt: "Describe the primary function of a word processing application and list two features that differentiate it from a plain text editor.",
                marks: 4,
                breakdown: [
                  { criterion: "Primary function of word processor", marks: 2 },
                  { criterion: "Two differentiating features (WYSIWYG styling, graphics/tables)", marks: 2 }
                ]
              },
              {
                part: "b",
                prompt: "You are tasked with creating a newsletter in a word processing application. List four formatting options you would apply to make it visually appealing and easy to read.",
                marks: 4,
                breakdown: [
                  { criterion: "Formatting option 1: Multi-column layout", marks: 1 },
                  { criterion: "Formatting option 2: Drop caps on leading text", marks: 1 },
                  { criterion: "Formatting option 3: Callout boxes / borders", marks: 1 },
                  { criterion: "Formatting option 4: Styled headings and header/footer branding", marks: 1 }
                ]
              },
              {
                part: "c",
                prompt: "What is the function of the following key combinations in Ms Office? i. CTRL + Z, ii. CTRL + X, iii. CTRL + V",
                marks: 6,
                breakdown: [
                  { criterion: "i. CTRL + Z: Undo the previous action", marks: 2 },
                  { criterion: "ii. CTRL + X: Cut selected item to clipboard", marks: 2 },
                  { criterion: "iii. CTRL + V: Paste item from clipboard", marks: 2 }
                ]
              },
              {
                part: "d",
                prompt: "Describe three differences between a calculator and a computer",
                marks: 6,
                breakdown: [
                  { criterion: "Difference 1: General purpose programmability vs dedicated arithmetic", marks: 2 },
                  { criterion: "Difference 2: Storage architecture (large secondary storage vs registers)", marks: 2 },
                  { criterion: "Difference 3: Diverse peripheral inputs/outputs vs fixed keypad display", marks: 2 }
                ]
              }
            ]
          },
          {
            id: "dl1_b12",
            q_num: 12,
            text: "12.\na) Explain the steps to insert a pre-designed table into a Word document to organize monthly sales data. (6 Marks)\nb) You have completed a critical financial report in a spreadsheet. Describe how you would save it to a specific network drive and then print only the first page. (4 Marks)\nc) A manager asks you to create a simple budget in a spreadsheet application. List four essential components of a spreadsheet you would use to build and organize this data. (4 Marks)\nd) When using the computer laboratory, several measures can be put in place to ensure computers are safe. Explain three measures. (6 Marks)",
            type: "structured",
            marks: 20,
            critical_aspect: "Word tables, spreadsheet file operations, budget modeling, and computer lab safety",
            sub_parts: [
              {
                part: "a",
                prompt: "Explain the steps to insert a pre-designed table into a Word document to organize monthly sales data.",
                marks: 6,
                breakdown: [
                  { criterion: "Step 1: Navigating to Insert tab > Table group", marks: 2 },
                  { criterion: "Step 2: Selecting Quick Tables or grid dimension (columns/rows)", marks: 2 },
                  { criterion: "Step 3: Entering monthly sales figures and formatting headers", marks: 2 }
                ]
              },
              {
                part: "b",
                prompt: "You have completed a critical financial report in a spreadsheet. Describe how you would save it to a specific network drive and then print only the first page.",
                marks: 4,
                breakdown: [
                  { criterion: "Save to network drive (File > Save As > Browse mapped drive)", marks: 2 },
                  { criterion: "Print page 1 only (File > Print > Custom Pages: 1)", marks: 2 }
                ]
              },
              {
                part: "c",
                prompt: "A manager asks you to create a simple budget in a spreadsheet application. List four essential components of a spreadsheet you would use to build and organize this data.",
                marks: 4,
                breakdown: [
                  { criterion: "Component 1: Cells with coordinates (Row/Column intersections)", marks: 1 },
                  { criterion: "Component 2: Mathematical formulas & functions (e.g. =SUM)", marks: 1 },
                  { criterion: "Component 3: Row and column headers/labels", marks: 1 },
                  { criterion: "Component 4: Worksheet tabs / workbook pages", marks: 1 }
                ]
              },
              {
                part: "d",
                prompt: "When using the computer laboratory, several measures can be put in place to ensure computers are safe. Explain three measures.",
                marks: 6,
                breakdown: [
                  { criterion: "Measure 1: Environmental protection (no liquids/food, dust covers, ventilation)", marks: 2 },
                  { criterion: "Measure 2: Electrical safety (surge suppressors, UPS units, safe cable trunking)", marks: 2 },
                  { criterion: "Measure 3: Physical & cyber access controls (antivirus, locked lab doors, password authentication)", marks: 2 }
                ]
              }
            ]
          },
          {
            id: "dl1_b13",
            q_num: 13,
            text: "13.\na) In a spreadsheet, explain the difference between a formula and a function, and provide an example of each. (6 Marks)\nb) Outline the steps to sort a column of customer names alphabetically in a spreadsheet. (4 Marks)\nc) Your company requires you to develop a job application package. Describe how you would use a word processing application to prepare a professional resume/CV, ensuring it meets typical job advertisement requirements. (6 Marks)\nd) Mary wanted to procure an operating system for use in the computer laboratory. State four factors she should consider before making the purchase. (4 Marks)",
            type: "structured",
            marks: 20,
            critical_aspect: "Spreadsheet calculation methods, sorting, CV formatting, and OS procurement evaluation",
            sub_parts: [
              {
                part: "a",
                prompt: "In a spreadsheet, explain the difference between a formula and a function, and provide an example of each.",
                marks: 6,
                breakdown: [
                  { criterion: "Formula definition and mathematical example (e.g. =A1+B1)", marks: 3 },
                  { criterion: "Function definition and built-in routine example (e.g. =SUM(A1:B1))", marks: 3 }
                ]
              },
              {
                part: "b",
                prompt: "Outline the steps to sort a column of customer names alphabetically in a spreadsheet.",
                marks: 4,
                breakdown: [
                  { criterion: "Step 1: Selecting dataset including customer column headers", marks: 2 },
                  { criterion: "Step 2: Navigating to Data > Sort > selecting Customer Name > Order A to Z", marks: 2 }
                ]
              },
              {
                part: "c",
                prompt: "Your company requires you to develop a job application package. Describe how you would use a word processing application to prepare a professional resume/CV, ensuring it meets typical job advertisement requirements.",
                marks: 6,
                breakdown: [
                  { criterion: "Document structure & section hierarchy (Profile, Experience, Skills)", marks: 2 },
                  { criterion: "Visual styling (Consistent font sizing, clean bullet points, page layout)", marks: 2 },
                  { criterion: "Document review and PDF export for job submission", marks: 2 }
                ]
              },
              {
                part: "d",
                prompt: "Mary wanted to procure an operating system for use in the computer laboratory. State four factors she should consider before making the purchase.",
                marks: 4,
                breakdown: [
                  { criterion: "Factor 1: Hardware system requirements and device compatibility", marks: 1 },
                  { criterion: "Factor 2: Software application compatibility with training curriculum", marks: 1 },
                  { criterion: "Factor 3: Educational licensing costs and affordability", marks: 1 },
                  { criterion: "Factor 4: Ongoing vendor security patches and technical support", marks: 1 }
                ]
              }
            ]
          }
        ]
      }
    }
  },
  {
    id: "exam-061155101A-wa2",
    unit_code: "061155101A-WA2",
    course_name: "Apply Digital Literacy (Office Admin & Land Survey L5/L6)",
    created_at: "2026-09-01T08:00:00Z",
    payload: {
      title: "Apply Digital Literacy — Written Assessment 2 (Computer Systems & OS)",
      class: "FBS5/6/J/25, LS5/6/S/25",
      series: "SEP – NOV 2026",
      duration_minutes: 120,
      total_marks: 70,
      type: "written",
      instructions: "This paper consists of two sections: Section A (30 Marks, Compulsory) and Section B (40 Marks, Answer ANY TWO Questions).",
      section_a: {
        title: "Section A — Systems Architecture, OS & Storage (30 Marks)",
        instructions: "Answer ALL questions in this section (Compulsory).",
        total_marks: 30,
        questions: [
          {
            id: "dl2_a1",
            text: "Classify computers based on physical size and processing capabilities, providing one typical application for each category.",
            type: "short_answer",
            marks: 4,
            critical_aspect: "Computer size and capacity classification",
            correct_answer: "1. Supercomputers: Weather forecasting and scientific simulations. 2. Mainframe computers: Large-scale banking and airline reservation transaction processing. 3. Minicomputers (Mid-range): Medium business servers and industrial process control. 4. Microcomputers (Personal Computers): Desktop/laptop office productivity and personal computing.",
            keywords: ["supercomputer", "mainframe", "minicomputer", "microcomputer", "desktop", "laptop", "server"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          },
          {
            id: "dl2_a2",
            text: "Differentiate between Random Access Memory (RAM) and Read-Only Memory (ROM) in terms of volatility and operational purpose.",
            type: "short_answer",
            marks: 4,
            critical_aspect: "Primary storage memory distinction",
            correct_answer: "RAM is volatile read/write memory that temporarily stores data and instructions actively needed by the CPU while the computer is running; contents are lost when power is turned off. ROM is non-volatile read-only memory that permanently stores boot instructions (BIOS/UEFI firmware) and retains data without power.",
            keywords: ["ram", "rom", "volatile", "non-volatile", "temporary", "permanent", "bios", "firmware"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          },
          {
            id: "dl2_a3",
            text: "Identify the two primary functional units of the Central Processing Unit (CPU) and explain the specific task of each.",
            type: "short_answer",
            marks: 3,
            critical_aspect: "CPU functional unit roles (ALU and Control Unit)",
            correct_answer: "1. Arithmetic Logic Unit (ALU): Executes arithmetic operations (addition, subtraction) and logical comparisons (AND, OR, NOT). 2. Control Unit (CU): Directs and coordinates data flow between CPU components, fetches instructions from memory, and decodes them.",
            keywords: ["alu", "arithmetic logic unit", "control unit", "cu", "fetch", "decode", "execute", "calculations"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          },
          {
            id: "dl2_a4",
            text: "Which of the following storage devices utilizes flash semiconductor memory with NO moving mechanical parts?",
            type: "mcq",
            options: [
              "Hard Disk Drive (HDD)",
              "Solid State Drive (SSD)",
              "Compact Disc (CD-ROM)",
              "Magnetic Tape Drive"
            ],
            correct_answer: "1",
            marks: 2,
            critical_aspect: "Solid state vs magnetic storage identification",
            evaluation_mode: "objective",
            requires_trainer_review: false
          },
          {
            id: "dl2_a5",
            text: "Outline the procedure to safely format an external USB flash drive using the FAT32 or NTFS file system in Windows.",
            type: "short_answer",
            marks: 4,
            critical_aspect: "Storage media formatting and file system selection",
            correct_answer: "1. Insert the USB drive into the computer USB port. 2. Open File Explorer and click 'This PC'. 3. Right-click on the USB flash drive icon and select 'Format...'. 4. Choose desired File System (FAT32 or NTFS). 5. Set Volume Label, select 'Quick Format', and click 'Start'. 6. Confirm warning prompt and wait for 'Format Complete' message.",
            keywords: ["usb", "this pc", "file explorer", "right-click", "format", "fat32", "ntfs", "quick format", "start"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          },
          {
            id: "dl2_a6",
            text: "Explain the role of a device driver in computer hardware integration.",
            type: "short_answer",
            marks: 3,
            critical_aspect: "Device driver software interface role",
            correct_answer: "A device driver is specialized system software that acts as an intermediary or translator between the operating system and connected hardware devices (e.g. printer, graphics card, scanner), enabling the OS to control hardware without knowing low-level hardware design.",
            keywords: ["device driver", "translator", "operating system", "hardware", "printer", "communication"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          },
          {
            id: "dl2_a7",
            text: "State three ergonomic practices a computer operator should adopt to minimize physical strain and prevent Repetitive Strain Injury (RSI).",
            type: "short_answer",
            marks: 3,
            critical_aspect: "Ergonomics in workstation use",
            correct_answer: "1. Maintain proper sitting posture with back supported and feet flat on the floor. 2. Position monitor at eye level approximately an arm's length away to reduce neck strain. 3. Keep wrists straight and level with keyboard while typing. 4. Take regular 5-10 minute rest breaks every hour.",
            keywords: ["posture", "eye level", "monitor", "wrists", "chair", "breaks", "rsi"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          },
          {
            id: "dl2_a8",
            text: "Explain four essential functions performed by an Operating System.",
            type: "short_answer",
            marks: 4,
            critical_aspect: "Operating system core responsibilities",
            correct_answer: "1. Processor (CPU) Scheduling: Allocates CPU time across competing processes. 2. Memory Management: Tracks and allocates RAM blocks to active programs. 3. File System Management: Organizes files into directories and manages access permissions. 4. Device/IO Management: Coordinates communication with input and output peripherals.",
            keywords: ["processor management", "memory management", "file system", "device management", "security", "user interface"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          },
          {
            id: "dl2_a9",
            text: "What is the Windows keyboard shortcut to directly launch Task Manager?",
            type: "mcq",
            options: [
              "Ctrl + Alt + Del",
              "Ctrl + Shift + Esc",
              "Windows Key + R",
              "Alt + F4"
            ],
            correct_answer: "1",
            marks: 2,
            critical_aspect: "Windows system shortcuts",
            evaluation_mode: "objective",
            requires_trainer_review: false
          },
          {
            id: "dl2_a10",
            text: "Distinguish between cold booting and warm booting of a computer system.",
            type: "short_answer",
            marks: 2,
            critical_aspect: "Booting process distinctions",
            correct_answer: "Cold booting occurs when the computer is powered on from a completely shut down / power-off state by pressing the power button. Warm booting is restarting a computer that is already powered on (e.g. through the OS Restart command or Ctrl+Alt+Del) without turning off the electrical power supply.",
            keywords: ["cold boot", "warm boot", "power off", "restart", "reboot"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          }
        ]
      },
      section_b: {
        title: "Section B — Structured System Applications & Procurement (40 Marks)",
        instructions: "Answer ANY TWO questions from this section. Each question carries 20 marks.",
        total_marks: 40,
        questions: [
          {
            id: "dl2_b1",
            text: "a) Discuss the five technological milestones and active electronic components that define the five computer generations (1st to 5th) (10 Marks).\nb) Describe five critical factors an organization must evaluate when purchasing computer hardware equipment for an administrative department (10 Marks).",
            type: "practical",
            marks: 20,
            critical_aspect: "Computer evolution milestones and hardware procurement specifications",
            correct_answer: "a) 1st Gen: Vacuum tubes (high heat, machine language). 2nd Gen: Transistors (smaller, assembly language, magnetic core). 3rd Gen: Integrated Circuits (ICs, keyboard/monitor interfaces). 4th Gen: Very Large Scale Integration / Microprocessors (VLSI/microcomputers, GUIs). 5th Gen: Artificial Intelligence, ULSI, and parallel quantum processing. b) Procurement factors: 1. Processor speed and generation (e.g. Intel Core i5/i7 vs AMD Ryzen). 2. RAM capacity (minimum 8GB-16GB for modern multitasking). 3. Storage capacity and technology (SSD vs HDD). 4. Warranty, after-sales service, and vendor reputation. 5. Power consumption, expandability ports (USB-C, HDMI), and budget compatibility.",
            keywords: ["vacuum tubes", "transistors", "integrated circuits", "microprocessors", "artificial intelligence", "ram", "processor", "ssd", "warranty", "budget"],
            evaluation_mode: "subjective",
            requires_trainer_review: true
          },
          {
            id: "dl2_b2",
            text: "a) Identify and explain four common error values in Microsoft Excel and state how each can be corrected (8 Marks):\n   i. #DIV/0!\n   ii. #VALUE!\n   iii. #REF!\n   iv. #NAME?\nb) An administrative assistant creates an employee payroll worksheet in Excel with columns: Basic Salary (Col C), House Allowance (Col D = 15% of Basic), Gross Salary (Col E), PAYE Tax (Col F = 10% of Gross), and Net Pay (Col G). (12 Marks)\n   i. Write the formula for House Allowance in row 2 (2 Marks)\n   ii. Write the formula for Gross Salary in row 2 (2 Marks)\n   iii. Write the formula for PAYE Tax in row 2 (2 Marks)\n   iv. Write the formula for Net Pay in row 2 (2 Marks)\n   v. State the formula to calculate the Average Net Pay across 25 employees (rows 2 to 26) (4 Marks).",
            type: "practical",
            marks: 20,
            critical_aspect: "Spreadsheet error debugging and payroll formula design",
            correct_answer: "a) i. #DIV/0!: Division by zero or empty cell; fix by ensuring divisor is non-zero or using IFERROR. ii. #VALUE!: Incorrect argument data type (e.g. text in numeric formula); fix by verifying numeric entries. iii. #REF!: Cell reference is invalid or deleted; fix by restoring referenced cells or rewriting formula. iv. #NAME?: Function or range name is misspelled; fix by correcting formula spelling. b) i. =C2*0.15 or =C2*15%. ii. =C2+D2 or =SUM(C2:D2). iii. =E2*0.10 or =E2*10%. iv. =E2-F2. v. =AVERAGE(G2:G26).",
            regex_pattern: "(?i)=\\s*(c2\\s*[*\\+\\-]|=\\s*average\\s*\\(g2:g26\\))",
            keywords: ["#div/0!", "#value!", "#ref!", "#name?", "=c2*0.15", "=c2+d2", "=e2*0.10", "=e2-f2", "=average(g2:g26)"],
            evaluation_mode: "subjective",
            requires_trainer_review: true
          },
          {
            id: "dl2_b3",
            text: "a) Describe five essential services provided by an Operating System in managing computer hardware and software resources (10 Marks).\nb) Discuss five key security measures an organization should implement to protect data, hardware, and software in an administrative office (10 Marks).",
            type: "practical",
            marks: 20,
            critical_aspect: "Operating system services and administrative information security controls",
            correct_answer: "a) OS Services: 1. Process management & multitasking. 2. Memory protection and virtual memory paging. 3. Input/Output device abstraction through drivers. 4. Hierarchical file system access control. 5. User authentication and security logging. b) Security Measures: 1. Regular automated offsite and cloud data backups. 2. Role-based user authentication with multi-factor authentication (MFA). 3. Continuous antivirus, antimalware, and firewall protection. 4. Physical security controls (locks, CCTV, restricted server room access). 5. Periodic security awareness training and acceptable usage policy enforcement.",
            keywords: ["process management", "memory", "file system", "device drivers", "authentication", "backups", "mfa", "antivirus", "firewall", "physical security"],
            evaluation_mode: "subjective",
            requires_trainer_review: true
          }
        ]
      }
    }
  },
  {
    id: "exam-061155101A-wa3",
    unit_code: "061155101A-WA3",
    course_name: "Apply Digital Literacy (Office Admin & Land Survey L5/L6)",
    created_at: "2026-09-01T08:00:00Z",
    payload: {
      title: "Apply Digital Literacy — Written Assessment 3 (Collaboration & Online Work)",
      class: "FBS5/6/J/25, LS5/6/S/25",
      series: "SEP – NOV 2026",
      duration_minutes: 120,
      total_marks: 70,
      type: "written",
      instructions: "This paper consists of two sections: Section A (30 Marks, Compulsory) and Section B (40 Marks, Answer ANY TWO Questions).",
      section_a: {
        title: "Section A — Netiquette, Cloud Collaboration & Digital Labor (30 Marks)",
        instructions: "Answer ALL questions in this section (Compulsory).",
        total_marks: 30,
        questions: [
          {
            id: "dl3_a1",
            text: "Define 'Netiquette' and explain why it is crucial in professional online communication.",
            type: "short_answer",
            marks: 2,
            critical_aspect: "Define netiquette and professional online etiquette",
            correct_answer: "Netiquette refers to the code of acceptable polite conduct and professional etiquette observed when communicating over computer networks and the internet. In the workplace, it maintains corporate reputation, prevents misunderstandings, and respects recipient time and privacy.",
            regex_pattern: "(?i)(netiquette|etiquette|conduct|polite|professional|communication|online)",
            keywords: ["netiquette", "etiquette", "online", "polite", "professional", "conduct", "communication"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          },
          {
            id: "dl3_a2",
            text: "You are part of an online project team collaborating remotely.\na) List three advantages of using online collaboration tools for project management (3 Marks).\nb) List three disadvantages of using online collaboration tools for project management (3 Marks).",
            type: "short_answer",
            marks: 6,
            critical_aspect: "Pros and cons of remote collaboration tools",
            correct_answer: "a) Advantages: 1. Real-time document co-authoring and synchronized communication. 2. Centralized task tracking and transparent accountability. 3. Reduced travel expenses and geographical flexibility. b) Disadvantages: 1. Heavy dependency on reliable internet connectivity. 2. Heightened exposure to cybersecurity breaches and cloud data leaks. 3. Learning curve and potential digital fatigue or miscommunication.",
            keywords: ["collaboration", "real-time", "tracking", "remote", "internet dependency", "security risks", "learning curve"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          },
          {
            id: "dl3_a3",
            text: "Describe the steps you would take to securely send an important business document via email to a client, ensuring data confidentiality.",
            type: "short_answer",
            marks: 3,
            critical_aspect: "Secure email transmission practices",
            correct_answer: "1. Password-protect or encrypt the document before attaching. 2. Double-check the recipient's email address to avoid misdirection. 3. Send the access password through a secondary secure channel (e.g. phone SMS or secure messaging app), never in the same email. 4. Use institutional encrypted email protocol (TLS).",
            keywords: ["encrypt", "password", "secondary channel", "verify recipient", "confidentiality"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          },
          {
            id: "dl3_a4",
            text: "Explain three essential cybersecurity practices a freelancer should adopt when working from public Wi-Fi networks.",
            type: "short_answer",
            marks: 3,
            critical_aspect: "Public Wi-Fi cybersecurity safeguards",
            correct_answer: "1. Utilize a Virtual Private Network (VPN) to encrypt all transmitted data traffic. 2. Ensure websites use secure HTTPS protocol and disable automatic Wi-Fi connections. 3. Keep firewall active and disable file/printer sharing on the operating system.",
            keywords: ["vpn", "virtual private network", "https", "firewall", "disable sharing", "encryption"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          },
          {
            id: "dl3_a5",
            text: "Outline a step-by-step strategy for searching and applying for online jobs using reputable freelance platforms.",
            type: "short_answer",
            marks: 3,
            critical_aspect: "Online job search methodology",
            correct_answer: "1. Create and verify a professional profile highlighting verified skills and past portfolio work. 2. Filter search listings using specific keywords, client rating, and verified payment tags. 3. Tailor a concise proposal addressing the client's problem directly. 4. Submit competitive bid within industry benchmarks and include relevant work samples.",
            keywords: ["profile", "portfolio", "filter", "proposal", "bid", "samples", "freelance"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          },
          {
            id: "dl3_a6",
            text: "Differentiate between a resume and a cover letter, highlighting the distinct role of each in a job application.",
            type: "short_answer",
            marks: 3,
            critical_aspect: "Resume vs Cover Letter distinction",
            correct_answer: "A resume (or CV) is a structured, concise summary of a candidate's education, work history, technical skills, and credentials. A cover letter is a personalized narrative document addressed to the hiring manager explaining candidate motivation, relevant achievements, and how they solve the organization's specific needs.",
            keywords: ["resume", "cover letter", "structured summary", "personalized narrative", "skills", "motivation"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          },
          {
            id: "dl3_a7",
            text: "Explain the concept of copyright and fair use when utilizing digital content sourced from the internet.",
            type: "short_answer",
            marks: 2,
            critical_aspect: "Digital copyright and fair use doctrine",
            correct_answer: "Copyright is legal ownership granting content creators exclusive rights to reproduce and distribute their original digital works. Fair use allows limited use of copyrighted material without permission for educational, research, critique, or news reporting purposes, provided appropriate attribution is given.",
            keywords: ["copyright", "intellectual property", "fair use", "attribution", "creator", "permission"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          },
          {
            id: "dl3_a8",
            text: "Outline three techniques for ensuring accuracy when entering large volumes of data into a spreadsheet.",
            type: "short_answer",
            marks: 3,
            critical_aspect: "Spreadsheet data validation and entry accuracy",
            correct_answer: "1. Configure Data Validation rules (e.g. number ranges, dropdown lists) to restrict invalid inputs. 2. Implement double-entry or spot-check verification against source documents. 3. Use conditional formatting to highlight duplicate or outlier values automatically.",
            keywords: ["data validation", "dropdown", "double entry", "conditional formatting", "verification"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          },
          {
            id: "dl3_a9",
            text: "Which of the following is an immediate red flag indicating a fraudulent online job posting?",
            type: "mcq",
            options: [
              "The employer requires a formal portfolio of previous design work",
              "The client demands an upfront payment or processing fee before hiring",
              "The job interview is conducted via a scheduled Microsoft Teams call",
              "The employer requests verification of professional educational certificates"
            ],
            correct_answer: "1",
            marks: 2,
            critical_aspect: "Identifying fraudulent job postings and scams",
            evaluation_mode: "objective",
            requires_trainer_review: false
          },
          {
            id: "dl3_a10",
            text: "A job opportunity requires you to showcase your past digital projects. Explain how you would create and manage a digital portfolio to present your work effectively to potential employers.",
            type: "practical",
            marks: 3,
            critical_aspect: "Digital portfolio creation and curation",
            correct_answer: "1. Select a modern hosting platform (e.g. GitHub Pages, Google Sites, LinkedIn, or personal website). 2. Curate 4-6 of your strongest, diverse projects with project descriptions, problem solved, tools used, and live links. 3. Include contact details, downloadable resume, and client testimonials. 4. Regularly update with new projects and verify all external hyperlinks work.",
            keywords: ["portfolio", "platform", "curate", "projects", "descriptions", "links", "resume", "update"],
            evaluation_mode: "subjective",
            requires_trainer_review: true
          },
          {
            id: "dl3_a11",
            text: "Beyond technical skills, identify two soft skills that are crucial for success in a remote job interview and briefly explain why each is important.",
            type: "short_answer",
            marks: 2,
            critical_aspect: "Soft skills in digital employment interviews",
            correct_answer: "1. Clear verbal and written communication: Ensures complex ideas are articulated concisely and minimizes remote misunderstandings. 2. Adaptability and problem-solving: Demonstrates capability to learn new software tools and troubleshoot unexpected technical challenges autonomously.",
            keywords: ["communication", "problem solving", "adaptability", "time management", "active listening"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          }
        ]
      },
      section_b: {
        title: "Section B — Applied Collaboration, Digital Identity & Databases (40 Marks)",
        instructions: "Answer ANY TWO questions from this section. Each question carries 20 marks.",
        total_marks: 40,
        questions: [
          {
            id: "dl3_b1",
            text: "a) Identify three different online collaboration tools and briefly describe a scenario where each would be most effectively used for workplace tasks (6 Marks).\nb) Discuss three ethical issues in Information and Communication Technology (ICT) that can arise in an office environment and suggest how each can be prevented (6 Marks).\nc) Explain three common cloud storage permission levels (e.g., Viewer, Commenter, Editor) and describe the security implications of granting inappropriate permissions (4 Marks).\nd) Outline four key elements that must be included in a professional freelance profile to build client trust and win contracts (4 Marks).",
            type: "practical",
            marks: 20,
            critical_aspect: "Collaboration platforms, ICT workplace ethics, cloud permission management, and freelance branding",
            correct_answer: "a) Tools & Scenarios: 1. Google Docs / Microsoft 365: Real-time simultaneous report editing and meeting minutes drafting. 2. Slack / Microsoft Teams: Channel-based team communication, video conferencing, and quick file sharing. 3. Trello / Asana: Kanban sprint planning and milestone deadline tracking. b) Ethical issues: 1. Software piracy / unauthorized licensing -> solve by procuring volume licenses. 2. Employee digital privacy monitoring -> solve through transparent Acceptable Use Policies. 3. Intellectual property plagiarism -> solve through citation standards and copyright compliance. c) Cloud permissions: Viewer (read-only), Commenter (can annotate without modifying text), Editor (full edit rights). Inappropriate editor permissions risk accidental file deletion, data tampering, or unauthorized data sharing. d) Profile elements: Professional headshot photo, clear title and value proposition, verified portfolio samples, and transparent hourly/project pricing with past client reviews.",
            keywords: ["google docs", "teams", "slack", "trello", "piracy", "privacy", "plagiarism", "viewer", "commenter", "editor", "portfolio"],
            evaluation_mode: "subjective",
            requires_trainer_review: true
          },
          {
            id: "dl3_b2",
            text: "a) Identify two online job platforms and describe two essential factors to consider when setting up personal online payment accounts (e.g. PayPal, Wise, M-PESA Global) (6 Marks).\nb) Describe the complete end-to-end workflow of completing an online freelance task: from receiving client instructions, task execution, client revision, and final payment receipt (8 Marks).\nc) Explain the importance of managing a positive digital identity when performing online jobs. Provide two practical examples of practices that contribute to a positive digital identity (6 Marks).",
            type: "practical",
            marks: 20,
            critical_aspect: "Digital labor workflow, online payment regulations, and professional digital identity",
            correct_answer: "a) Platforms: Upwork, Freelancer.com, Fiverr. Payment factors: Transaction fees/currency exchange rates, and regulatory compliance (KYC identity verification, tax reporting). b) Workflow: 1. Review client brief and clarify ambiguities before accepting. 2. Track project milestones and communicate progress updates. 3. Deliver draft via platform before deadline. 4. Process requested client revisions constructively. 5. Obtain client sign-off, release escrow funds, and request formal review/feedback. c) Digital identity importance: Builds long-term client trust, enables repeat contracts, and improves search ranking on platforms. Practices: 1. Maintaining professional communication tone and delivering on promises. 2. Active participation on professional networks (LinkedIn/GitHub) showcasing solved problems.",
            keywords: ["upwork", "fiverr", "paypal", "m-pesa", "escrow", "milestones", "revisions", "digital identity", "trust", "reputation"],
            evaluation_mode: "subjective",
            requires_trainer_review: true
          },
          {
            id: "dl3_b3",
            text: "a) A client requires you to use project management software (e.g. Trello or Asana) for an online task. Assuming you haven't used it before, outline how you would ensure you operate this tool effectively to meet job requirements (6 Marks).\nb) You are preparing for an online interview as a digital content creator. Outline the documentation and digital assets you should have prepared and ready to share during the screen-share segment (8 Marks).\nc) In Microsoft Access database design, describe the characteristics and use cases for the following data types: (6 Marks)\n   i. Short Text vs Long Text\n   ii. AutoNumber\n   iii. Currency",
            type: "practical",
            marks: 20,
            critical_aspect: "Project tool onboarding, digital interview preparation, and database schema data types",
            correct_answer: "a) Onboarding: 1. Review official video documentation and quick-start guides. 2. Explore sample boards/workspaces to understand lists (To-Do, In-Progress, Done) and cards. 3. Clarify client conventions regarding tags, deadlines, and assignment notifications. b) Interview assets: 1. Clean desktop with organized digital portfolio folder. 2. PDF copy of resume and references. 3. Presentation slides showcasing case studies and before/after metrics. 4. Active live links to published articles, graphics, or video reels with appropriate view permissions. c) Access Data Types: i. Short Text: Alphanumeric characters up to 255 characters (e.g. names, codes); Long Text: Large textual descriptions up to 1GB (e.g. remarks, biographies). ii. AutoNumber: System-generated unique sequential number automatically assigned to each new record, ideal for primary keys. iii. Currency: Dedicated monetary values formatted with financial precision and currency symbols, preventing rounding errors.",
            keywords: ["trello", "asana", "kanban", "portfolio", "screen share", "short text", "long text", "autonumber", "currency", "primary key"],
            evaluation_mode: "subjective",
            requires_trainer_review: true
          }
        ]
      }
    }
  }
];
