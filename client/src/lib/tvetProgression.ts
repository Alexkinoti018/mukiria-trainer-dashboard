/**
 * tvetProgression.ts
 *
 * Official TVET ICT Modularized Progression Model
 * Republic of Kenya — Ministry of Education
 * State Department for Technical, Vocational Education and Training (TVET)
 * CDACC Competency-Based Education and Training (CBET)
 */

export type TVETLevel = 'LEVEL_3' | 'LEVEL_4' | 'LEVEL_5' | 'LEVEL_6';

export interface TVETLevelConfig {
  code: TVETLevel;
  name: string;
  qualification: string;
  nominalHoursRange: {
    min: number;
    max: number;
    display: string;
  };
  modules: number[]; // e.g. [1, 2]
  attachmentPoints: string[]; // e.g. ["Post-Module 2"]
}

export interface TVETProgressionUnit {
  title: string;
  codeAliases?: string[];
  canonicalCode?: string;
  nominalHours: number;
  description: string;
}

export interface TVETModuleConfig {
  moduleNumber: number;
  title: string;
  subtitle: string;
  levelsApplicable: TVETLevel[];
  units: TVETProgressionUnit[];
  hasIndustrialAttachmentAfter?: boolean;
  attachmentTitle?: string;
}

export const TVET_LEVELS: Record<TVETLevel, TVETLevelConfig> = {
  LEVEL_3: {
    code: 'LEVEL_3',
    name: 'Level 3',
    qualification: 'Basic Certificate',
    nominalHoursRange: { min: 300, max: 599, display: '300-599 HRS' },
    modules: [1],
    attachmentPoints: ['Industrial Training (Post-Module 1)'],
  },
  LEVEL_4: {
    code: 'LEVEL_4',
    name: 'Level 4 (Artisan)',
    qualification: 'National Artisan Certificate in ICT',
    nominalHoursRange: { min: 600, max: 1199, display: '600-1199 HRS' },
    modules: [1, 2],
    attachmentPoints: ['Industrial Training (Post-Module 2 Exit Gate)'],
  },
  LEVEL_5: {
    code: 'LEVEL_5',
    name: 'Level 5 (Craft)',
    qualification: 'National Craft Certificate in ICT',
    nominalHoursRange: { min: 1200, max: 2399, display: '1200-2399 HRS' },
    modules: [1, 2, 3, 4],
    attachmentPoints: ['Industrial Training (Post-Module 4 Exit Gate)'],
  },
  LEVEL_6: {
    code: 'LEVEL_6',
    name: 'Level 6 (Diploma)',
    qualification: 'National Diploma in ICT / ICT Technician',
    nominalHoursRange: { min: 2400, max: 4799, display: '2400-4799 HRS' },
    modules: [1, 2, 3, 4, 5, 6, 7],
    attachmentPoints: [
      'Interim Industrial Training (Post-Module 4)',
      'Final Industrial Training (Post-Module 7 Exit Gate)',
    ],
  },
};

