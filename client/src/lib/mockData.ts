/**
 * Mock Data — Demo Mode
 * Used when Supabase credentials are not configured.
 * Provides realistic sample data for UI development and demonstration.
 */

import type { Exam, Submission } from "./supabase";
import { DIGITAL_LITERACY_EXAMS } from "./digitalLiteracyExams";

export const MOCK_EXAMS: any = [
  ...DIGITAL_LITERACY_EXAMS,
  {
    id: "exam-essentials-mod1",
    unit_id: "unit-essentials-4",
    unit_code: "IT/CU/ICTA/CR/01/4/MA",
    course_name: "ICT 4 / ICT Technician Level 5 & 6 (Perform Computer Essentials)",
    created_at: "2026-09-01T08:00:00Z",
    payload: {
      title: "Perform Computer Essentials Formative Assessment",
      class: "ICT4/ITECH6/S/2026 MOD 1",
      series: "SEP – NOV 2026",
      duration_minutes: 180,
      total_marks: 100,
      type: "practical",
      instructions: "This practical examination consists of Practical Observation, Diagnostics & Management, and Oral Assessment.",
      section_a: {
        title: "Section A: Practical Observation & Device Management",
        instructions: "Demonstrate hands-on tasks per assessor observation checklist.",
        total_marks: 50,
        questions: [
          { id: "q_ess_1", text: "Identify 5 external ports and locate CMOS battery.", type: "practical", marks: 15 },
          { id: "q_ess_2", text: "Open Device Manager and verify input device drivers.", type: "practical", marks: 15 },
          { id: "q_ess_3", text: "Oral Assessment: Differentiate between RAM/ROM and SSD/HDD.", type: "oral", marks: 20 },
        ]
      },
      section_b: {
        title: "Section B: Desktop Configuration & Software Management",
        instructions: "Perform file archiving and software management.",
        total_marks: 50,
        questions: [
          { id: "q_ess_4", text: "Create folder structure and compress using 7-Zip.", type: "practical", marks: 25 },
          { id: "q_ess_5", text: "Uninstall software and configure default PDF viewer.", type: "practical", marks: 25 },
        ]
      }
    }
  },
  {
    "id": "exam-wa1-0415",
    "unit_code": "0415-451-21A-WA1",
    "course_name": "Office Administration (Apply ICT Skills)",
    "created_at": "2026-08-22T08:00:00Z",
    "payload": {
      "title": "Apply ICT Skills \u2014 Written Assessment 1 (Term Sept/Dec 2026)",
      
      "class": "ADMIN5/6/J/26",
      "series": "Sept/Dec 2026",
      "duration_minutes": 120,
      "total_marks": 100,
      "type": "written",
      "instructions": "This paper consists of two sections: A (40 Marks) and B (60 Marks). Answer ALL questions in Section A and ANY THREE questions in Section B.",
      "section_a": {
        "title": "Section A \u2014 Core Concepts & Procedures (Compulsory)",
        "instructions": "Answer ALL questions in this section (40 Marks total).",
        "total_marks": 40,
        "questions": [
          {
            "id": "wa1_a1",
            "text": "Define an 'operating system'.",
            "type": "short_answer",
            "marks": 2,
            "critical_aspect": "Identify and explain role of operating system software",
            "correct_answer": "System software that manages computer hardware, software resources, and provides common services for computer programs."
          },
          {
            "id": "wa1_a2",
            "text": "Give the step-by-step procedure of creating, renaming, and deleting a folder in Windows.",
            "type": "short_answer",
            "marks": 6,
            "critical_aspect": "File and folder management operations",
            "correct_answer": "Create: Right-click > New > Folder > Type name > Enter. Rename: Right-click folder > Rename > Type new name > Enter. Delete: Right-click folder > Delete / press Delete key."
          },
          {
            "id": "wa1_a3",
            "text": "Name any three major components of a Microsoft Word 2007 program window interface.",
            "type": "short_answer",
            "marks": 3,
            "critical_aspect": "Word processor interface navigation",
            "correct_answer": "1. Ribbon / Tabs, 2. Quick Access Toolbar, 3. Office Button / Title bar, 4. Status bar, 5. Document workspace."
          },
          {
            "id": "wa1_a4",
            "text": "Explain the difference between the following terms:\na) Save and Save As\nb) Workbook and Worksheet\nc) File and Folder",
            "type": "short_answer",
            "marks": 6,
            "critical_aspect": "Basic file and spreadsheet operations",
            "correct_answer": "a) Save updates existing file; Save As allows saving file with new name/location/format. b) Workbook is the entire Excel document containing multiple sheets; Worksheet is a single spreadsheet page. c) File is a specific document/data item; Folder is a directory container storing files."
          },
          {
            "id": "wa1_a5",
            "text": "Explain three ways a word document text block can be aligned (e.g. Left, Center, Right, Justify).",
            "type": "short_answer",
            "marks": 3,
            "critical_aspect": "Text and paragraph formatting",
            "correct_answer": "Left align (aligns text along left margin), Center align (centers text between margins), Right align (aligns along right margin), Justify (aligns text evenly along both margins)."
          },
          {
            "id": "wa1_a6",
            "text": "Explain how you achieve the following tasks in Microsoft Excel:\na) Select a range of cells\nb) Insert new rows and columns\nc) Sort tabular data",
            "type": "short_answer",
            "marks": 6,
            "critical_aspect": "Spreadsheet manipulation and data sorting",
            "correct_answer": "a) Click starting cell and drag across to ending cell or use Shift + arrow keys. b) Right-click row/column header and select Insert. c) Highlight table, go to Data tab > Sort, select column and sort order (A-Z / Z-A)."
          },
          {
            "id": "wa1_a7",
            "text": "What do you understand by worksheet functions in Excel? Give an example mathematical calculation demonstrating their usage.",
            "type": "short_answer",
            "marks": 4,
            "critical_aspect": "Spreadsheet formulas and pre-defined functions",
            "correct_answer": "Worksheet functions are predefined formula routines in Excel designed to perform calculations automatically. Example: =SUM(C5:C10) or =AVERAGE(D5:D10)."
          },
          {
            "id": "wa1_a8",
            "text": "Highlight the steps required to apply custom animation effects to text or objects in a presentation.",
            "type": "short_answer",
            "marks": 4,
            "critical_aspect": "Presentation software slide animations",
            "correct_answer": "1. Select the slide and object/text box. 2. Navigate to Animations tab. 3. Choose desired animation effect (e.g. Fade, Wedge, Fly In). 4. Configure trigger and timing in Animation Pane."
          },
          {
            "id": "wa1_a9",
            "text": "Define the following networking and web terms:\na) Computer network\nb) Internet\nc) World Wide Web (WWW)",
            "type": "short_answer",
            "marks": 6,
            "critical_aspect": "Network infrastructure and Internet concepts",
            "correct_answer": "a) Computer network: Interconnected group of computers/devices sharing resources and data. b) Internet: Global interconnected network of networks using TCP/IP protocol. c) World Wide Web: Collection of web pages and multimedia documents accessed via URLs and HTTP over the internet."
          }
        ]
      },
      "section_b": {
        "title": "Section B \u2014 Structured Essay Questions (Choose 3 out of 4)",
        "instructions": "Answer ANY THREE questions from this section. Each question carries 20 marks (60 Marks total).",
        "total_marks": 80,
        "questions": [
          {
            "id": "wa1_b1",
            "text": "a) Explain any five strengths of Microsoft Word as a word processing application software (10 Marks).\nb) Explain the meaning of the following terms as used in presentation software: Animation, Transition, Slide, Presentation, PowerPoint (10 Marks).",
            "type": "essay",
            "marks": 20,
            "critical_aspect": "Word processing capabilities and presentation terminology",
            "correct_answer": "a) Strengths: WYSIWYG editing, Mail merge, Spell check/grammar proofing, Rich table and graphical formatting, Cloud collaboration and document security. b) Animation: Movement applied to individual elements; Transition: Visual effect between slide changes; Slide: Single screen page; Presentation: Complete collection of slides; PowerPoint: Application used to create slideshows."
          },
          {
            "id": "wa1_b2",
            "text": "a) Identify and explain any 5 common error values in Microsoft Excel (e.g. #DIV/0!, #VALUE!, #REF!, #NAME?, #N/A) (10 Marks).\nb) Using the Panda EST sales report table:\ni. Enter the formula for COMMISSION for employee S101 at 2% of sales (2 Marks).\nii. Enter the formula for TOTAL SALARY = Salary + Commission (2 Marks).\niii. State formulas to compute Totals, Average, Highest, Lowest, and Count (6 Marks).",
            "type": "essay",
            "marks": 20,
            "critical_aspect": "Spreadsheet error debugging and formula calculations",
            "correct_answer": "a) #DIV/0! (division by zero), #VALUE! (wrong argument type), #REF! (invalid cell reference), #NAME? (unrecognized function name), #N/A (value not available). b) i. =D5*0.02 or =D5*2%, ii. =C5+E5, iii. Totals: =SUM(F5:F10), Average: =AVERAGE(F5:F10), Highest: =MAX(F5:F10), Lowest: =MIN(F5:F10), Count: =COUNT(A5:A10)."
          },
          {
            "id": "wa1_b3",
            "text": "a) Identify and explain any five Data Types used in Microsoft Access table design (10 Marks).\nb) In reference to relational database tables:\ni. What is a primary key? (2 Marks)\nii. Identify the primary key in a Customer table (CUST_ID) (1 Mark).\niii. Explain how to set a primary key in Design View (3 Marks).\niv. Distinguish between a 'Record' and a 'Field' (4 Marks).",
            "type": "essay",
            "marks": 20,
            "critical_aspect": "Database schema design, data types, and primary key constraints",
            "correct_answer": "a) Short Text, Long Text, Number, Date/Time, Currency, AutoNumber, Hyperlink. b) i. Unique identifier field that prevents duplicates. ii. CUST_ID. iii. Open table in Design View, select field row, click Primary Key button on ribbon. iv. Field is a single attribute column; Record is a complete row containing all fields for one entity."
          },
          {
            "id": "wa1_b4",
            "text": "a) Discuss five key services of the internet that are highly beneficial to modern organizations (10 Marks).\nb) Explain five operational and economic benefits an educational institution gains from implementing a local computer network (10 Marks).",
            "type": "essay",
            "marks": 20,
            "critical_aspect": "Internet services and enterprise network benefits",
            "correct_answer": "a) Internet services: Electronic Mail (Email), File Transfer (FTP/Cloud storage), World Wide Web (E-commerce/research), Video conferencing, Remote access and cloud software. b) Network benefits: Hardware resource sharing (printers/servers), Centralized data storage and backup, Fast communication and collaboration, Cost efficiency, Streamlined administrative registers and exam management."
          }
        ]
      }
    }
  },
  {
    "id": "exam-wa2-0415",
    "unit_code": "0415-451-21A-WA2",
    "course_name": "Office Administration (Apply ICT Skills)",
    "created_at": "2026-08-22T08:00:00Z",
    "payload": {
      "title": "Apply ICT Skills \u2014 Written Assessment 2 (Term Sept/Dec 2026)",
      
      "class": "ADMIN5/6/J/26",
      "series": "Sept/Dec 2026",
      "duration_minutes": 120,
      "total_marks": 100,
      "type": "written",
      "instructions": "This paper consists of two sections: A (40 Marks) and B (60 Marks). Answer ALL questions in Section A and ANY THREE questions in Section B.",
      "section_a": {
        "title": "Section A \u2014 Computer Systems & Architectures (Compulsory)",
        "instructions": "Answer ALL questions in this section (40 Marks total).",
        "total_marks": 40,
        "questions": [
          {
            "id": "wa2_a1",
            "text": "Classify computers according to:\na) Size and processing power\nb) Purpose\nc) Function and operational principle",
            "type": "short_answer",
            "marks": 6,
            "critical_aspect": "Computer hardware classification",
            "correct_answer": "a) Supercomputers, Mainframes, Minicomputers, Microcomputers. b) General purpose, Special purpose. c) Analog, Digital, Hybrid."
          },
          {
            "id": "wa2_a2",
            "text": "Explain the difference between the following:\na) System Software vs. Application Software\nb) Operating System vs. Antivirus Program\nc) RAM vs. ROM\nd) Secondary Memory vs. Primary Memory\ne) Information vs. Data",
            "type": "short_answer",
            "marks": 10,
            "critical_aspect": "Software and memory terminology",
            "correct_answer": "a) System software runs hardware; Application software performs specific user tasks. b) OS manages all system operations; Antivirus detects/removes malware. c) RAM is volatile read/write; ROM is non-volatile read-only. d) Secondary is long-term storage; Primary is working memory directly accessed by CPU. e) Data is raw unprocessed facts; Information is processed meaningful data."
          },
          {
            "id": "wa2_a3",
            "text": "Explain any three major technological and architectural differences between second-generation and fourth-generation computers.",
            "type": "short_answer",
            "marks": 6,
            "critical_aspect": "Computer evolution generations",
            "correct_answer": "2nd Gen: Transistors, Assembly/early high-level language, magnetic core memory, high heat. 4th Gen: VLSI/microprocessors, high-level languages/GUIs, semiconductor memory, compact and energy-efficient."
          },
          {
            "id": "wa2_a4",
            "text": "What is the CPU? Describe the functions of the two primary units of the Central Processing Unit (ALU and Control Unit).",
            "type": "short_answer",
            "marks": 6,
            "critical_aspect": "CPU architecture and components",
            "correct_answer": "CPU is the brain of the computer executing instructions. Arithmetic Logic Unit (ALU) performs arithmetic calculations and logical comparisons. Control Unit (CU) directs the flow of data, coordinates instruction fetching, decoding, and execution."
          },
          {
            "id": "wa2_a5",
            "text": "State and explain three distinct types of computers categorized under microcomputers (e.g. Desktops, Laptops, Tablets, Smartphones).",
            "type": "short_answer",
            "marks": 6,
            "critical_aspect": "Microcomputer category breakdown",
            "correct_answer": "1. Desktop PC (stationary unit designed for desks with separate monitor/keyboard), 2. Laptop (portable all-in-one computer with integrated battery and screen), 3. Tablet/Smartphone (handheld touchscreen device powered by mobile SoC)."
          },
          {
            "id": "wa2_a6",
            "text": "Identify three safety guidelines when handling hardware components in a computer laboratory.",
            "type": "short_answer",
            "marks": 6,
            "critical_aspect": "Hardware lab safety and ESD precautions",
            "correct_answer": "1. Power off and disconnect all cables before maintenance. 2. Use anti-static wrist straps to prevent electrostatic discharge. 3. Avoid food/liquids near equipment. 4. Maintain proper ventilation."
          }
        ]
      },
      "section_b": {
        "title": "Section B \u2014 Structured Essay Questions (Choose 3 out of 4)",
        "instructions": "Answer ANY THREE questions from this section. Each question carries 20 marks (60 Marks total).",
        "total_marks": 80,
        "questions": [
          {
            "id": "wa2_b1",
            "text": "a) Discuss the five technological milestones and active components that define the five computer generations (1st to 5th) (10 Marks).\nb) Define an operating system and describe five essential functions it performs in a computer system (10 Marks).",
            "type": "essay",
            "marks": 20,
            "critical_aspect": "Generations of computing and OS core services",
            "correct_answer": "a) 1st Gen: Vacuum tubes; 2nd Gen: Transistors; 3rd Gen: Integrated Circuits (ICs); 4th Gen: VLSI/Microprocessors; 5th Gen: AI and parallel processing. b) OS is system software managing resources. Functions: Processor scheduling, Memory management, File system management, Device/IO control, User interface and security."
          },
          {
            "id": "wa2_b2",
            "text": "a) With reference to application software, identify and explain any five major categories of application packages (e.g. Word Processing, Spreadsheet, Database, Presentation, DTP) (10 Marks).\nb) Explain five factors to consider when selecting and acquiring software for an administrative office (10 Marks).",
            "type": "essay",
            "marks": 20,
            "critical_aspect": "Application software categories and software procurement criteria",
            "correct_answer": "a) Categories: Word processing (document creation), Spreadsheets (numerical analysis), Database software (structured records), Presentation software (slideshows), Desktop Publishing (pre-press graphic layouts). b) Selection factors: Compatibility with OS/hardware, User friendliness, Licensing cost, Vendor support/updates, Security and data export capabilities."
          },
          {
            "id": "wa2_b3",
            "text": "a) Describe five critical factors an organization must evaluate when purchasing computer hardware equipment (10 Marks).\nb) Describe five computer input devices and explain their operational role in an office environment (10 Marks).",
            "type": "essay",
            "marks": 20,
            "critical_aspect": "Hardware procurement factors and input device peripherals",
            "correct_answer": "a) Hardware factors: Processor speed/generation, RAM capacity, Storage type/size (SSD vs HDD), Warranty and after-sales service, Power consumption and expansion ports. b) Input devices: Keyboard (text input), Mouse/Touchpad (GUI navigation), Scanner (document digitization), Barcode reader (inventory tracking), Microphone (voice input)."
          },
          {
            "id": "wa2_b4",
            "text": "a) What do you understand by 'secondary memory'? Identify and explain any four secondary storage devices (10 Marks).\nb) Explain why main memory (RAM/ROM) is critical to computer operations and describe how memory hierarchy impacts system performance (10 Marks).",
            "type": "essay",
            "marks": 20,
            "critical_aspect": "Storage media technologies and memory hierarchy",
            "correct_answer": "a) Secondary memory is non-volatile permanent storage. Devices: Hard Disk Drive (magnetic platters), Solid State Drive (flash memory), USB Flash Drive (portable storage), Optical Disc (CD/DVD/Blu-ray). b) Main memory provides high-speed direct access for CPU execution. RAM holds active programs; ROM contains BIOS boot instructions. Faster memory access reduces CPU wait cycles."
          }
        ]
      }
    }
  },
  {
    "id": "exam-wa3-0415",
    "unit_code": "0415-451-21A-WA3",
    "course_name": "Office Administration (Apply ICT Skills)",
    "created_at": "2026-08-22T08:00:00Z",
    "payload": {
      "title": "Apply ICT Skills \u2014 Written Assessment 3 (Term Sept/Dec 2026)",
      
      "class": "ADMIN5/6/J/26",
      "series": "Sept/Dec 2026",
      "duration_minutes": 120,
      "total_marks": 100,
      "type": "written",
      "instructions": "This paper consists of two sections: A (40 Marks) and B (60 Marks). Answer ALL questions in Section A and ANY THREE questions in Section B.",
      "section_a": {
        "title": "Section A \u2014 Networks, Security & Legal Aspects (Compulsory)",
        "instructions": "Answer ALL questions in this section (40 Marks total).",
        "total_marks": 40,
        "questions": [
          {
            "id": "wa3_a1",
            "text": "List four networking devices used to build Local Area Networks in organizations.",
            "type": "short_answer",
            "marks": 2,
            "critical_aspect": "Network hardware devices",
            "correct_answer": "1. Switch, 2. Router, 3. Network Interface Card (NIC), 4. Access Point / Modem."
          },
          {
            "id": "wa3_a2",
            "text": "Explain the following terms as used in computer security:\na) Cyberbullying\nb) Cracking",
            "type": "short_answer",
            "marks": 4,
            "critical_aspect": "Cybersecurity threats and terminology",
            "correct_answer": "a) Cyberbullying: Use of electronic communication to harass, intimidate, or threaten individuals. b) Cracking: Unauthorized breaking into computer systems or software to cause damage, steal data, or bypass licensing."
          },
          {
            "id": "wa3_a3",
            "text": "Differentiate between a Private Cloud and a Public Cloud giving an example in each case.",
            "type": "short_answer",
            "marks": 3,
            "critical_aspect": "Cloud computing deployment models",
            "correct_answer": "Private Cloud: Cloud infrastructure operated solely for a single organization (e.g. internal institutional server). Public Cloud: Cloud services delivered over the public internet to multiple organizations (e.g. AWS, Google Cloud, Microsoft Azure)."
          },
          {
            "id": "wa3_a4",
            "text": "Explain two common types of computer viruses/malware.",
            "type": "short_answer",
            "marks": 4,
            "critical_aspect": "Malware classifications and behavior",
            "correct_answer": "1. Trojan Horse (disguised as legitimate software to provide backdoor access), 2. Worm (self-replicating malware that spreads across networks without human action), 3. Ransomware (encrypts files and demands ransom)."
          },
          {
            "id": "wa3_a5",
            "text": "Explain two laws/acts that govern the use of Information and Communication Technology (ICT) and data in Kenya.",
            "type": "short_answer",
            "marks": 4,
            "critical_aspect": "Kenyan ICT legal and regulatory framework",
            "correct_answer": "1. Data Protection Act (2019) \u2014 regulates processing and privacy of personal data. 2. Computer Misuse and Cybercrimes Act (2018) \u2014 criminalizes unauthorized access, cyber espionage, and digital fraud."
          },
          {
            "id": "wa3_a6",
            "text": "List three common physical network topologies used in LAN configurations.",
            "type": "short_answer",
            "marks": 3,
            "critical_aspect": "Network physical topology design",
            "correct_answer": "1. Star topology, 2. Bus topology, 3. Ring topology, 4. Mesh topology, 5. Tree topology."
          },
          {
            "id": "wa3_a7",
            "text": "State two types of charts commonly used in spreadsheet data visualization.",
            "type": "short_answer",
            "marks": 2,
            "critical_aspect": "Spreadsheet graphical charting",
            "correct_answer": "1. Bar / Column chart, 2. Pie chart, 3. Line chart."
          },
          {
            "id": "wa3_a8",
            "text": "Explain two types of cell referencing used in spreadsheet formulas.",
            "type": "short_answer",
            "marks": 4,
            "critical_aspect": "Spreadsheet cell addressing methods",
            "correct_answer": "Relative cell referencing (adjusts automatically when copied, e.g. A1) and Absolute cell referencing (locks specific row/column with dollar signs, e.g. $A$1)."
          },
          {
            "id": "wa3_a9",
            "text": "Explain two main types of network transmission media (Bounded/Guided vs. Unbounded/Wireless).",
            "type": "short_answer",
            "marks": 4,
            "critical_aspect": "Physical and wireless transmission channels",
            "correct_answer": "Bounded / Guided Media (physical cables like Twisted Pair, Coaxial, Fiber Optic) and Unbounded / Wireless Media (electromagnetic waves like Radio waves, Wi-Fi, Microwave, Satellite)."
          },
          {
            "id": "wa3_a10",
            "text": "Identify two challenges associated with organizational internet usage.",
            "type": "short_answer",
            "marks": 4,
            "critical_aspect": "Internet security and operational risks",
            "correct_answer": "1. Exposure to cyber attacks, malware, and phishing. 2. Bandwidth congestion and productivity loss due to unauthorized browsing."
          },
          {
            "id": "wa3_a11",
            "text": "List three types of text alignment used in word processing documents.",
            "type": "short_answer",
            "marks": 3,
            "critical_aspect": "Word processor formatting",
            "correct_answer": "1. Left alignment, 2. Center alignment, 3. Right alignment, 4. Justified alignment."
          },
          {
            "id": "wa3_a12",
            "text": "State the primary function of a network router.",
            "type": "short_answer",
            "marks": 3,
            "critical_aspect": "Routing and packet forwarding",
            "correct_answer": "Directs data packets between different networks using logical IP addressing."
          }
        ]
      },
      "section_b": {
        "title": "Section B \u2014 Structured Essay Questions (Choose 3 out of 4)",
        "instructions": "Answer ANY THREE questions from this section. Each question carries 20 marks (60 Marks total).",
        "total_marks": 80,
        "questions": [
          {
            "id": "wa3_b1",
            "text": "a) Murasoft Company Limited relies on computer networks for its daily operations. Discuss five advantages that come with utilizing computer-based networks in such organizations (10 Marks).\nb) Explain any three Excel cell data types used in financial modeling (6 Marks).\nc) Explain two methods of preventing computer crimes and data breaches (4 Marks).",
            "type": "essay",
            "marks": 20,
            "critical_aspect": "Enterprise networking benefits, Excel types, and cybercrime defense",
            "correct_answer": "a) Network advantages: Centralized database management, real-time collaboration, peripheral sharing, automated backups, enhanced communication via intranet. b) Excel data types: Numbers/Currency, Text/Labels, Date/Time, Boolean/Logical. c) Prevention methods: Multi-factor authentication, firewalls/encryption, user training, regular security audits."
          },
          {
            "id": "wa3_b2",
            "text": "a) Explain five common features of modern word processors that make them essential for office administration (10 Marks).\nb) George deals with sensitive applicant data at a college. Explain three core principles of data security (Confidentiality, Integrity, Availability) he must observe (6 Marks).\nc) Explain two architectural differences between RAM and secondary hard disk storage (4 Marks).",
            "type": "essay",
            "marks": 20,
            "critical_aspect": "Word processing tools, CIA triad data security, and memory hierarchy",
            "correct_answer": "a) Features: Mail merge, Tables/graphics integration, Track changes and comments, Templates, Auto-formatting/styles. b) CIA Triad: Confidentiality (only authorized access), Integrity (data is accurate and uncorrupted), Availability (data is accessible when needed). c) RAM is volatile, electronic, directly accessed by CPU; HDD is non-volatile, magnetic/mechanical, used for permanent storage."
          },
          {
            "id": "wa3_b3",
            "text": "a) Explain five key components of a standard Microsoft Word screen layout (10 Marks).\nb) Outline the complete procedure for creating a professional corporate Gmail account for an executive (6 Marks).\nc) Explain two emerging technologies/issues in the computing landscape (e.g. AI automation, Cloud migration, Cybersecurity threats) (4 Marks).",
            "type": "essay",
            "marks": 20,
            "critical_aspect": "Word processor interface, Email configuration, and emerging computing trends",
            "correct_answer": "a) Word layout components: Title bar, Ribbon with Tabs, Document canvas, Vertical/Horizontal Rulers, Status bar. b) Procedure: Open browser > Visit accounts.google.com/signup > Enter names, username, secure password > Complete phone verification > Set recovery email > Accept terms. c) Emerging issues: Artificial Intelligence/automation replacing manual workflows, Cloud data sovereignty and security risks."
          },
          {
            "id": "wa3_b4",
            "text": "a) In database design, explain: Primary Key (2m), Data Type (2m), Field (2m) (6 Marks).\nb) Explain three ways an office can protect its workstations against destructive computer virus attacks (6 Marks).\nc) Describe four presentation slide layouts available in PowerPoint (e.g. Title Slide, Title and Content, Two Content, Comparison) (8 Marks).",
            "type": "essay",
            "marks": 20,
            "critical_aspect": "Database design components, Antivirus protection, and slide layout configurations",
            "correct_answer": "a) Primary key uniquely identifies record; Data type defines kind of data stored; Field is a column attribute. b) Virus protection: Install up-to-date antivirus software, Avoid opening suspicious email attachments/flash drives, Enable firewall. c) Slide layouts: Title Slide (intro), Title & Content (header with bullet points/tables), Two Content (side-by-side items), Comparison (side-by-side labeled comparisons)."
          }
        ]
      }
    }
  },
  {
    "id": "exam-prac-0415",
    "unit_code": "0415-451-21A-PRAC",
    "course_name": "Office Administration (Apply ICT Skills)",
    "created_at": "2026-08-22T08:00:00Z",
    "payload": {
      "title": "Apply ICT Skills \u2014 Formative Practical Assessment Series",
      
      "class": "ADMIN5/6/J/26",
      "series": "Sept/Dec 2026",
      "duration_minutes": 180,
      "total_marks": 100,
      "type": "practical",
      "instructions": "Demonstrate practical competency across Word Processing, Spreadsheets, Presentations, Databases, and Desktop Publishing. The assessor will record marks against the observation checklist.",
      "checklist_items": [
        {
          "id": "chk_01",
          "task": "Lab Safety & PPE",
          "criteria": "Candidate wore appropriate PPE and followed lab safety standards",
          "marks": 2,
          "critical_aspect": "Observe laboratory health and safety regulations"
        },
        {
          "id": "chk_02",
          "task": "Word Processing - File Org",
          "criteria": "Created folder 'Practical one' and created 'Trees' document",
          "marks": 4,
          "critical_aspect": "Operating system file and folder operations"
        },
        {
          "id": "chk_03",
          "task": "Word Processing - Text Typing",
          "criteria": "Keyed in text accurately, bolded title, applied center alignment",
          "marks": 4,
          "critical_aspect": "Word processing document creation"
        },
        {
          "id": "chk_04",
          "task": "Word Processing - Formatting",
          "criteria": "Applied bullets, single underline, and two columns with line between",
          "marks": 4,
          "critical_aspect": "Document advanced paragraph and column formatting"
        },
        {
          "id": "chk_05",
          "task": "Word Processing - Letter & Mail Merge",
          "criteria": "Created 'Tree invite' letter and 'Treedata source' table, performed mail merge",
          "marks": 6,
          "critical_aspect": "Mail merge implementation"
        },
        {
          "id": "chk_06",
          "task": "Spreadsheet - Data Entry",
          "criteria": "Created folder 'Practical Three' and keyed in 'Task one' payroll table",
          "marks": 4,
          "critical_aspect": "Spreadsheet data entry and table setup"
        },
        {
          "id": "chk_07",
          "task": "Spreadsheet - Rows & Columns",
          "criteria": "Inserted two rows above specified position and two columns (Gross pay, Tax deductions)",
          "marks": 4,
          "critical_aspect": "Spreadsheet structural modifications"
        },
        {
          "id": "chk_08",
          "task": "Spreadsheet - Formulas",
          "criteria": "Calculated Basic pay, Gross pay, Allowances (10%), Tax (20%), and Net pay accurately",
          "marks": 8,
          "critical_aspect": "Mathematical formula execution in spreadsheets"
        },
        {
          "id": "chk_09",
          "task": "Presentation - Slide Structure",
          "criteria": "Created 7 slides on 'Gender Mainstreaming' using specified structure and content",
          "marks": 6,
          "critical_aspect": "Slide content organization"
        },
        {
          "id": "chk_10",
          "task": "Presentation - Formatting & Design",
          "criteria": "Converted title to WordArt, applied slide theme, and added header/footer",
          "marks": 4,
          "critical_aspect": "Slide aesthetic styling"
        },
        {
          "id": "chk_11",
          "task": "Presentation - Transitions & Animations",
          "criteria": "Applied Shape Circle slide transitions and Wedge animation to all slides",
          "marks": 4,
          "critical_aspect": "Slide animation effects"
        },
        {
          "id": "chk_12",
          "task": "Presentation - Chart & Custom Show",
          "criteria": "Inserted 3D clustered column chart with axes labels and created 'Tanzania' custom slideshow",
          "marks": 6,
          "critical_aspect": "Graphical charting and custom slide shows"
        },
        {
          "id": "chk_13",
          "task": "Database - Table Design & PK",
          "criteria": "Created database 'Expo Africa', built Country and Expo tables with appropriate Primary Keys",
          "marks": 8,
          "critical_aspect": "Relational table creation and primary key assignment"
        },
        {
          "id": "chk_14",
          "task": "Database - Relationships & Forms",
          "criteria": "Established table relationship and generated data entry forms",
          "marks": 6,
          "critical_aspect": "Table relations and form design"
        },
        {
          "id": "chk_15",
          "task": "Database - Reports",
          "criteria": "Created and formatted 'ExpoReport' using the report generator",
          "marks": 6,
          "critical_aspect": "Database report generation"
        },
        {
          "id": "chk_16",
          "task": "Desktop Publishing - Page Setup",
          "criteria": "Set up 3.5\" x 2\" drawing canvas in Microsoft Publisher for freelance business card",
          "marks": 6,
          "critical_aspect": "DTP layout and canvas measurement setup"
        },
        {
          "id": "chk_17",
          "task": "Desktop Publishing - Design & Contrast",
          "criteria": "Applied logo, contact details, shapes, colors, alignment, and high contrast",
          "marks": 8,
          "critical_aspect": "Pre-press design and color composition"
        },
        {
          "id": "chk_18",
          "task": "Exporting & Printing",
          "criteria": "Exported card to PDF format and printed all required documents",
          "marks": 6,
          "critical_aspect": "Document print output and PDF export"
        }
      ]
    }
  }
];

