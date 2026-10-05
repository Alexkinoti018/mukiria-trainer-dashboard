import type { Exam } from "./supabase";

export const DIGITAL_LITERACY_EXAMS: Exam[] = [
  {
    id: "exam-061155101A-wa1",
    unit_code: "061155101A-WA1",
    course_name: "Apply Digital Literacy (Office Admin & Land Survey L5/L6)",
    created_at: "2026-09-01T08:00:00Z",
    payload: {
      title: "Apply Digital Literacy — Written Assessment 1 (Internal Examination)",
      class: "FBS5/6/J/25, LS5/6/S/25",
      series: "SEP – NOV 2026",
      duration_minutes: 120,
      total_marks: 70,
      type: "written",
      instructions: "This paper consists of two sections: Section A (30 Marks, Compulsory) and Section B (40 Marks, Answer ANY TWO Questions).",
      section_a: {
        title: "Section A — Core Concepts & Workplace Procedures (30 Marks)",
        instructions: "Answer ALL questions in this section (Compulsory).",
        total_marks: 30,
        questions: [
          {
            id: "dl1_a1",
            text: "Define digital literacy and state its importance in a modern workplace.",
            type: "short_answer",
            marks: 2,
            critical_aspect: "Define digital literacy and workplace relevance",
            correct_answer: "Digital literacy is the ability to access, manage, evaluate, and create information safely and effectively using digital technologies and devices. In the workplace, it enables automated task completion, effective communication, and enhanced productivity.",
            regex_pattern: "(?i)(digital\\s+literacy|technology|computer|skills|workplace|productivity|competenc)",
            keywords: ["digital", "literacy", "technology", "skills", "workplace", "productivity"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          },
          {
            id: "dl1_a2",
            text: "Which of the following contains ONLY computer input devices?",
            type: "mcq",
            options: [
              "Monitor, Printer, and Speaker",
              "Keyboard, Optical Scanner, and Mouse",
              "Projector, Plotter, and Headphone",
              "Hard Disk Drive, USB Drive, and SSD"
            ],
            correct_answer: "1",
            marks: 2,
            critical_aspect: "Input device identification",
            evaluation_mode: "objective",
            requires_trainer_review: false
          },
          {
            id: "dl1_a3",
            text: "List two input devices and two output devices commonly used in a professional office setting.",
            type: "short_answer",
            marks: 4,
            critical_aspect: "Identify standard office input and output peripherals",
            correct_answer: "Input devices: Keyboard, Mouse, Document Scanner, Microphone. Output devices: Computer Monitor (Display), Laser Printer, Multimedia Projector, Speakers.",
            regex_pattern: "(?i)(keyboard|mouse|scanner|mic).*?(monitor|printer|speaker|projector)",
            keywords: ["keyboard", "mouse", "scanner", "monitor", "printer", "projector"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          },
          {
            id: "dl1_a4",
            text: "Explain the correct sequence of steps to safely shut down a computer device as per workplace procedure.",
            type: "short_answer",
            marks: 3,
            critical_aspect: "Safe OS shutdown procedure",
            correct_answer: "1. Save all open working files. 2. Close all active running applications. 3. Click the Start button on the taskbar. 4. Select the Power icon and click 'Shut down'. 5. Wait for the system unit to completely power off before turning off the monitor and wall socket.",
            keywords: ["save", "close", "start", "power", "shut down", "switch off"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          },
          {
            id: "dl1_a5",
            text: "Describe two keyboard techniques that enhance efficiency when typing a report.",
            type: "short_answer",
            marks: 2,
            critical_aspect: "Ergonomic and efficient keyboard techniques",
            correct_answer: "1. Touch typing: Placing fingers on the home row keys (ASDF JKL;) without looking at the keyboard. 2. Utilizing keyboard shortcuts (e.g., Ctrl+C, Ctrl+V, Ctrl+S) to perform formatting and editing commands quickly.",
            keywords: ["touch typing", "home row", "shortcuts", "posture", "fingers"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          },
          {
            id: "dl1_a6",
            text: "You have just completed drafting a confidential report. Outline the steps you would take to create a new folder, save the report into it, and protect the document from unauthorized access.",
            type: "practical",
            marks: 4,
            critical_aspect: "File organization and document password protection",
            correct_answer: "1. Create Folder: Right-click on desktop/directory > New > Folder > name it appropriately > Enter. 2. Save Report: In Word, click File > Save As > Browse to the new folder > Name document. 3. Protect Document: In Save As dialog, click Tools > General Options (or File > Info > Protect Document > Encrypt with Password) > Set strong password > Confirm and Save.",
            keywords: ["right click", "new folder", "save as", "password", "encrypt", "protect"],
            evaluation_mode: "subjective",
            requires_trainer_review: true
          },
          {
            id: "dl1_a7",
            text: "State four areas in an organization where computers are extensively used and explain the role they play in each.",
            type: "short_answer",
            marks: 4,
            critical_aspect: "Enterprise computing applications across departments",
            correct_answer: "1. Accounting/Finance: Budgeting, payroll processing, ledger tracking. 2. Human Resource Management: Employee recordkeeping, recruitment, attendance logs. 3. Marketing/Sales: Digital campaigns, customer relationship management (CRM), invoicing. 4. Operations/Inventory: Stock tracking, supply chain monitoring, automated scheduling.",
            keywords: ["accounting", "finance", "human resource", "marketing", "sales", "inventory", "operations"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          },
          {
            id: "dl1_a8",
            text: "Outline the procedure for connecting and setting up a computer projector for an office presentation.",
            type: "short_answer",
            marks: 3,
            critical_aspect: "Peripheral setup and display projection",
            correct_answer: "1. Connect HDMI or VGA cable from computer to projector input port. 2. Plug in projector power cable and power on both devices. 3. On Windows, press Windows Key + P to open Project menu and select 'Duplicate' or 'Extend'. 4. Adjust projector focus and keystone for a clear image.",
            keywords: ["hdmi", "vga", "cable", "port", "windows key + p", "duplicate", "projector", "power"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          },
          {
            id: "dl1_a9",
            text: "Differentiate between system software and application software, providing one example of each.",
            type: "short_answer",
            marks: 3,
            critical_aspect: "System vs application software distinction",
            correct_answer: "System software manages and controls computer hardware resources and provides a platform for applications (e.g., Microsoft Windows 11, Linux, macOS). Application software enables users to perform specific end-user tasks and productivity activities (e.g., Microsoft Word, Excel, Adobe Photoshop).",
            keywords: ["system software", "application software", "hardware", "user tasks", "operating system", "windows", "word", "excel"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          },
          {
            id: "dl1_a10",
            text: "Explain the concept of 'drag and drop' and state two common scenarios where it is used.",
            type: "short_answer",
            marks: 2,
            critical_aspect: "GUI manipulation using mouse drag and drop",
            correct_answer: "Drag and drop is a GUI action where a user clicks and holds an on-screen object, moves the pointer to a target location, and releases the mouse button. Common scenarios: 1. Moving files or folders between directories. 2. Dragging an image or text block into a document or presentation.",
            keywords: ["click", "hold", "move", "release", "files", "folder", "desktop"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          },
          {
            id: "dl1_a11",
            text: "Explain why an organization should establish policies regarding computer usage by employees.",
            type: "short_answer",
            marks: 3,
            critical_aspect: "Workplace acceptable use policy (AUP)",
            correct_answer: "1. Protect organizational data and cybersecurity against breaches and malware. 2. Ensure compliance with data privacy regulations (e.g. Kenya Data Protection Act). 3. Prevent workplace liability and unproductive non-work-related computer activities.",
            keywords: ["policy", "security", "data protection", "productivity", "compliance", "acceptable use"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          }
        ]
      },
      section_b: {
        title: "Section B — Structured Practical & Application Questions (40 Marks)",
        instructions: "Answer ANY TWO questions from this section. Each question carries 20 marks.",
        total_marks: 40,
        questions: [
          {
            id: "dl1_b1",
            text: "a) Describe the primary function of a word processing application and list two features that differentiate it from a plain text editor (4 Marks).\nb) You are tasked with creating a newsletter in a word processing application. List four formatting options you would apply to make it visually appealing and easy to read (4 Marks).\nc) What is the function of the following key combinations in MS Office? (6 Marks)\n   i. CTRL + Z\n   ii. CTRL + X\n   iii. CTRL + V\nd) Describe three differences between a calculator and a computer (6 Marks).",
            type: "practical",
            marks: 20,
            critical_aspect: "Word processing capabilities, shortcuts, and computational device architecture",
            correct_answer: "a) Word processor creates, edits, formats, and prints rich text documents. Differentiators from plain text: WYSIWYG text formatting (bold/fonts/colors) and support for tables/graphics/spellcheck. b) Newsletter formatting: Multi-column layout, drop caps, header/footer branding, callout boxes/borders, styled headings. c) i. CTRL+Z: Undo last action. ii. CTRL+X: Cut selected text/item to clipboard. iii. CTRL+V: Paste item from clipboard. d) Differences: Computer is general-purpose programmable device while calculator is dedicated arithmetic device; Computer possesses large secondary storage while calculator has minimal memory; Computer supports rich peripheral input/output while calculator has fixed keypad and numeric LCD display.",
            regex_pattern: "(?i)(undo).*?(cut).*?(paste)",
            keywords: ["undo", "cut", "paste", "columns", "formatting", "word processor", "calculator", "programmable", "general purpose"],
            evaluation_mode: "subjective",
            requires_trainer_review: true
          },
          {
            id: "dl1_b2",
            text: "a) Outline the step-by-step procedure to insert a 4-column, 5-row table in Microsoft Word and enter data into the cells (5 Marks).\nb) Outline the steps required to save a spreadsheet workbook to a specific drive and print pages 1 to 2 (5 Marks).\nc) A department prepares a monthly equipment maintenance budget in Excel. State the formulas to compute: (5 Marks)\n   i. Total Cost for Item 1 = Quantity * Unit Cost\n   ii. Overall Total Expenditure\n   iii. Variance = Allocated Budget - Total Expenditure\nd) Identify five laboratory safety rules that must be observed when operating computers and peripherals in an office or workshop (5 Marks).",
            type: "practical",
            marks: 20,
            critical_aspect: "Table insertion, spreadsheet printing/budget formulas, and computer lab safety",
            correct_answer: "a) In Word: Insert tab > Table > Click and drag grid for 4 columns by 5 rows (or Insert Table > specify 4 cols, 5 rows) > Click first cell and type text, use Tab key to advance between cells. b) Save: File > Save As > Browse > Select drive/folder > Enter file name > Save. Print: File > Print > Under Settings select 'Custom Print' > Enter '1-2' in Pages box > Select printer and click Print. c) i. =B2*C2 (Qty * Cost). ii. =SUM(D2:D10). iii. =F1-D11 (Budget - Total Exp). d) Safety rules: Keep liquids and food away from workstations; Ensure proper cable management to prevent tripping; Power off and unplug equipment before servicing; Maintain adequate ventilation; Use surge protectors and anti-static precautions.",
            regex_pattern: "(?i)=\\s*(sum|[a-z0-9]+\\s*[*\\-\\+])",
            keywords: ["insert table", "save as", "print", "pages 1-2", "=sum", "quantity", "unit cost", "safety", "liquids", "cables"],
            evaluation_mode: "subjective",
            requires_trainer_review: true
          },
          {
            id: "dl1_b3",
            text: "a) Explain the difference between a formula and a function in Microsoft Excel, providing a practical example for each (4 Marks).\nb) Outline the steps to sort a list of 50 employee records alphabetically by surname from A to Z in Excel (4 Marks).\nc) Explain four essential formatting techniques and features you would use in a word processor to design a professional two-page Curriculum Vitae (CV) (6 Marks).\nd) Discuss three critical technical factors an organization must evaluate before procuring an Operating System for its administrative offices (6 Marks).",
            type: "practical",
            marks: 20,
            critical_aspect: "Excel formulas vs functions, data sorting, CV styling, and OS procurement evaluation",
            correct_answer: "a) Formula is a user-defined mathematical expression starting with an equal sign (e.g., =A1+B1+C1). Function is a built-in preprogrammed routine in Excel designed to perform calculations automatically (e.g., =SUM(A1:C1) or =AVERAGE(A1:C1)). b) Sort steps: Highlight the entire employee data range (including headers) > Navigate to Data tab > Click 'Sort' > Check 'My data has headers' > Choose 'Surname' in Sort By dropdown > Select Order 'A to Z' > Click OK. c) CV techniques: Professional font pairing with consistent hierarchy (14pt bold headings, 11pt body); Clean table or borderless tab stops for aligned dates/organizations; Bullet points for achievements; Header with contact details and page numbering. d) OS procurement factors: Hardware compatibility (RAM, CPU architecture); Software application compatibility with existing business software; Total licensing and support costs; Security features and regular vendor update lifecycle.",
            regex_pattern: "(?i)(formula).*?(function).*?(=\\s*sum|average)",
            keywords: ["formula", "function", "=sum", "sort", "a to z", "cv", "headings", "compatibility", "licensing", "security"],
            evaluation_mode: "subjective",
            requires_trainer_review: true
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
