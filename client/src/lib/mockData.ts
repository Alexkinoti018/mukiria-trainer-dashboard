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
  },
  {
    id: "exam-networking-l6",
    unit_code: "IT/CU/ICTA/CR/01/6/MA",
    course_name: "ICT Technician Level 6 (Perform Computer Networking & Systems Maintenance)",
    created_at: "2026-09-01T08:00:00Z",
    payload: {
      title: "WRITTEN ASSESSMENT 1 — COMPUTER NETWORKING & SYSTEMS MAINTENANCE",
      department: "DEPARTMENT OF COMPUTING & INFORMATICS",
      course_name: "ICT TECHNICIAN LEVEL 6",
      course_code: "061006T4ICT",
      unit_name: "PERFORM COMPUTER NETWORKING & SYSTEMS MAINTENANCE",
      class: "ITECH6/S/2026",
      series: "SEP – NOV 2026",
      time_allowed: "2 HOURS",
      duration_minutes: 120,
      total_marks: 100,
      type: "written",
      instructions: "1. This paper consists of two sections A and B;\n2. Answer ALL questions in Section A (40 Marks) and ANY TWO questions in Section B (60 Marks);\n3. Marks for each question are as indicated in brackets.",
      section_a: {
        title: "SECTION A (40 MARKS) — Multiple Choice & Core Concepts (Compulsory)",
        instructions: "Answer ALL 20 Multiple Choice Questions in this section. Each question carries 2 marks.",
        total_marks: 40,
        questions: [
          { id: "a1", q_num: 1, text: "Which OSI layer is responsible for logical IP addressing and packet routing across networks?", type: "mcq", options: ["Data Link Layer", "Network Layer", "Transport Layer", "Session Layer"], correct_answer: 1, marks: 2, critical_aspect: "OSI Reference Model layer functions" },
          { id: "a2", q_num: 2, text: "What is the standard RJ-45 pinout color code sequence for the first two pins in T568B cabling?", type: "mcq", options: ["White/Green, Green", "Blue, White/Blue", "White/Orange, Orange", "White/Brown, Brown"], correct_answer: 2, marks: 2, critical_aspect: "Structured Ethernet cabling standards" },
          { id: "a3", q_num: 3, text: "Which diagnostic utility tests end-to-end IP reachability using ICMP Echo Request packets?", type: "mcq", options: ["netstat", "nslookup", "ping", "ipconfig"], correct_answer: 2, marks: 2, critical_aspect: "Network troubleshooting utilities" },
          { id: "a4", q_num: 4, text: "What is the primary purpose of wear-leveling and an ESD wrist strap during motherboard maintenance?", type: "mcq", options: ["Prevent electrostatic discharge damage to CMOS/IC components", "Increase CPU clock multiplier", "Format secondary storage partitions", "Boost wireless signal gain"], correct_answer: 0, marks: 2, critical_aspect: "Hardware ESD safety procedures" },
          { id: "a5", q_num: 5, text: "Which protocol automatically assigns dynamic IP addresses, subnet masks, and default gateways to hosts?", type: "mcq", options: ["DNS", "DHCP", "SNMP", "SMTP"], correct_answer: 1, marks: 2, critical_aspect: "Dynamic host configuration services" },
          { id: "a6", q_num: 6, text: "What is the default subnet mask for a standard Class C IPv4 address?", type: "mcq", options: ["255.0.0.0", "255.255.0.0", "255.255.255.0", "255.255.255.252"], correct_answer: 2, marks: 2, critical_aspect: "IPv4 addressing and subnetting" },
          { id: "a7", q_num: 7, text: "During computer boot-up, which firmware routine verifies hardware integrity before loading the OS?", type: "mcq", options: ["NTFS Master File Table", "Power-On Self-Test (POST)", "Task Scheduler", "Windows Registry"], correct_answer: 1, marks: 2, critical_aspect: "BIOS/UEFI POST diagnostics" },
          { id: "a8", q_num: 8, text: "Which network device operates at Layer 2 using MAC address tables to forward frames to specific ports?", type: "mcq", options: ["Repeater", "Managed Ethernet Switch", "Passive Hub", "Coaxial Tap"], correct_answer: 1, marks: 2, critical_aspect: "LAN switching hardware" },
          { id: "a9", q_num: 9, text: "Which Windows command scans and repairs corrupted protected system files?", type: "mcq", options: ["diskpart", "ipconfig /flushdns", "sfc /scannow", "tracert"], correct_answer: 2, marks: 2, critical_aspect: "OS system file recovery" },
          { id: "a10", q_num: 10, text: "Which TCP port is used by default for secure HTTPS web traffic?", type: "mcq", options: ["Port 80", "Port 443", "Port 22", "Port 3389"], correct_answer: 1, marks: 2, critical_aspect: "Transport layer port assignments" },
          { id: "a11", q_num: 11, text: "Which transmission medium is completely immune to Electromagnetic Interference (EMI)?", type: "mcq", options: ["Cat 5e UTP Cable", "Coaxial RG-6 Cable", "Fiber Optic Cable", "Shielded Twisted Pair"], correct_answer: 2, marks: 2, critical_aspect: "Optical vs copper network media" },
          { id: "a12", q_num: 12, text: "What does a continuous series of long beeps during BIOS POST typically indicate?", type: "mcq", options: ["Memory (RAM) module not seated or faulty", "Printer out of paper", "USB mouse disconnected", "Hard disk partition full"], correct_answer: 0, marks: 2, critical_aspect: "POST beep code interpretation" },
          { id: "a13", q_num: 13, text: "Which Windows file system supports file-level encryption (EFS), disk quotas, and ACL permissions?", type: "mcq", options: ["FAT16", "FAT32", "NTFS", "ISO9660"], correct_answer: 2, marks: 2, critical_aspect: "File system security architecture" },
          { id: "a14", q_num: 14, text: "What is the role of the DNS service in an enterprise network?", type: "mcq", options: ["Encrypts local hard drives", "Resolves human-readable domain names to IP addresses", "Assigns MAC addresses to NICs", "Blocks physical port access"], correct_answer: 1, marks: 2, critical_aspect: "Domain Name System resolution" },
          { id: "a15", q_num: 15, text: "Which topology connects every workstation directly to a central switch?", type: "mcq", options: ["Bus Topology", "Ring Topology", "Daisy-Chain Topology", "Star Topology"], correct_answer: 3, marks: 2, critical_aspect: "Physical LAN topologies" },
          { id: "a16", q_num: 16, text: "Which component applies thermal paste to transfer heat away from the processor die?", type: "mcq", options: ["CMOS Battery", "CPU Heatsink & Cooling Fan Assembly", "PCIe Riser Card", "RJ-45 Jack"], correct_answer: 1, marks: 2, critical_aspect: "Processor thermal management" },
          { id: "a17", q_num: 17, text: "What is the loopback IPv4 address used to test the local TCP/IP stack on a workstation?", type: "mcq", options: ["192.168.1.1", "127.0.0.1", "255.255.255.255", "169.254.0.1"], correct_answer: 1, marks: 2, critical_aspect: "IPv4 loopback diagnostics" },
          { id: "a18", q_num: 18, text: "Which tool is used to terminate an RJ-45 modular plug onto twisted-pair Ethernet cable?", type: "mcq", options: ["Multimeter", "Soldering Iron", "RJ-45 Modular Crimping Tool", "Oscilloscope"], correct_answer: 2, marks: 2, critical_aspect: "Network cabling termination tools" },
          { id: "a19", q_num: 19, text: "What does APIPA assign when a DHCP server is unreachable on the network?", type: "mcq", options: ["169.254.x.x link-local address", "10.0.0.1 gateway", "8.8.8.8 DNS server", "Static public IPv6 address"], correct_answer: 0, marks: 2, critical_aspect: "APIPA link-local fallback" },
          { id: "a20", q_num: 20, text: "Which wireless security standard provides the strongest modern encryption for enterprise Wi-Fi?", type: "mcq", options: ["WEP", "WPA-TKIP", "Open System Authentication", "WPA3-Enterprise (AES-GCMP)"], correct_answer: 3, marks: 2, critical_aspect: "Wireless LAN security protocols" },
        ]
      },
      section_b: {
        title: "SECTION B (60 MARKS) — Structured Practical & Diagnostic Questions",
        instructions: "Answer ANY TWO questions from this section. Each question carries 30 marks.",
        total_marks: 60,
        questions: [
          {
            id: "b1",
            q_num: 21,
            text: "21.\na) Outline the systematic hardware diagnostic procedure when a desktop workstation fails to power on or complete POST (15 Marks).\nb) Describe the T568B straight-through Ethernet cable termination and testing procedure using a cable tester (15 Marks).",
            type: "structured",
            marks: 30,
            critical_aspect: "Hardware POST troubleshooting and T568B structured cabling",
            correct_answer: "a) Verify AC power & PSU switch, observe POST beep/LED codes, reseat RAM modules, test PSU rail voltages (12V/5V/3.3V) with multimeter, clear CMOS jumper. b) Strip jacket, untwist pairs, arrange T568B (WO, O, WG, B, WB, G, WBr, Br), trim evenly, insert into RJ-45 plug, crimp, verify pins 1-8 continuity on cable tester.",
            breakdown: [
              { criterion: "21(a) Safe power isolation, POST observation, RAM reseating, and multimeter voltage check", marks: 15 },
              { criterion: "21(b) T568B pinout ordering, crimping termination, and continuity verification", marks: 15 }
            ]
          },
          {
            id: "b2",
            q_num: 22,
            text: "22.\na) Describe the procedure for configuring operating system directory hierarchies, driver rollbacks in Device Manager, and startup service optimization (15 Marks).\nb) Explain how to diagnose and resolve IPv4 network connectivity issues using ipconfig, ping, tracert, and DNS cache flushing (15 Marks).",
            type: "structured",
            marks: 30,
            critical_aspect: "OS driver management and TCP/IP command-line diagnostics",
            correct_answer: "a) Create structured departmental folders, open Device Manager > Properties > Driver tab > Roll Back Driver, inspect Task Manager / services.msc to disable unnecessary startup processes. b) Verify IP/gateway via ipconfig /all, ping 127.0.0.1 then default gateway, run tracert to isolate hop failure, execute ipconfig /flushdns.",
            breakdown: [
              { criterion: "22(a) File hierarchy setup, Device Manager driver rollback, and Task Manager diagnostics", marks: 15 },
              { criterion: "22(b) TCP/IP troubleshooting sequence using ipconfig, ping, tracert, and DNS tools", marks: 15 }
            ]
          },
          {
            id: "b3",
            q_num: 23,
            text: "23.\na) Compare NTFS and FAT32 file systems in terms of maximum file size, security permissions (ACLs), journaling, and compression (15 Marks).\nb) Outline the preventive maintenance schedule and disk integrity commands (chkdsk and sfc /scannow) for laboratory workstations (15 Marks).",
            type: "structured",
            marks: 30,
            critical_aspect: "File system security comparison and disk maintenance commands",
            correct_answer: "a) NTFS supports >16TB files, ACL permissions, EFS encryption, shadow copies, and journaling; FAT32 is limited to 4GB files and lacks ACLs. b) Schedule dust cleaning, thermal inspection, UPS battery checks, and run chkdsk /f /r and sfc /scannow to repair disk sectors and OS system files.",
            breakdown: [
              { criterion: "23(a) Technical comparison between NTFS and FAT32 file systems", marks: 15 },
              { criterion: "23(b) Safe shutdown protocols and disk maintenance commands (sfc /scannow, chkdsk)", marks: 15 }
            ]
          }
        ]
      }
    }
  }
];