export const TVET_MODULES: TVETModuleConfig[] = [
  {
    moduleNumber: 1,
    title: 'Module 1',
    subtitle: 'Computing Foundation & Operations',
    levelsApplicable: ['LEVEL_3', 'LEVEL_4', 'LEVEL_5', 'LEVEL_6'],
    units: [
      {
        title: 'Computer Essentials',
        codeAliases: ['IT/CU/ICTA/CR/01/4/MA', 'IT/CU/ICTA/CR/01/5/MA', '0415 451 12A', '0611 441 02B'],
        canonicalCode: 'IT/CU/ICTA/CR/01/4/MA',
        nominalHours: 120,
        description: 'Managing computer devices, operating peripheral ports, system setup, and basic security.',
      },
      {
        title: 'Computer Operations',
        codeAliases: ['IT/CU/ICTA/CR/02/4/MA', 'IT/CU/ICTA/CR/02/5/MA'],
        canonicalCode: 'IT/CU/ICTA/CR/02/4/MA',
        nominalHours: 120,
        description: 'Office productivity suites, word processing, spreadsheets, presentation, and data management.',
      },
    ],
    hasIndustrialAttachmentAfter: true,
    attachmentTitle: 'Level 3 Industrial Training (300-599 hrs exit)',
  },
  {
    moduleNumber: 2,
    title: 'Module 2',
    subtitle: 'Hardware, Network Setup & Maintenance',
    levelsApplicable: ['LEVEL_4', 'LEVEL_5', 'LEVEL_6'],
    units: [
      {
        title: 'Computer Network Setup',
        codeAliases: ['IT/CU/ICTA/CR/03/4/MA', 'IT/CU/ICTA/CR/03/5/MA'],
        canonicalCode: 'IT/CU/ICTA/CR/03/4/MA',
        nominalHours: 140,
        description: 'LAN cabling, TCP/IP address configuration, router/switch setup, and network resource sharing.',
      },
      {
        title: 'Computer Repair and Maintenance',
        codeAliases: ['ICT/CU/ICTA/CC/02/4/A', 'IT/CU/ICTA/CR/04/4/MA'],
        canonicalCode: 'ICT/CU/ICTA/CC/02/4/A',
        nominalHours: 140,
        description: 'Troubleshooting hardware faults, disassembling/reassembling system units, component replacement, and maintenance reporting.',
      },
    ],
    hasIndustrialAttachmentAfter: true,
    attachmentTitle: 'Level 4 Artisan Industrial Training (600-1199 hrs exit)',
  },
  {
    moduleNumber: 3,
    title: 'Module 3',
    subtitle: 'Electronics, Software Deployment & Ethics',
    levelsApplicable: ['LEVEL_5', 'LEVEL_6'],
    units: [
      {
        title: 'Basic Electronics',
        codeAliases: ['0611 441 02B', 'EE5/S/25A'],
        canonicalCode: '0611 441 02B',
        nominalHours: 80,
        description: 'Electronic components, circuit analysis, power supply testing, multimeters, and soldering.',
      },
      {
        title: 'Computer Software',
        codeAliases: ['IT/OS/ICTA/CR/01/5/MA', 'IT/CU/ICTA/CR/01/5/MA'],
        canonicalCode: 'IT/OS/ICTA/CR/01/5/MA',
        nominalHours: 120,
        description: 'Operating systems installation, software licensing, application deployment, patch updates, and system virtualization.',
      },
      {
        title: 'Work Ethics and Practices',
        codeAliases: ['IT/OS/ICTA/BC/02/5/MA'],
        canonicalCode: 'IT/OS/ICTA/BC/02/5/MA',
        nominalHours: 60,
        description: 'Professional workplace standards, confidential data handling, professional accountability, and team collaboration.',
      },
      {
        title: 'Network Design and Management',
        codeAliases: ['IT/CU/ICT/CR/4/6'],
        canonicalCode: 'IT/CU/ICT/CR/4/6',
        nominalHours: 120,
        description: 'Campus network topology design, VLAN routing, network security policies, and performance monitoring.',
      },
    ],
  },
  {
    moduleNumber: 4,
    title: 'Module 4',
    subtitle: 'Programming, Databases & Enterprise Skills',
    levelsApplicable: ['LEVEL_5', 'LEVEL_6'],
    units: [
      {
        title: 'Computer Programming Principles',
        codeAliases: ['0611 351 01A', 'IT/CU/ICTA/CR/05/5/MA'],
        canonicalCode: '0611 351 01A',
        nominalHours: 160,
        description: 'Algorithm design, procedural & object-oriented programming (OOP), data structures, debugging, and code compilation.',
      },
      {
        title: 'Computerized Database Systems',
        codeAliases: ['IT/CU/ICT/CR/3/6'],
        canonicalCode: 'IT/CU/ICT/CR/3/6',
        nominalHours: 140,
        description: 'Relational database schema modeling, SQL DDL/DML, normalization, indexing, and backup administration.',
      },
      {
        title: 'Communication Skills',
        codeAliases: ['IT/BC/01/6/A', 'ADM/BC/01/6/A'],
        canonicalCode: 'IT/BC/01/6/A',
        nominalHours: 40,
        description: 'Technical writing, client requirements interviewing, technical presentation, and official correspondence.',
      },
      {
        title: 'Entrepreneurial Skills',
        codeAliases: ['IT/BC/03/6/A', 'ENT/BC/01/6/A'],
        canonicalCode: 'IT/BC/03/6/A',
        nominalHours: 60,
        description: 'ICT business plan drafting, market appraisal, budgeting, tax compliance, and tech startup management.',
      },
    ],
    hasIndustrialAttachmentAfter: true,
    attachmentTitle: 'Level 5 Craft Industrial Training (1200-2399 hrs exit) / Level 6 Interim Attachment',
  },
  {
    moduleNumber: 5,
    title: 'Module 5',
    subtitle: 'Advanced Systems, Discrete Math & Web Engineering',
    levelsApplicable: ['LEVEL_6'],
    units: [
      {
        title: 'Discrete Mathematical Concepts',
        codeAliases: ['IT/CU/ICT/CR/1/6'],
        canonicalCode: 'IT/CU/ICT/CR/1/6',
        nominalHours: 80,
        description: 'Set theory, boolean algebra, logic gates, graph theory, combinatorics, and discrete structures in computing.',
      },
      {
        title: 'System Analysis and Design',
        codeAliases: ['IT/CU/ICT/CR/2/6'],
        canonicalCode: 'IT/CU/ICT/CR/2/6',
        nominalHours: 120,
        description: 'SDLC methodologies (Agile/Waterfall), UML modeling, architectural diagrams, feasibility study, and UX wireframing.',
      },
      {
        title: 'Website Application',
        codeAliases: ['IT/CU/ICT/CR/5/6'],
        canonicalCode: 'IT/CU/ICT/CR/5/6',
        nominalHours: 160,
        description: 'Client-side & server-side web engineering, HTML/CSS/JS, PHP/Node, database integration, domain registration, and hosting deployment.',
      },
    ],
  },
  {
    moduleNumber: 6,
    title: 'Module 6',
    subtitle: 'ICT Security & Desktop Applications',
    levelsApplicable: ['LEVEL_6'],
    units: [
      {
        title: 'ICT Security',
        codeAliases: ['IT/CU/ICT/CR/6/6'],
        canonicalCode: 'IT/CU/ICT/CR/6/6',
        nominalHours: 120,
        description: 'Threat identification, cryptographic algorithms, access controls, firewalls, threat mitigation, and penetration testing fundamentals.',
      },
      {
        title: 'Desktop Application',
        codeAliases: ['IT/CU/ICT/CR/7/6'],
        canonicalCode: 'IT/CU/ICT/CR/7/6',
        nominalHours: 140,
        description: 'GUI desktop application engineering, event-driven architecture, API integration, and packaged installer distribution.',
      },
    ],
  },
  {
    moduleNumber: 7,
    title: 'Module 7',
    subtitle: 'Advanced Security, Systems Management & Capstone',
    levelsApplicable: ['LEVEL_6'],
    units: [
      {
        title: 'ICT Security (Enterprise)',
        codeAliases: ['IT/CU/ICT/CR/6/6B'],
        canonicalCode: 'IT/CU/ICT/CR/6/6B',
        nominalHours: 100,
        description: 'Enterprise security auditing, incident response, disaster recovery protocols, and regulatory compliance (ISO/IEC 27001).',
      },
      {
        title: 'Desktop Application & Management',
        codeAliases: ['IT/OS/ICT/CR/8/6'],
        canonicalCode: 'IT/OS/ICT/CR/8/6',
        nominalHours: 140,
        description: 'Enterprise information system administration, workflow integration, MIS database maintenance, and technical audit reporting.',
      },
    ],
    hasIndustrialAttachmentAfter: true,
    attachmentTitle: 'Level 6 Diploma Final Industrial Training (2400-4799 hrs Diploma Exit)',
  },
];