export const MOCK_SUBMISSIONS: Submission[] = [
  {
    id: "sub-harriet-061155101A",
    unit_code: "061155101A-WA1",
    student_name: "Harriet Mwendwa",
    reg_number: "D/UPNUT/25042/069",
    section_a: [
      { question_id: "dl1_a1", answer: "Digital literacy is the ability to use digital tools safely and effectively to enhance workplace productivity.", marks_awarded: 2, ai_reasoning: "Accurately articulates digital technology application and workplace efficiency." },
      { question_id: "dl1_a2", answer: "1", marks_awarded: 2, ai_reasoning: "Correct option B selected (Keyboard, Optical Scanner, and Mouse)." },
      { question_id: "dl1_a3", answer: "Input: Keyboard. Output: Monitor.", marks_awarded: 1, ai_reasoning: "Provided 1 input and 1 output device instead of required two each." },
      { question_id: "dl1_a4", answer: "Click start and power off.", marks_awarded: 0, ai_reasoning: "Omitted crucial safety steps: save files, close apps, and wall socket switch-off." },
      { question_id: "dl1_a5", answer: "None", marks_awarded: 0, ai_reasoning: "No valid keyboard typing techniques or shortcut keys mentioned." },
      { question_id: "dl1_a6", answer: "Right click, create folder, save file.", marks_awarded: 2, ai_reasoning: "Captured folder creation and save, but missed document password encryption." },
      { question_id: "dl1_a7", answer: "Finance and reception.", marks_awarded: 0, ai_reasoning: "Listed two departments without explaining functional roles or completing 4 areas." },
      { question_id: "dl1_a8", answer: "Connect projector cable.", marks_awarded: 0, ai_reasoning: "Omitted Win+P display projection mode and power sequence." },
      { question_id: "dl1_a9", answer: "System software runs computer.", marks_awarded: 0, ai_reasoning: "Superficial definition, missing application software distinction and examples." },
      { question_id: "dl1_a10", answer: "", marks_awarded: 0, ai_reasoning: "No response provided for drag-and-drop mechanism." },
      { question_id: "dl1_a11", answer: "To ensure computer safety.", marks_awarded: 0, ai_reasoning: "Vague single-phrase response, missing cybersecurity, compliance, and AUP." },
    ],
    section_b: [
      { question_id: "dl1_b1", answer: "a) A word processing application creates and formats text documents. Differentiated by formatting styles and spellcheck.\nb) Bullet points, headings, bold text, and column layout.\nc) Ctrl+Z undoes, Ctrl+X cuts, Ctrl+V pastes.\nd) Computer has storage and is programmable; calculator is only for arithmetic.", marks_awarded: 8, ai_reasoning: "Good core grasp of basic features; missed deep comparison and newsletter structure." },
      { question_id: "dl1_b2", answer: "a) Insert tab > Table > select 4 columns and 5 rows. Enter data into cells.\nb) File > Save As, choose path. File > Print > Pages 1-2.\nc) =B2*C2, =SUM(D2:D10), =Budget - Total.\nd) Keep liquids away, manage cables, power off before servicing.", marks_awarded: 8, ai_reasoning: "Basic table and printing steps accurate; formula cell references partially incomplete." },
      { question_id: "dl1_b3", answer: "a) Formula is user written expression, function is preprogrammed Excel routine.\nb) Select data range > Data > Sort A to Z.\nc) Professional headings, clear hierarchy, bullet points, aligned dates.\nd) Hardware specs, licensing cost, and security support.", marks_awarded: 8, ai_reasoning: "Accurate distinction between formula/function; procedural sorting steps brief." },
    ],
    status: "graded",
    total_score: 31,
    trainer_comments: "The candidate demonstrates competent foundational digital skills with solid adherence to workplace ICT standards.",
    created_at: "2026-10-04T09:30:00Z",
  },
  {
    id: "sub-001",
    unit_code: "IT/CU/ICTA/CR/01/6/MA",
    student_name: "Nthiga Gakii Doris",
    reg_number: "14179/S2026",
    section_a: [
      { question_id: "a1", answer: 1, marks_awarded: 2 },
      { question_id: "a2", answer: 2, marks_awarded: 2 },
      { question_id: "a3", answer: 2, marks_awarded: 2 },
      { question_id: "a4", answer: 0, marks_awarded: 2 },
      { question_id: "a5", answer: 1, marks_awarded: 2 },
      { question_id: "a6", answer: 2, marks_awarded: 2 },
      { question_id: "a7", answer: 1, marks_awarded: 2 },
      { question_id: "a8", answer: 1, marks_awarded: 2 },
      { question_id: "a9", answer: 2, marks_awarded: 2 },
      { question_id: "a10", answer: 1, marks_awarded: 2 },
      { question_id: "a11", answer: 2, marks_awarded: 2 },
      { question_id: "a12", answer: 0, marks_awarded: 2 },
      { question_id: "a13", answer: 2, marks_awarded: 2 },
      { question_id: "a14", answer: 1, marks_awarded: 2 },
      { question_id: "a15", answer: 3, marks_awarded: 2 },
      { question_id: "a16", answer: 1, marks_awarded: 2 },
      { question_id: "a17", answer: 1, marks_awarded: 2 },
      { question_id: "a18", answer: 2, marks_awarded: 2 },
      { question_id: "a19", answer: 0, marks_awarded: 2 },
      { question_id: "a20", answer: 3, marks_awarded: 2 },
    ],
    section_b: [
      { question_id: "b1", answer: "Hardware diagnostic techniques: safe disconnection, POST observation, RAM reseating, and voltage verification with multimeter.", marks_awarded: 26 },
      { question_id: "b2", answer: "Operating system configuration: file hierarchy creation, driver rollback, task manager diagnostics, and service optimization.", marks_awarded: 28 },
    ],
    status: "graded",
    total_score: 94,
    created_at: "2026-10-04T10:30:00Z",
  },
  {
    id: "sub-002",
    unit_code: "IT/CU/ICTA/CR/01/6/MA",
    student_name: "Kaumbuthu Belinda Mukiri",
    reg_number: "14255/S2026",
    section_a: [
      { question_id: "a1", answer: 1, marks_awarded: 2 },
      { question_id: "a2", answer: 1, marks_awarded: 0 },
      { question_id: "a3", answer: 2, marks_awarded: 2 },
      { question_id: "a4", answer: 0, marks_awarded: 2 },
      { question_id: "a5", answer: 1, marks_awarded: 2 },
      { question_id: "a6", answer: 0, marks_awarded: 0 },
      { question_id: "a7", answer: 1, marks_awarded: 2 },
      { question_id: "a8", answer: 1, marks_awarded: 2 },
      { question_id: "a9", answer: 2, marks_awarded: 2 },
      { question_id: "a10", answer: 1, marks_awarded: 2 },
      { question_id: "a11", answer: 2, marks_awarded: 2 },
      { question_id: "a12", answer: 0, marks_awarded: 2 },
      { question_id: "a13", answer: 2, marks_awarded: 2 },
      { question_id: "a14", answer: 1, marks_awarded: 2 },
      { question_id: "a15", answer: 2, marks_awarded: 0 },
      { question_id: "a16", answer: 1, marks_awarded: 2 },
      { question_id: "a17", answer: 1, marks_awarded: 2 },
      { question_id: "a18", answer: 2, marks_awarded: 2 },
      { question_id: "a19", answer: 0, marks_awarded: 2 },
      { question_id: "a20", answer: 3, marks_awarded: 2 },
    ],
    section_b: [
      { question_id: "b1", answer: "Peripheral connection procedures and ESD precautions prior to mother unit handling.", marks_awarded: 20 },
      { question_id: "b3", answer: "File system comparison between NTFS and FAT32; access control rights and compression.", marks_awarded: 18 },
    ],
    status: "graded",
    total_score: 72,
    created_at: "2026-10-04T10:45:00Z",
  },
  {
    id: "sub-003",
    unit_code: "IT/CU/ICTA/CR/01/4/MA",
    student_name: "Wanjau Alvin Gatere",
    reg_number: "14076/S2026",
    section_a: [
      { question_id: "a1", answer: 1, marks_awarded: 2 },
      { question_id: "a2", answer: 2, marks_awarded: 2 },
      { question_id: "a3", answer: 2, marks_awarded: 2 },
      { question_id: "a4", answer: 0, marks_awarded: 2 },
      { question_id: "a5", answer: 1, marks_awarded: 2 },
      { question_id: "a6", answer: 2, marks_awarded: 2 },
      { question_id: "a7", answer: 1, marks_awarded: 2 },
      { question_id: "a8", answer: 1, marks_awarded: 2 },
      { question_id: "a9", answer: 2, marks_awarded: 2 },
      { question_id: "a10", answer: 1, marks_awarded: 2 },
      { question_id: "a11", answer: 2, marks_awarded: 2 },
      { question_id: "a12", answer: 0, marks_awarded: 2 },
      { question_id: "a13", answer: 2, marks_awarded: 2 },
      { question_id: "a14", answer: 1, marks_awarded: 2 },
      { question_id: "a15", answer: 3, marks_awarded: 2 },
      { question_id: "a16", answer: 1, marks_awarded: 2 },
      { question_id: "a17", answer: 1, marks_awarded: 2 },
      { question_id: "a18", answer: 2, marks_awarded: 2 },
      { question_id: "a19", answer: 0, marks_awarded: 2 },
      { question_id: "a20", answer: 3, marks_awarded: 2 },
    ],
    section_b: [
      { question_id: "b2", answer: "Steps for installing desktop applications and managing default application associations.", marks_awarded: 27 },
      { question_id: "b3", answer: "Safe shutdown protocols and disk maintenance commands (sfc /scannow and chkdsk).", marks_awarded: 22 },
    ],
    status: "graded",
    total_score: 89,
    created_at: "2026-10-04T11:00:00Z",
  },
  {
    id: "sub-004",
    unit_code: "IT/CU/ICTA/CR/01/6/MA",
    student_name: "Ltumwa Lesoipa",
    reg_number: "14022/S2026",
    section_a: [
      { question_id: "a1", answer: 0, marks_awarded: 0 },
      { question_id: "a2", answer: 2, marks_awarded: 2 },
      { question_id: "a3", answer: 2, marks_awarded: 2 },
      { question_id: "a4", answer: 0, marks_awarded: 2 },
      { question_id: "a5", answer: 1, marks_awarded: 2 },
      { question_id: "a6", answer: 2, marks_awarded: 2 },
      { question_id: "a7", answer: 1, marks_awarded: 2 },
      { question_id: "a8", answer: 1, marks_awarded: 2 },
      { question_id: "a9", answer: 0, marks_awarded: 0 },
      { question_id: "a10", answer: 1, marks_awarded: 2 },
      { question_id: "a11", answer: 2, marks_awarded: 2 },
      { question_id: "a12", answer: 0, marks_awarded: 2 },
      { question_id: "a13", answer: 2, marks_awarded: 2 },
      { question_id: "a14", answer: 1, marks_awarded: 2 },
      { question_id: "a15", answer: 3, marks_awarded: 2 },
      { question_id: "a16", answer: 1, marks_awarded: 2 },
      { question_id: "a17", answer: 1, marks_awarded: 2 },
      { question_id: "a18", answer: 2, marks_awarded: 2 },
      { question_id: "a19", answer: 0, marks_awarded: 2 },
      { question_id: "a20", answer: 3, marks_awarded: 2 },
    ],
    section_b: [
      { question_id: "b1", answer: "Network adapter properties and Ethernet patch cable color standard T568B.", marks_awarded: 15 },
      { question_id: "b2", answer: "Basic device manager driver checks and resource allocation.", marks_awarded: 10 },
    ],
    status: "graded",
    total_score: 61,
    created_at: "2026-10-04T11:15:00Z",
  },
  {
    id: "sub-005",
    unit_code: "061155101A-WA1",
    student_name: "Yvonne Mwende",
    reg_number: "13254",
    section_a: [
      { question_id: "a1", answer: 1, marks_awarded: 2 },
      { question_id: "a2", answer: 2, marks_awarded: 2 },
      { question_id: "a3", answer: 2, marks_awarded: 2 },
      { question_id: "a4", answer: 0, marks_awarded: 2 },
      { question_id: "a5", answer: 1, marks_awarded: 2 },
      { question_id: "a6", answer: 2, marks_awarded: 2 },
      { question_id: "a7", answer: 1, marks_awarded: 2 },
      { question_id: "a8", answer: 1, marks_awarded: 2 },
      { question_id: "a9", answer: 2, marks_awarded: 2 },
      { question_id: "a10", answer: 1, marks_awarded: 2 },
      { question_id: "a11", answer: 2, marks_awarded: 2 },
      { question_id: "a12", answer: 0, marks_awarded: 2 },
      { question_id: "a13", answer: 2, marks_awarded: 2 },
      { question_id: "a14", answer: 1, marks_awarded: 2 },
      { question_id: "a15", answer: 3, marks_awarded: 2 },
      { question_id: "a16", answer: 1, marks_awarded: 2 },
      { question_id: "a17", answer: 1, marks_awarded: 2 },
      { question_id: "a18", answer: 2, marks_awarded: 2 },
      { question_id: "a19", answer: 0, marks_awarded: 2 },
      { question_id: "a20", answer: 3, marks_awarded: 2 },
    ],
    section_b: [
      { question_id: "b1", answer: "Word processing: mail merge execution, multi-column document styling, and table formatting.", marks_awarded: 29 },
      { question_id: "b2", answer: "Spreadsheets: formula calculation (=SUM, =AVERAGE), sorting records, and chart creation.", marks_awarded: 29 },
    ],
    status: "graded",
    total_score: 98,
    created_at: "2026-10-04T11:30:00Z",
  },
  {
    id: "sub-006",
    unit_code: "061155101A-WA1",
    student_name: "Muoki Muthoki",
    reg_number: "13263",
    section_a: Array.from({ length: 20 }, (_, i) => ({
      question_id: `a${i + 1}`,
      answer: i % 3,
      marks_awarded: i % 4 === 0 ? 0 : 2,
    })),
    section_b: [
      { question_id: "b1", answer: "Input and output devices used in modern hospitality office front desk operations.", marks_awarded: 12 },
      { question_id: "b3", answer: "Email etiquette and calendar scheduling for staff coordination.", marks_awarded: 14 },
    ],
    status: "pending",
    total_score: null,
    created_at: "2026-10-04T12:00:00Z",
  },
  {
    id: "sub-007",
    unit_code: "061155101A-WA1",
    student_name: "Vick Mutembei",
    reg_number: "14009",
    section_a: [
      { question_id: "a1", answer: 2, marks_awarded: 2 },
      { question_id: "a2", answer: 1, marks_awarded: 2 },
      { question_id: "a3", answer: 2, marks_awarded: 2 },
      { question_id: "a4", answer: 1, marks_awarded: 2 },
      { question_id: "a5", answer: 2, marks_awarded: 2 },
    ],
    section_b: [
      { question_id: "b1", answer: "Digital drawing file management and cloud backups for land survey records.", marks_awarded: 24 },
    ],
    status: "graded",
    total_score: 34,
    created_at: "2026-10-05T09:00:00Z",
  },
  {
    id: "sub-risper-0415",
    unit_code: "0415-451-21A-WA1",
    student_name: "RISPER MWENDE",
    reg_number: "13410",
    student_email: "risper.mwende@mtti.ac.ke",
    section_a: [
      { question_id: "wa1_a1", answer: "System software controlling computer operations. Windows 11, Ubuntu Linux.", marks_awarded: 4, ai_reasoning: "Accurate definition and examples provided." },
      { question_id: "wa1_a2", answer: "Fetch instructions, decode instructions, execute arithmetic logic operations.", marks_awarded: 6, ai_reasoning: "All three CPU instruction phases captured." },
      { question_id: "wa1_a3", answer: "RAM", marks_awarded: 2, ai_reasoning: "Correct volatile memory selected." },
    ],
    section_b: [
      { question_id: "wa1_b1", answer: "Click Mailings > Start Mail Merge. Select recipients from Excel sheet. Insert merge fields like <<Name>> and <<RegNo>>. Finish and merge.", marks_awarded: 16, ai_reasoning: "Thorough breakdown of standard Mail Merge workflow." },
    ],
    status: "submitted",
    total_score: 28,
    trainer_comments: "Excellent procedural understanding of mail merge and operating systems.",
    submitted_at: "2026-10-04T22:30:00Z",
    created_at: "2026-10-04T20:30:00Z",
  },
  {
    id: "sub-banta-0415",
    unit_code: "0415-451-21A-WA1",
    student_name: "Banta Micheni",
    reg_number: "13527",
    student_email: "banta.micheni@mtti.ac.ke",
    section_a: [
      { question_id: "wa1_a1", answer: "An operating system is the core software managing memory and processes.", marks_awarded: 2 },
    ],
    section_b: [],
    status: "in_progress",
    total_score: null,
    created_at: "2026-10-04T21:00:00Z",
  },
];