export const MOCK_SUBMISSIONS: Submission[] = [
  {
    id: "sub-alex-kinoti-061155101A",
    unit_code: "061155101A-WA1",
    student_name: "Alex Kinoti",
    reg_number: "10525",
    section_a: [
      { question_id: "dl1_a1", answer: "Digital literacy is the capability to safely and effectively use digital technologies and devices to access, evaluate, and create information. Its importance in the workplace is that it enables task automation, seamless collaboration, and high workplace productivity.", marks_awarded: 2, ai_reasoning: "Clear and comprehensive definition with direct workplace relevance." },
      { question_id: "dl1_a2", answer: "Input devices: 1. Keyboard, 2. Optical Mouse. Output devices: 1. Display Monitor, 2. Laser Printer.", marks_awarded: 4, ai_reasoning: "All four standard professional office peripherals correctly identified." },
      { question_id: "dl1_a3", answer: "1. Save all open working files. 2. Close all active software applications. 3. Click the Start button on the taskbar, choose Power icon, and select 'Shut down'. Wait for system unit to power off before switching off monitor and wall socket.", marks_awarded: 2, ai_reasoning: "Sequence adheres to institutional safe power-down protocols." },
      { question_id: "dl1_a4", answer: "1. Touch typing: Keeping fingers anchored on home row keys (ASDF JKL;) without looking down at keys. 2. Using keyboard shortcuts (e.g. Ctrl+C for copy, Ctrl+V for paste, Ctrl+S for saving).", marks_awarded: 2, ai_reasoning: "Correct identification of ergonomics, finger placement, and shortcut keys." },
      { question_id: "dl1_a5", answer: "1. Create folder: Right-click desktop or file explorer > New > Folder > enter confidential folder name > press Enter. 2. Save report: In word processor, click File > Save As > Browse to new folder > save document. 3. Protect: In Save As dialog, click Tools > General Options (or File > Info > Protect Document > Encrypt with Password) > set strong password > confirm.", marks_awarded: 3, ai_reasoning: "Comprehensive procedure covering folder creation, saving, and document password encryption." },
      { question_id: "dl1_a6", answer: "1. Healthcare / Hospitals: Managing patient electronic health records and diagnostic machinery. 2. Banking & Financial Institutions: Handling electronic fund transfers and account balances. 3. Education / Academic Centers: Research, computer-based learning, and academic recordkeeping.", marks_awarded: 3, ai_reasoning: "Three major sectors accurately identified with relevant computing roles." },
      { question_id: "dl1_a7", answer: "1. Connect HDMI or VGA video cable between laptop and projector, then power on the projector. 2. On laptop, press Windows Key + P to display projection options and choose 'Duplicate' (or 'Extend'). 3. Calibrate screen resolution and adjust projector focus ring for clear projection.", marks_awarded: 3, ai_reasoning: "Physical cabling, operating system shortcut, and optical calibration all described." },
      { question_id: "dl1_a8", answer: "System software controls and manages computer hardware and system resources (e.g. Windows 11, Ubuntu Linux). Application software allows users to perform specific end-user productivity tasks (e.g. Microsoft Word, Microsoft Excel).", marks_awarded: 3, ai_reasoning: "Clear technical differentiation with two valid examples for each software category." },
      { question_id: "dl1_a9", answer: "Drag and drop is a GUI mouse action where the user clicks and holds an item (such as a document or folder), moves the mouse cursor to a new destination folder or drive, and releases the mouse button to move or copy the item.", marks_awarded: 2, ai_reasoning: "Accurate explanation of mouse interaction and file directory relocation." },
      { question_id: "dl1_a10", answer: "1. Acceptable Use Policy (AUP): Dictates allowable computing and internet conduct, banning unauthorized downloads. 2. Data Protection & Password Policy: Requires strong passwords, confidential handling of company data, and locking screens when leaving workstations.", marks_awarded: 3, ai_reasoning: "Two critical workplace governance policies articulated clearly." },
    ],
    section_b: [
      { question_id: "dl1_b11", answer: "a) Word processor creates, edits, formats, and prints rich documents. Differentiated by WYSIWYG text styling and support for tables and graphics.\nb) Newsletter formatting: Multi-column layout, drop cap on opening story, callout quote boxes with borders, and clear heading hierarchy.\nc) i. CTRL+Z: Undo last action. ii. CTRL+X: Cut selected content to clipboard. iii. CTRL+V: Paste content from clipboard.\nd) Differences: 1. Computer is programmable for diverse tasks while calculator performs fixed arithmetic. 2. Computer has large secondary storage (SSD/HDD) while calculator has minimal memory. 3. Computer supports varied peripherals while calculator has fixed numeric keypad.", marks_awarded: 19, ai_reasoning: "Outstanding depth across all sub-parts with thorough technical descriptions." },
      { question_id: "dl1_b12", answer: "a) Insert table: Insert tab > Table > choose Quick Tables or drag grid for required rows/columns. Enter sales headers and numbers.\nb) Save & Print: File > Save As > select mapped network drive > Save. File > Print > Settings > Custom Print Pages: 1 > Print.\nc) Budget components: 1. Cells with coordinate addresses (e.g. A1, B5). 2. Formulas like =SUM() and =AVERAGE(). 3. Row and column headers. 4. Multiple worksheet tabs.\nd) Safety measures: 1. Keep food and drinks out of computer lab. 2. Use surge protectors and cable trunking. 3. Antivirus protection and restricted physical access.", marks_awarded: 18, ai_reasoning: "Strong procedural knowledge across word tables, spreadsheets, and lab precautions." },
    ],
    status: "graded",
    total_score: 64,
    trainer_comments: "The candidate demonstrates exceptional competence in digital literacy principles, practical workplace computer procedures, and software applications.",
    created_at: "2026-10-04T09:30:00Z",
  },
  {
    id: "sub-harriet-061155101A",
    unit_code: "061155101A-WA1",
    student_name: "Harriet Mwendwa",
    reg_number: "D/UPNUT/25042/069",
    section_a: [
      { question_id: "dl1_a1", answer: "Digital literacy is the ability to use digital tools safely and effectively to enhance workplace productivity.", marks_awarded: 2, ai_reasoning: "Accurately articulates digital technology application and workplace efficiency." },
      { question_id: "dl1_a2", answer: "Input: Keyboard and Mouse. Output: Monitor and Printer.", marks_awarded: 4, ai_reasoning: "All required input and output hardware devices correctly listed." },
      { question_id: "dl1_a3", answer: "1. Save all open work. 2. Close running applications. 3. Click Start > Power > Shut Down.", marks_awarded: 2, ai_reasoning: "Core sequence adheres to standard institutional shutdown procedure." },
      { question_id: "dl1_a4", answer: "1. Touch typing on home row keys. 2. Using keyboard shortcuts like Ctrl+C and Ctrl+V.", marks_awarded: 2, ai_reasoning: "Valid keyboard techniques identified." },
      { question_id: "dl1_a5", answer: "Right click desktop > New > Folder. Save report using Save As. In Save As dialog, click Tools > General Options to encrypt with password.", marks_awarded: 3, ai_reasoning: "Complete explanation covering folder creation, save, and password encryption." },
      { question_id: "dl1_a6", answer: "1. Hospitals for health records. 2. Banks for money transfer. 3. Schools for digital learning.", marks_awarded: 3, ai_reasoning: "Three common computing areas correctly stated." },
      { question_id: "dl1_a7", answer: "Connect HDMI cable between laptop and projector. Press Windows Key + P and choose Duplicate. Adjust projector lens focus.", marks_awarded: 3, ai_reasoning: "Accurate physical and display projection procedure." },
      { question_id: "dl1_a8", answer: "System software manages hardware (e.g. Windows 11). Application software is for user tasks (e.g. MS Word).", marks_awarded: 4, ai_reasoning: "Clear software distinction with two valid examples." },
      { question_id: "dl1_a9", answer: "Click and hold an icon, drag it to target folder, release mouse button to drop.", marks_awarded: 2, ai_reasoning: "Correct definition of GUI drag-and-drop file relocation." },
      { question_id: "dl1_a10", answer: "1. Acceptable use policy. 2. Password security policy requiring screen locks.", marks_awarded: 3, ai_reasoning: "Two appropriate workplace policies stated." },
    ],
    section_b: [
      { question_id: "dl1_b11", answer: "a) A word processing application creates and formats text documents. Differentiated by formatting styles and tables.\nb) Columns layout, drop caps, callout borders, styled headings.\nc) Ctrl+Z undoes, Ctrl+X cuts, Ctrl+V pastes.\nd) Computer has large memory and is programmable; calculator has fixed keypad.", marks_awarded: 18, ai_reasoning: "Good core grasp of word processing, shortcuts, and computational device architecture." },
      { question_id: "dl1_b12", answer: "a) Insert tab > Table > select grid dimensions. Enter data.\nb) File > Save As, choose network drive. File > Print > Pages 1.\nc) Cells, formulas (=SUM), headers, sheets.\nd) Keep liquids away, manage cables, power off before servicing.", marks_awarded: 18, ai_reasoning: "Table, spreadsheet operations, and lab precautions well articulated." },
    ],
    status: "graded",
    total_score: 64,
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
      { question_id: "b1", answer: "a) Hardware diagnostic techniques: safe AC disconnection, POST beep/LED observation, RAM reseating, and PSU rail voltage verification with digital multimeter.\nb) T568B cabling: strip jacket, arrange White/Orange, Orange, White/Green, Blue, White/Blue, Green, White/Brown, Brown, crimp RJ-45, and test pins 1-8 continuity.", marks_awarded: 26, ai_reasoning: "Thorough hardware diagnostic and T568B termination steps." },
      { question_id: "b2", answer: "a) Operating system configuration: departmental file hierarchy creation, Device Manager driver rollback, Task Manager startup diagnostics, and service optimization.\nb) TCP/IP troubleshooting: verify IP with ipconfig /all, ping loopback 127.0.0.1 and default gateway, run tracert, and flush DNS resolver cache.", marks_awarded: 28, ai_reasoning: "Comprehensive OS driver and command-line network diagnostic workflow." },
    ],
    status: "graded",
    total_score: 94,
    trainer_comments: "Distinction performance across both objective networking theory and structured system diagnostics.",
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
      { question_id: "b1", answer: "a) Peripheral connection procedures and ESD wrist strap precautions prior to motherboard and RAM handling.\nb) Straight-through T568B colour arrangement and RJ-45 crimping verification.", marks_awarded: 20, ai_reasoning: "Good ESD and cabling steps; omitted multimeter voltage rails." },
      { question_id: "b3", answer: "a) File system comparison between NTFS and FAT32: NTFS supports ACL permissions, encryption, and large volumes.\nb) Preventive maintenance using chkdsk /f and sfc /scannow.", marks_awarded: 18, ai_reasoning: "Solid NTFS vs FAT32 comparison and disk maintenance commands." },
    ],
    status: "graded",
    total_score: 72,
    trainer_comments: "Credit performance. Review Class C subnet masks and T568B pin 1-2 color ordering.",
    created_at: "2026-10-04T10:45:00Z",
  },
  {
    id: "sub-003",
    unit_code: "IT/CU/ICTA/CR/01/4/MA",
    student_name: "Wanjau Alvin Gatere",
    reg_number: "14076/S2026",
    section_a: [
      { question_id: "q_ess_1", answer: "Identified HDMI, USB 3.0 Type-A, RJ-45 Ethernet, Audio TRS jack, and VGA ports on rear I/O panel; located CR2032 CMOS battery on motherboard.", marks_awarded: 14, ai_reasoning: "All 5 external ports and CMOS coin-cell battery accurately identified." },
      { question_id: "q_ess_2", answer: "Launched Device Manager (devmgmt.msc), expanded Keyboards and Mice/Pointing devices, and verified signed WHQL driver status.", marks_awarded: 14, ai_reasoning: "Proper driver status inspection demonstrated." },
      { question_id: "q_ess_3", answer: "RAM is volatile working memory while ROM is non-volatile firmware storage. SSD uses NAND flash with no moving parts while HDD uses spinning magnetic platters.", marks_awarded: 18, ai_reasoning: "Clear oral differentiation of primary and secondary storage." },
    ],
    section_b: [
      { question_id: "q_ess_4", answer: "Created nested department folders on desktop and compressed directory into .7z archive with AES-256 password protection using 7-Zip.", marks_awarded: 22, ai_reasoning: "Folder hierarchy and 7-Zip archive created accurately." },
      { question_id: "q_ess_5", answer: "Uninstalled legacy utility via Settings > Installed Apps and configured Adobe Acrobat / Edge as default .pdf handler in Default Apps.", marks_awarded: 21, ai_reasoning: "Clean uninstallation and file association configuration." },
    ],
    status: "graded",
    total_score: 89,
    trainer_comments: "Excellent practical mastery of computer essentials, hardware port identification, and OS configuration.",
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
      { question_id: "b1", answer: "a) Checked power cable and reseated RAM modules during POST check.\nb) Arranged twisted pair wires according to T568B color standard and crimped RJ-45 connector.", marks_awarded: 15, ai_reasoning: "Basic steps covered; needs deeper POST voltage and continuity testing detail." },
      { question_id: "b2", answer: "a) Checked Device Manager for yellow exclamation marks on network adapters.\nb) Used ipconfig and ping to test gateway connectivity.", marks_awarded: 10, ai_reasoning: "Partial command-line diagnostic explanation." },
    ],
    status: "graded",
    total_score: 61,
    trainer_comments: "Competent pass. Needs additional practice on structured troubleshooting documentation.",
    created_at: "2026-10-04T11:15:00Z",
  },
  {
    id: "sub-005",
    unit_code: "061155101A-WA1",
    student_name: "Yvonne Mwende",
    reg_number: "13254",
    section_a: [
      { question_id: "dl1_a1", answer: "Digital literacy is the ability to find, evaluate, and compose clear information using digital devices. It boosts workplace efficiency and communication.", marks_awarded: 2, ai_reasoning: "Accurate definition and workplace importance." },
      { question_id: "dl1_a2", answer: "Input devices: Keyboard and Scanner. Output devices: Monitor and Laser Printer.", marks_awarded: 4, ai_reasoning: "Four valid professional peripherals identified." },
      { question_id: "dl1_a3", answer: "1. Save open files. 2. Close active applications. 3. Click Start > Power > Shut Down and wait for power off.", marks_awarded: 3, ai_reasoning: "Correct safe shutdown sequence." },
      { question_id: "dl1_a4", answer: "1. Touch typing from the home row keys. 2. Using keyboard shortcuts such as Ctrl+S, Ctrl+C, and Ctrl+V.", marks_awarded: 2, ai_reasoning: "Both typing efficiency techniques explained." },
      { question_id: "dl1_a5", answer: "Right-click > New > Folder. Use File > Save As to save the confidential report inside the folder, then enable password encryption under Tools > General Options.", marks_awarded: 4, ai_reasoning: "Complete folder creation, saving, and encryption steps." },
      { question_id: "dl1_a6", answer: "1. Banking (electronic transactions). 2. Healthcare (patient records). 3. Education (e-learning and grading).", marks_awarded: 3, ai_reasoning: "Three valid application sectors listed." },
      { question_id: "dl1_a7", answer: "Connect HDMI cable from laptop to projector, power on, press Win + P and select Duplicate, then adjust lens focus.", marks_awarded: 3, ai_reasoning: "Complete projector setup procedure." },
      { question_id: "dl1_a8", answer: "System software operates computer hardware (Windows 11, macOS). Application software performs specific user tasks (MS Word, MS Excel).", marks_awarded: 3, ai_reasoning: "Good distinction and examples." },
      { question_id: "dl1_a9", answer: "Clicking and holding the mouse button on a file, moving it to another folder, and releasing the button.", marks_awarded: 2, ai_reasoning: "Clear explanation of drag and drop." },
      { question_id: "dl1_a10", answer: "1. Acceptable Use Policy (AUP). 2. Organisational Data Protection & Password Policy.", marks_awarded: 2, ai_reasoning: "Two valid ICT workplace policies stated." },
    ],
    section_b: [
      { question_id: "dl1_b11", answer: "a) Word processors create, edit, format, and print text documents; they support rich typography and embedded tables unlike plain text editors.\nb) Multi-column layout, drop caps, page borders, and consistent heading styles.\nc) i. CTRL+Z: Undo last action. ii. CTRL+X: Cut selection. iii. CTRL+V: Paste clipboard content.\nd) Computers are general-purpose programmable systems with large secondary storage and diverse peripherals, whereas calculators perform fixed arithmetic.", marks_awarded: 18, ai_reasoning: "Well-structured answers across all four sub-parts." },
      { question_id: "dl1_b12", answer: "a) Go to Insert > Table > select grid size or Quick Tables and enter monthly sales figures.\nb) Click File > Save As > select network drive. For printing, click File > Print and set Pages to 1.\nc) Cells, rows/columns, mathematical formulas (=SUM), and worksheet tabs.\nd) Prohibit food/drinks, install UPS surge protection, and enforce antivirus/access controls.", marks_awarded: 17, ai_reasoning: "Clear practical steps for Word tables, Excel printing, and lab safety." },
    ],
    status: "graded",
    total_score: 63,
    trainer_comments: "Distinction performance. Strong grasp of digital literacy concepts and office application workflows.",
    created_at: "2026-10-04T11:30:00Z",
  },
  {
    id: "sub-006",
    unit_code: "061155101A-WA1",
    student_name: "Muoki Muthoki",
    reg_number: "13263",
    section_a: [
      { question_id: "dl1_a1", answer: "Digital literacy is using computers and digital tools effectively to perform office tasks and communicate at work.", marks_awarded: 2, ai_reasoning: "Clear definition and workplace context." },
      { question_id: "dl1_a2", answer: "Input: Keyboard, Mouse. Output: Monitor, Printer.", marks_awarded: 4, ai_reasoning: "Correct input and output peripherals." },
      { question_id: "dl1_a3", answer: "Save open documents, close programs, click Start > Power > Shut down.", marks_awarded: 2, ai_reasoning: "Good shutdown sequence; omitted waiting for system unit power-off before wall switch." },
      { question_id: "dl1_a4", answer: "Touch typing on home row keys and using Ctrl+C / Ctrl+V shortcuts.", marks_awarded: 2, ai_reasoning: "Correct typing techniques." },
      { question_id: "dl1_a5", answer: "Create a new folder on desktop, save the file into it using Save As, and set a document open password.", marks_awarded: 3, ai_reasoning: "Covered folder creation, saving, and password setting." },
      { question_id: "dl1_a6", answer: "Hospitals, Banks, and Technical Training Institutes.", marks_awarded: 2, ai_reasoning: "Listed three sectors; brief on specific application roles." },
      { question_id: "dl1_a7", answer: "Plug in HDMI cable to projector, press Windows + P, and select Duplicate.", marks_awarded: 2, ai_reasoning: "Correct cable and shortcut; omitted focus calibration." },
      { question_id: "dl1_a8", answer: "System software runs the computer (Windows, Linux). Application software handles user work (Word, Excel).", marks_awarded: 3, ai_reasoning: "Valid distinction and examples." },
      { question_id: "dl1_a9", answer: "Selecting a file with the mouse, dragging it into another folder, and releasing the button.", marks_awarded: 2, ai_reasoning: "Accurate GUI drag-and-drop description." },
      { question_id: "dl1_a10", answer: "Password security policy and internet acceptable use policy.", marks_awarded: 2, ai_reasoning: "Identified two policies." },
    ],
    section_b: [
      { question_id: "dl1_b11", answer: "a) Word processor is used to type and format documents; features include font styling and tables.\nb) Columns, bold headings, images, and page borders.\nc) i. CTRL+Z undoes an action. ii. CTRL+X cuts text. iii. CTRL+V pastes text.\nd) Computers store large files and run many applications while calculators only compute numbers.", marks_awarded: 16, ai_reasoning: "Good coverage of word processing and shortcut keys." },
      { question_id: "dl1_b12", answer: "a) Click Insert > Table and choose rows and columns for the sales data.\nb) Save As to the shared network drive, then File > Print > Page 1.\nc) Rows, columns, cells, and =SUM formulas.\nd) Avoid liquids near computers, use surge protectors, and lock the lab.", marks_awarded: 16, ai_reasoning: "Solid practical explanation across all four sub-parts." },
    ],
    status: "graded",
    total_score: 56,
    trainer_comments: "Competent performance (80%). Good practical understanding of workplace computer operations.",
    created_at: "2026-10-04T12:00:00Z",
  },
  {
    id: "sub-007",
    unit_code: "061155101A-WA1",
    student_name: "Vick Mutembei",
    reg_number: "14009",
    section_a: [
      { question_id: "dl1_a1", answer: "Digital literacy means knowing how to operate computers and software in the workplace.", marks_awarded: 1, ai_reasoning: "Basic definition provided; expand on information evaluation and workplace benefit." },
      { question_id: "dl1_a2", answer: "Input: Keyboard and Mouse. Output: Monitor and Projector.", marks_awarded: 4, ai_reasoning: "Correctly identified two input and two output devices." },
      { question_id: "dl1_a3", answer: "Close all programs and click Start > Shut down.", marks_awarded: 2, ai_reasoning: "Omitted saving active work before closing applications." },
      { question_id: "dl1_a4", answer: "Using both hands on home keys and shortcut keys.", marks_awarded: 2, ai_reasoning: "Valid points." },
      { question_id: "dl1_a5", answer: "Create folder > Save As into folder > add password in Word options.", marks_awarded: 3, ai_reasoning: "Good procedural outline." },
      { question_id: "dl1_a6", answer: "Schools, hospitals, and offices.", marks_awarded: 2, ai_reasoning: "Valid areas identified." },
      { question_id: "dl1_a7", answer: "Connect HDMI cable and press Windows + P to duplicate screen.", marks_awarded: 2, ai_reasoning: "Core steps stated." },
      { question_id: "dl1_a8", answer: "System software is Windows; Application software is MS Word and Excel.", marks_awarded: 2, ai_reasoning: "Examples given; needs clearer functional distinction." },
      { question_id: "dl1_a9", answer: "Moving a file from one folder to another using the mouse.", marks_awarded: 1, ai_reasoning: "Brief explanation." },
      { question_id: "dl1_a10", answer: "Acceptable use policy and data privacy rules.", marks_awarded: 2, ai_reasoning: "Two workplace rules mentioned." },
    ],
    section_b: [
      { question_id: "dl1_b11", answer: "a) Word processors format text documents and allow inserting tables and pictures.\nb) Multi-columns, headings, bullet lists, and borders.\nc) CTRL+Z: Undo, CTRL+X: Cut, CTRL+V: Paste.\nd) Computers run multiple software programs and have hard disk storage unlike calculators.", marks_awarded: 14, ai_reasoning: "Satisfactory responses on word processing and shortcuts." },
      { question_id: "dl1_b13", answer: "a) Formula is written manually like =A1+B1; Function is built-in like =SUM(A1:B1).\nb) Select customer column > Data tab > Sort A to Z.\nc) Use clear section headings, bullet points, consistent fonts, and export as PDF.\nd) Check hardware compatibility, licensing cost, security updates, and ease of use.", marks_awarded: 14, ai_reasoning: "Good attempt on Question 13 covering spreadsheets, CV formatting, and OS procurement." },
    ],
    status: "graded",
    total_score: 49,
    trainer_comments: "Competent (Credit — 70%). Review detailed step-by-step explanations in Section A.",
    created_at: "2026-10-05T09:00:00Z",
  },
  {
    id: "sub-risper-0415",
    unit_code: "0415-451-21A-WA1",
    student_name: "RISPER MWENDE",
    reg_number: "13410",
    student_email: "risper.mwende@mtti.ac.ke",
    section_a: [
      { question_id: "wa1_a1", answer: "An operating system is system software that manages computer hardware, software resources, and provides common services for computer programs.", marks_awarded: 2, ai_reasoning: "Accurate definition provided." },
      { question_id: "wa1_a2", answer: "Create: Right-click > New > Folder > Type name. Rename: Right-click folder > Rename > Type new name. Delete: Right-click folder > Delete.", marks_awarded: 6, ai_reasoning: "Complete step-by-step folder operations." },
      { question_id: "wa1_a3", answer: "1. Ribbon / Tabs, 2. Quick Access Toolbar, 3. Status Bar.", marks_awarded: 3, ai_reasoning: "Three MS Word interface components correctly listed." },
      { question_id: "wa1_a4", answer: "a) Save updates current file; Save As saves under a new name/location. b) Workbook is the Excel file; Worksheet is a single grid tab. c) File is a document; Folder is a directory container.", marks_awarded: 5, ai_reasoning: "Clear distinction across all three pairs." },
      { question_id: "wa1_a5", answer: "Left alignment, Center alignment, and Justified alignment.", marks_awarded: 3, ai_reasoning: "Three text alignment modes explained." },
      { question_id: "wa1_a6", answer: "a) Click and drag across cells. b) Right-click row/column header > Insert. c) Select data > Data tab > Sort A-Z.", marks_awarded: 5, ai_reasoning: "Accurate Excel procedures." },
      { question_id: "wa1_a7", answer: "Worksheet functions are built-in Excel formulas such as =SUM(B2:B10) and =AVERAGE(C2:C10).", marks_awarded: 3, ai_reasoning: "Clear definition and formula example." },
      { question_id: "wa1_a8", answer: "Select object on slide > click Animations tab > choose animation effect > configure timing.", marks_awarded: 3, ai_reasoning: "Valid presentation animation steps." },
      { question_id: "wa1_a9", answer: "a) Computer network: interconnected devices sharing resources. b) Internet: global network of networks. c) WWW: collection of web pages accessed via HTTP.", marks_awarded: 5, ai_reasoning: "Well defined networking terms." },
    ],
    section_b: [
      { question_id: "wa1_b1", answer: "a) Strengths of MS Word: Spell checker, Mail merge, Table formatting, Templates, and Graphics integration.\nb) Animation: movement on slide objects; Transition: visual effect between slides; Slide: single presentation page; Presentation: collection of slides; PowerPoint: presentation software.", marks_awarded: 16, ai_reasoning: "Thorough breakdown of Word strengths and PowerPoint terminology." },
      { question_id: "wa1_b2", answer: "a) #DIV/0! (divide by zero), #VALUE! (wrong data type), #REF! (deleted cell reference), #NAME? (misspelled function), #N/A (value not found).\nb) i. =D5*2% ii. =C5+E5 iii. =SUM(F5:F10), =AVERAGE(F5:F10), =MAX(F5:F10), =MIN(F5:F10), =COUNT(A5:A10).", marks_awarded: 15, ai_reasoning: "Accurate Excel error definitions and sales formulas." },
      { question_id: "wa1_b4", answer: "a) Internet services: Email, Cloud storage, WWW research, Video conferencing, and E-commerce.\nb) LAN benefits: Printer sharing, centralized file backup, fast internal communication, lower software licensing cost, and centralized security.", marks_awarded: 12, ai_reasoning: "Good discussion of internet services and institutional LAN benefits." },
    ],
    status: "graded",
    total_score: 78,
    trainer_comments: "Credit / Distinction borderline. Excellent procedural understanding of Office applications and networking.",
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
      { question_id: "wa1_a2", answer: "Right-click > New > Folder; Right-click > Rename; Right-click > Delete.", marks_awarded: 5 },
      { question_id: "wa1_a3", answer: "Ribbon, Quick Access Toolbar, Document Area.", marks_awarded: 3 },
    ],
    section_b: [
      { question_id: "wa1_b1", answer: "a) Easy editing, spell check, mail merge, tables, and page layout.\nb) Slide is a single page; Transition is slide change effect; Animation is object motion.", marks_awarded: 14 },
    ],
    status: "pending",
    total_score: null,
    created_at: "2026-10-04T21:00:00Z",
  },
];