/**
 * Normalizes title or code to find corresponding TVET Module (1 to 7)
 */
export function resolveTVETModuleForUnit(
  unitCodeOrTitle: string
): { moduleNumber: number; module: TVETModuleConfig; matchedUnit: TVETProgressionUnit } | undefined {
  if (!unitCodeOrTitle) return undefined;
  const clean = unitCodeOrTitle.trim().toUpperCase();

  for (const mod of TVET_MODULES) {
    for (const u of mod.units) {
      if (u.title.toUpperCase() === clean || clean.includes(u.title.toUpperCase())) {
        return { moduleNumber: mod.moduleNumber, module: mod, matchedUnit: u };
      }
      if (u.canonicalCode && (u.canonicalCode.toUpperCase() === clean || clean.includes(u.canonicalCode.toUpperCase()))) {
        return { moduleNumber: mod.moduleNumber, module: mod, matchedUnit: u };
      }
      if (u.codeAliases) {
        for (const alias of u.codeAliases) {
          const cleanAlias = alias.replace(/\s+/g, '').toUpperCase();
          const cleanInput = clean.replace(/\s+/g, '');
          if (cleanInput === cleanAlias || cleanInput.includes(cleanAlias) || cleanAlias.includes(cleanInput)) {
            return { moduleNumber: mod.moduleNumber, module: mod, matchedUnit: u };
          }
        }
      }
    }
  }

  // Keyword fallbacks
  if (clean.includes('OPERATION') || clean.includes('ESSENTIAL') || clean.includes('DIGITAL LIT') || clean.includes('ICT SKILL')) {
    return { moduleNumber: 1, module: TVET_MODULES[0], matchedUnit: TVET_MODULES[0].units[0] };
  }
  if (clean.includes('REPAIR') || clean.includes('MAINTENANCE') || clean.includes('NETWORK SETUP')) {
    return { moduleNumber: 2, module: TVET_MODULES[1], matchedUnit: TVET_MODULES[1].units[1] };
  }
  if (clean.includes('ETHIC') || clean.includes('SOFTWARE') || clean.includes('ELECTRONIC')) {
    return { moduleNumber: 3, module: TVET_MODULES[2], matchedUnit: TVET_MODULES[2].units[1] };
  }
  if (clean.includes('PROGRAMMING') || clean.includes('DATABASE') || clean.includes('COMMUNICATION') || clean.includes('ENTREPRENEUR')) {
    return { moduleNumber: 4, module: TVET_MODULES[3], matchedUnit: TVET_MODULES[3].units[0] };
  }
  if (clean.includes('WEBSITE') || clean.includes('SYSTEM ANALYSIS') || clean.includes('DISCRETE')) {
    return { moduleNumber: 5, module: TVET_MODULES[4], matchedUnit: TVET_MODULES[4].units[2] };
  }
  if (clean.includes('SECURITY') || clean.includes('DESKTOP')) {
    return { moduleNumber: 6, module: TVET_MODULES[5], matchedUnit: TVET_MODULES[5].units[0] };
  }
  if (clean.includes('MANAGE INFORMATION') || clean.includes('MIS')) {
    return { moduleNumber: 7, module: TVET_MODULES[6], matchedUnit: TVET_MODULES[6].units[1] };
  }

  return undefined;
}
