import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { 
  generateSamplePracticalEvidencePDF, 
  generateSampleObservationImage, 
  calculateAverages, 
  calculateWeightedMark 
} from "@/lib/evidenceStorage";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { toast } from "sonner";

export interface Trainee {
  id: string;
  regCode: string;
  admNo: string;
  name: string;
  classCode: string;
  department?: string;
  gender?: "M" | "F";
  phone?: string;
  remarks?: string;
}

export interface Upload {
  id: string;
  traineeId: string;
  student_name: string;
  reg_number?: string;
  filename: string;
  uploadType: string;
  submitted_at: string;
  status: "pending" | "verified" | "graded";
  grade: number | null;
  comments: string;
  file_url?: string;
  file_data?: string;
  mime_type?: string;
  file_size?: number;
  task_code?: string; // "CP1", "CP2", "CP3", "CT1", "CT2", "CT3", "Project", "Assignment"
  unit_offering_id?: string;
  unit_code?: string;
  unit_title?: string;
  verified_by_trainer?: boolean;
  verified_at?: string | null;
  verified_by_name?: string | null;
}

interface TraineeContextType {
  trainees: Trainee[];
  uploads: Upload[];
  registerTrainee: (trainee: Omit<Trainee, "id">) => Trainee;
  addTrainee: (trainee: Omit<Trainee, "id">) => Trainee;
  updateTrainee: (id: string, updates: Partial<Trainee>) => void;
  deleteTrainee: (id: string) => void;
  recordUpload: (upload: Partial<Upload> & Pick<Upload, "traineeId" | "student_name" | "filename" | "uploadType">) => void;
  updateUploadGrade: (uploadId: string, grade: number, comments: string) => void;
  verifyUpload: (uploadId: string, trainerName?: string) => void;
  awardUploadMark: (uploadId: string, params: { grade: number; comments: string; taskCode: string; unitOfferingId?: string; trainerName?: string }) => void;
  deleteUpload: (uploadId: string, callerRole?: string) => boolean;
  resetToOfficialRoster: () => void;
}

// Official Trainees Transcribed from MTTI Institutional Registers (MTTI/REG/CUR/02 & CUR/03)
export const OFFICIAL_MTTI_TRAINEES: Trainee[] = [
  // 1. Single Combined Cohort: ICT4/ITECH6/S/26 MOD 1 (Perform Computer Essentials - Level 4 & 6, 19 Trainees)
  { id: "tr_it6_01", regCode: "ITECH 6 MOD/14179/S2026", admNo: "14179/S2026", name: "Nthiga Gakii Doris", classCode: "ITECH 6 MODULAR/S/2026", department: "Computing & Informatics" },
  { id: "tr_it6_02", regCode: "ITECH 6 MOD/14255/S2026", admNo: "14255/S2026", name: "Kaumbuthu Belinda Mukiri", classCode: "ITECH 6 MODULAR/S/2026", department: "Computing & Informatics" },
  { id: "tr_it6_03", regCode: "ITECH 6 MOD/14022/S2026", admNo: "14022/S2026", name: "Ltumwa Lesoipa", classCode: "ITECH 6 MODULAR/S/2026", department: "Computing & Informatics" },
  { id: "tr_it6_04", regCode: "ITECH 6 MOD/14077/S2026", admNo: "14077/S2026", name: "Kitheka Emmanuel Kioko", classCode: "ITECH 6 MODULAR/S/2026", department: "Computing & Informatics" },
  { id: "tr_it6_05", regCode: "ITECH 6 MOD/14102/S2026", admNo: "14102/S2026", name: "Felix Mugendi", classCode: "ITECH 6 MODULAR/S/2026", department: "Computing & Informatics" },
  { id: "tr_it6_06", regCode: "ITECH 6 MOD/14119/S2026", admNo: "14119/S2026", name: "Mwangi Clinton Njiru", classCode: "ITECH 6 MODULAR/S/2026", department: "Computing & Informatics" },
  { id: "tr_it6_07", regCode: "ITECH 6 MOD/14149/S2026", admNo: "14149/S2026", name: "Abigael Mukiri", classCode: "ITECH 6 MODULAR/S/2026", department: "Computing & Informatics" },
  { id: "tr_it6_08", regCode: "ITECH 6 MOD/14172/S2026", admNo: "14172/S2026", name: "Fiona Kadogo Mwika", classCode: "ITECH 6 MODULAR/S/2026", department: "Computing & Informatics" },
  { id: "tr_it6_09", regCode: "ITECH 6 MOD/14207/S2026", admNo: "14207/S2026", name: "Ann Mary Makena", classCode: "ITECH 6 MODULAR/S/2026", department: "Computing & Informatics" },
  { id: "tr_it6_10", regCode: "ITECH 6 MOD/14254/S2026", admNo: "14254/S2026", name: "Brenda Ngugi", classCode: "ITECH 6 MODULAR/S/2026", department: "Computing & Informatics" },
  { id: "tr_it6_11", regCode: "ITECH 6 MOD/14267/S2026", admNo: "14267/S2026", name: "Ingashia Favour Wawira", classCode: "ITECH 6 MODULAR/S/2026", department: "Computing & Informatics" },
  { id: "tr_it4_01", regCode: "ICT4 MOD/14076/S2026", admNo: "14076/S2026", name: "Wanjau Alvin Gatere", classCode: "ICT4 MOD/S/2026", department: "Computing & Informatics" },
  { id: "tr_it4_02", regCode: "ICT4 MOD/14107/S2026", admNo: "14107/S2026", name: "Ann Mukiri Matheta", classCode: "ICT4 MOD/S/2026", department: "Computing & Informatics" },
  { id: "tr_it4_03", regCode: "ICT4 MOD/14124/S2026", admNo: "14124/S2026", name: "Kimanthi Dennis Mwenda", classCode: "ICT4 MOD/S/2026", department: "Computing & Informatics" },
  { id: "tr_it4_04", regCode: "ICT4 MOD/14128/S2026", admNo: "14128/S2026", name: "Kimanthi Dennis Mwenda (II)", classCode: "ICT4 MOD/S/2026", department: "Computing & Informatics" },
  { id: "tr_it4_05", regCode: "ICT4 MOD/14211/S2026", admNo: "14211/S2026", name: "Guantai Brandon Mutua", classCode: "ICT4 MOD/S/2026", department: "Computing & Informatics" },
  { id: "tr_it4_06", regCode: "ICT4 MOD/14218/S2026", admNo: "14218/S2026", name: "Mwithia Mutharimi Nathan", classCode: "ICT4 MOD/S/2026", department: "Computing & Informatics" },
  { id: "tr_it4_07", regCode: "ICT4 MOD/14248/S2026", admNo: "14248/S2026", name: "Mbaabu Sarah Nkatha", classCode: "ICT4 MOD/S/2026", department: "Computing & Informatics" },
  { id: "tr_it4_08", regCode: "ICT4 MOD/14341/S2026", admNo: "14341/S2026", name: "Mutiria Hesborn Muriuki", classCode: "ICT4 MOD/S/2026", department: "Computing & Informatics" },

  // 2. ADMIN5/6/J/26 MOD 3 (Apply ICT Skills - Business Department, 11 Trainees)
  { id: "tr_adm_01", regCode: "13410", admNo: "13410", name: "RISPER MWENDE", classCode: "ADMIN5/6/J/26 MOD 3", department: "Business" },
  { id: "tr_adm_02", regCode: "13527", admNo: "13527", name: "Banta Micheni", classCode: "ADMIN5/6/J/26 MOD 3", department: "Business" },
  { id: "tr_adm_03", regCode: "12218", admNo: "12218", name: "Christine Gitonga", classCode: "ADMIN5/6/J/26 MOD 3", department: "Business" },
  { id: "tr_adm_04", regCode: "13252", admNo: "13252", name: "Cynthia Nkatha", classCode: "ADMIN5/6/J/26 MOD 3", department: "Business" },
  { id: "tr_adm_05", regCode: "13284", admNo: "13284", name: "Linet Ntinyari", classCode: "ADMIN5/6/J/26 MOD 3", department: "Business" },
  { id: "tr_adm_06", regCode: "13424", admNo: "13424", name: "Nanis Ngugi", classCode: "ADMIN5/6/J/26 MOD 3", department: "Business" },
  { id: "tr_adm_07", regCode: "13276", admNo: "13276", name: "Sharon Minoo", classCode: "ADMIN5/6/J/26 MOD 3", department: "Business" },
  { id: "tr_adm_08", regCode: "10203", admNo: "10203", name: "Frida Kianjira", classCode: "ADMIN5/6/J/26 MOD 3", department: "Business" },
  { id: "tr_adm_09", regCode: "12254", admNo: "12254", name: "Mercy Kiende", classCode: "ADMIN5/6/J/26 MOD 3", department: "Business" },
  { id: "tr_adm_10", regCode: "12665", admNo: "12665", name: "Ruth Kathure", classCode: "ADMIN5/6/J/26 MOD 3", department: "Business" },
  { id: "tr_adm_11", regCode: "13580", admNo: "13580", name: "MERCY KATHUURE", classCode: "ADMIN5/6/J/26 MOD 3", department: "Business" },

  // 3. FBS5/6/J/26 (Apply Digital Literacy - Hospitality Department, 26 Trainees)
  { id: "tr_fbs5_01", regCode: "FBS 5 MOD/13254/J2026", admNo: "13254", name: "Yvonne Mwende", classCode: "FBS 5 MOD/J/2026", department: "FBS Hospitality", gender: "F" },
  { id: "tr_fbs5_02", regCode: "FBS 5 MOD/13263/J2026", admNo: "13263", name: "Muoki Muthoki", classCode: "FBS 5 MOD/J/2026", department: "FBS Hospitality", gender: "F" },
  { id: "tr_fbs5_03", regCode: "FBS 5 MOD/13281/J2026", admNo: "13281", name: "Kibaara Peninah Gaichuiri", classCode: "FBS 5 MOD/J/2026", department: "FBS Hospitality", gender: "F" },
  { id: "tr_fbs5_04", regCode: "FBS 5 MOD/13297/J2026", admNo: "13297", name: "Hilda Mwede Njagi", classCode: "FBS 5 MOD/J/2026", department: "FBS Hospitality", gender: "F" },
  { id: "tr_fbs5_05", regCode: "FBS 5 MOD/13304/J2026", admNo: "13304", name: "Ndolo Shalom Mbithe", classCode: "FBS 5 MOD/J/2026", department: "FBS Hospitality", gender: "F" },
  { id: "tr_fbs5_06", regCode: "FBS 5 MOD/13313/J2026", admNo: "13313", name: "Mirriam Nzula", classCode: "FBS 5 MOD/J/2026", department: "FBS Hospitality", gender: "F" },
  { id: "tr_fbs5_07", regCode: "FBS 5 MOD/13343/J2026", admNo: "13343", name: "Waweru Hope Marion Makena", classCode: "FBS 5 MOD/J/2026", department: "FBS Hospitality", gender: "F" },
  { id: "tr_fbs5_08", regCode: "FBS 5 MOD/13355/J2026", admNo: "13355", name: "Ann Joy Makena", classCode: "FBS 5 MOD/J/2026", department: "FBS Hospitality", gender: "F" },
  { id: "tr_fbs5_09", regCode: "FBS 5 MOD/13378/J2026", admNo: "13378", name: "Martha Mwende Kyalo", classCode: "FBS 5 MOD/J/2026", department: "FBS Hospitality", gender: "F" },
  { id: "tr_fbs5_10", regCode: "FBS 5 MOD/13396/J2026", admNo: "13396", name: "John Opiyo Omondi", classCode: "FBS 5 MOD/J/2026", department: "FBS Hospitality", gender: "M" },
  { id: "tr_fbs5_11", regCode: "FBS 5 MOD/13445/J2026", admNo: "13445", name: "Eunice Kendi Nyaga", classCode: "FBS 5 MOD/J/2026", department: "FBS Hospitality", gender: "F" },
  { id: "tr_fbs5_12", regCode: "FBS 5 MOD/13446/J2026", admNo: "13446", name: "Miriko Rita", classCode: "FBS 5 MOD/J/2026", department: "FBS Hospitality", gender: "F" },
  { id: "tr_fbs5_13", regCode: "FBS 5 MOD/13463/J2026", admNo: "13463", name: "Valentine Lesoito", classCode: "FBS 5 MOD/J/2026", department: "FBS Hospitality", gender: "F" },
  { id: "tr_fbs5_14", regCode: "FBS 5 MOD/13482/J2026", admNo: "13482", name: "Kinyua Christine Mutito", classCode: "FBS 5 MOD/J/2026", department: "FBS Hospitality", gender: "F" },
  { id: "tr_fbs5_15", regCode: "FBS 5 MOD/13488/J2026", admNo: "13488", name: "Gichukia Bridgit Nyakio", classCode: "FBS 5 MOD/J/2026", department: "FBS Hospitality", gender: "F" },
  { id: "tr_fbs5_16", regCode: "FBS 5 MOD/13546/J2026", admNo: "13546", name: "Karwitha Silvia", classCode: "FBS 5 MOD/J/2026", department: "FBS Hospitality", gender: "F" },
  { id: "tr_fbs5_17", regCode: "FBS 5 MOD/13551/J2026", admNo: "13551", name: "Lavint Aliviza", classCode: "FBS 5 MOD/J/2026", department: "FBS Hospitality", gender: "F" },
  { id: "tr_fbs5_18", regCode: "FBS 5 MOD/13559/J2026", admNo: "13559", name: "Kinya Weddy", classCode: "FBS 5 MOD/J/2026", department: "FBS Hospitality", gender: "F" },
  { id: "tr_fbs5_19", regCode: "FBS 5 MOD/13571/J2026", admNo: "13571", name: "Gakuhi Jackline Nyambura", classCode: "FBS 5 MOD/J/2026", department: "FBS Hospitality", gender: "F" },
  { id: "tr_fbs5_20", regCode: "FBS 5 MOD/13583/J2026", admNo: "13583", name: "Terry Mwendwa", classCode: "FBS 5 MOD/J/2026", department: "FBS Hospitality", gender: "F" },
  { id: "tr_fbs6_01", regCode: "FBP6 MOD/13251/12026", admNo: "13251", name: "Mbithi Faith Wavinya", classCode: "FBS6 MOD/12026", department: "FBS Hospitality", gender: "F" },
  { id: "tr_fbs6_02", regCode: "FBS6 MOD/13314/12026", admNo: "13314", name: "Emmanuel Njoroge", classCode: "FBS6 MOD/12026", department: "FBS Hospitality", gender: "M" },
  { id: "tr_fbs6_03", regCode: "FBS6 MOD/13403/12026", admNo: "13403", name: "Brenda Ntinyari", classCode: "FBS6 MOD/12026", department: "FBS Hospitality", gender: "F" },
  { id: "tr_fbs6_04", regCode: "FBS6 MOD/13430/12026", admNo: "13430", name: "Omedo Lilian Atieno", classCode: "FBS6 MOD/12026", department: "FBS Hospitality", gender: "F" },
  { id: "tr_fbs6_05", regCode: "FBS6 MOD/13487/12026", admNo: "13487", name: "Waguama Donatus Wachira", classCode: "FBS6 MOD/12026", department: "FBS Hospitality", gender: "M" },
  { id: "tr_fbs6_06", regCode: "FBS6 MOD/13495/12026", admNo: "13495", name: "Nyamai Caroline Mutheu", classCode: "FBS6 MOD/12026", department: "FBS Hospitality", gender: "F" },

  // 4. LS5/6/S/26 (Apply Digital Literacy - Land Survey, 19 Trainees + Harriet Mwendwa)
  { id: "tr_ls5_01", regCode: "LS5 MOD/14009/52026", admNo: "14009", name: "Vick Mutembei", classCode: "LS5/6/S/26", department: "Building & Civil Engineering", gender: "M" },
  { id: "tr_ls5_02", regCode: "LS5 MOD/14024/52026", admNo: "14024", name: "Kajuju Jackline Kathera", classCode: "LS5/6/S/26", department: "Building & Civil Engineering", gender: "F" },
  { id: "tr_ls5_03", regCode: "LS5 MOD/14032/52026", admNo: "14032", name: "Muthike Bredah Nyawira", classCode: "LS5/6/S/26", department: "Building & Civil Engineering", gender: "F" },
  { id: "tr_ls5_04", regCode: "LS5 MOD/14092/S2026", admNo: "14092", name: "Murithi Brian Munene", classCode: "LS5/6/S/26", department: "Building & Civil Engineering", gender: "M" },
  { id: "tr_ls5_05", regCode: "LS5 MOD/14120/52026", admNo: "14120", name: "Glory Makena", classCode: "LS5/6/S/26", department: "Building & Civil Engineering", gender: "F" },
  { id: "tr_ls5_06", regCode: "LS5 MOD/14348/S2026", admNo: "14348", name: "Okello Janet Auma", classCode: "LS5/6/S/26", department: "Building & Civil Engineering", gender: "F" },
  { id: "tr_ls5_07", regCode: "LS5 MOD/14403/52026", admNo: "14403", name: "Mutegi Kagendo Emma", classCode: "LS5/6/S/26", department: "Building & Civil Engineering", gender: "F" },
  { id: "tr_ls5_08", regCode: "LS5 MOD/14428/52026", admNo: "14428", name: "Risper Mwendwa", classCode: "LS5/6/S/26", department: "Building & Civil Engineering", gender: "F" },
  { id: "tr_ls5_09", regCode: "LS5 MOD/14502/52026", admNo: "14502", name: "Mutegi Hyprith Gatwiri", classCode: "LS5/6/S/26", department: "Building & Civil Engineering", gender: "F" },
  { id: "tr_ls6_01", regCode: "LS6 MOD/14001/S2026", admNo: "14001", name: "Njeru Salim Mutemi", classCode: "LS5/6/S/26", department: "Building & Civil Engineering", gender: "M" },
  { id: "tr_ls6_02", regCode: "LS6 MOD/14011/S2026", admNo: "14011", name: "Jedida Karwitha", classCode: "LS5/6/S/26", department: "Building & Civil Engineering", gender: "F" },
  { id: "tr_ls6_03", regCode: "LS6 MOD/14066/52026", admNo: "14066", name: "Nyaga Caroline Mukami", classCode: "LS5/6/S/26", department: "Building & Civil Engineering", gender: "F" },
  { id: "tr_ls6_04", regCode: "LS6 MOD/14183/S2026", admNo: "14183", name: "Gideon Mucheria Kithendu", classCode: "LS5/6/S/26", department: "Building & Civil Engineering", gender: "M" },
  { id: "tr_ls6_05", regCode: "LS6 MOD/14256/52026", admNo: "14256", name: "Linus Murerwa", classCode: "LS5/6/S/26", department: "Building & Civil Engineering", gender: "M" },
  { id: "tr_ls6_06", regCode: "LS6 MOD/14283/52026", admNo: "14283", name: "Caroline Mwendwa", classCode: "LS5/6/S/26", department: "Building & Civil Engineering", gender: "F" },
  { id: "tr_ls6_07", regCode: "LS6 MOD/14331/S2026", admNo: "14331", name: "Brian Mutembei", classCode: "LS5/6/S/26", department: "Building & Civil Engineering", gender: "M" },
  { id: "tr_ls6_08", regCode: "LS6 MOD/14332/52026", admNo: "14332", name: "Kipngetich Cornelius", classCode: "LS5/6/S/26", department: "Building & Civil Engineering", gender: "M" },
  { id: "tr_ls6_09", regCode: "LS6 MOD/14351/52026", admNo: "14351", name: "Otieno Jecinter Trizer", classCode: "LS5/6/S/26", department: "Building & Civil Engineering", gender: "F" },
  { id: "tr_ls6_10", regCode: "LS6 MOD/14451/S2026", admNo: "14451", name: "Caroline Kanana Mwirigi", classCode: "LS5/6/S/26", department: "Building & Civil Engineering", gender: "F" },
  { id: "tr_ls_harriet", regCode: "D/UPNUT/25042/069", admNo: "D/UPNUT/25042/069", name: "Harriet Mwendwa", classCode: "LS5/6/S/26", department: "Building & Civil Engineering", gender: "F" },
];

function getInitialUploads(): Upload[] {
  let pdf1Base64 = "";
  let pdf1Size = 145000;
  try {
    const gen = generateSamplePracticalEvidencePDF({
      studentName: "Nthiga Gakii Doris",
      admNo: "14179/S2026",
      taskTitle: "Computer Hardware Diagnostics & Disassembly",
      taskCode: "CP1",
      unitCode: "IT/CU/ICTA/CR/01/6/MA",
      unitTitle: "Perform Computer Essentials",
    });
    pdf1Base64 = gen.base64;
    pdf1Size = gen.size;
  } catch (e) {
    console.warn("Failed to generate PDF 1:", e);
  }

  let img2Data = "";
  try {
    img2Data = generateSampleObservationImage();
  } catch (e) {
    console.warn("Failed to generate image 2:", e);
  }

  let pdf3Base64 = "";
  let pdf3Size = 142000;
  try {
    const gen = generateSamplePracticalEvidencePDF({
      studentName: "Ltumwa Lesoipa",
      admNo: "14022/S2026",
      taskTitle: "Network Cable Termination & LAN Verification",
      taskCode: "CP1",
      unitCode: "IT/CU/ICTA/CR/01/6/MA",
      unitTitle: "Perform Computer Essentials",
    });
    pdf3Base64 = gen.base64;
    pdf3Size = gen.size;
  } catch (e) {
    console.warn("Failed to generate PDF 3:", e);
  }

  return [
    {
      id: "up_1",
      traineeId: "tr_it6_01",
      student_name: "Nthiga Gakii Doris",
      filename: "Computer_Essentials_Practical_1.pdf",
      uploadType: "Practical 1",
      task_code: "CP1",
      unit_offering_id: "uo_1",
      unit_code: "IT/CU/ICTA/CR/01/6/MA",
      unit_title: "Perform Computer Essentials",
      file_data: pdf1Base64,
      mime_type: "application/pdf",
      file_size: pdf1Size,
      submitted_at: new Date(Date.now() - 86400000).toISOString(),
      status: "graded",
      grade: 88,
      comments: "Superb execution of hardware diagnostics, ESD precautions, and BIOS verification.",
      verified_by_trainer: true,
      verified_at: new Date(Date.now() - 3600000).toISOString(),
      verified_by_name: "Alexander Kinoti",
    },
    {
      id: "up_1_cp2",
      traineeId: "tr_it6_01",
      student_name: "Nthiga Gakii Doris",
      filename: "OS_Installation_And_Partitioning_Practical_2.pdf",
      uploadType: "Practical 2",
      task_code: "CP2",
      unit_offering_id: "uo_1",
      unit_code: "IT/CU/ICTA/CR/01/6/MA",
      unit_title: "Perform Computer Essentials",
      file_data: pdf1Base64,
      mime_type: "application/pdf",
      file_size: pdf1Size,
      submitted_at: new Date(Date.now() - 72000000).toISOString(),
      status: "graded",
      grade: 92,
      comments: "Clean GPT disk partitioning, driver installation, and peripheral configuration.",
      verified_by_trainer: true,
      verified_at: new Date(Date.now() - 3200000).toISOString(),
      verified_by_name: "Alexander Kinoti",
    },
    {
      id: "up_1_cp3",
      traineeId: "tr_it6_01",
      student_name: "Nthiga Gakii Doris",
      filename: "System_Maintenance_And_Archiving_Practical_3.pdf",
      uploadType: "Practical 3",
      task_code: "CP3",
      unit_offering_id: "uo_1",
      unit_code: "IT/CU/ICTA/CR/01/6/MA",
      unit_title: "Perform Computer Essentials",
      file_data: pdf1Base64,
      mime_type: "application/pdf",
      file_size: pdf1Size,
      submitted_at: new Date(Date.now() - 64000000).toISOString(),
      status: "graded",
      grade: 90,
      comments: "Excellent command-line disk maintenance (chkdsk / sfc) and 7-Zip archiving.",
      verified_by_trainer: true,
      verified_at: new Date(Date.now() - 3000000).toISOString(),
      verified_by_name: "Alexander Kinoti",
    },
    {
      id: "up_1_ct2",
      traineeId: "tr_it6_01",
      student_name: "Nthiga Gakii Doris",
      filename: "Computer_Systems_Architecture_CAT_2.pdf",
      uploadType: "CAT 2",
      task_code: "CT2",
      unit_offering_id: "uo_1",
      unit_code: "IT/CU/ICTA/CR/01/6/MA",
      unit_title: "Perform Computer Essentials",
      file_data: pdf1Base64,
      mime_type: "application/pdf",
      file_size: pdf1Size,
      submitted_at: new Date(Date.now() - 60000000).toISOString(),
      status: "graded",
      grade: 86,
      comments: "Thorough comparison of CPU instruction cycle, primary vs secondary memory, and bus architectures.",
      verified_by_trainer: true,
      verified_at: new Date(Date.now() - 2800000).toISOString(),
      verified_by_name: "Alexander Kinoti",
    },
    {
      id: "up_1_assign",
      traineeId: "tr_it6_01",
      student_name: "Nthiga Gakii Doris",
      filename: "Enterprise_Backup_And_Security_Assignment.docx",
      uploadType: "Assignment",
      task_code: "Assignment",
      unit_offering_id: "uo_1",
      unit_code: "IT/CU/ICTA/CR/01/6/MA",
      unit_title: "Perform Computer Essentials",
      file_data: "UEsDBBQABgAIAAAAIQAAAAAAAAA=",
      mime_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      file_size: 58400,
      submitted_at: new Date(Date.now() - 54000000).toISOString(),
      status: "graded",
      grade: 91,
      comments: "Well-researched data security policy and 3-2-1 enterprise backup strategy.",
      verified_by_trainer: true,
      verified_at: new Date(Date.now() - 2500000).toISOString(),
      verified_by_name: "Alexander Kinoti",
    },
    {
      id: "up_1_proj",
      traineeId: "tr_it6_01",
      student_name: "Nthiga Gakii Doris",
      filename: "Workstation_Preventive_Maintenance_Project.pdf",
      uploadType: "Project",
      task_code: "Project",
      unit_offering_id: "uo_1",
      unit_code: "IT/CU/ICTA/CR/01/6/MA",
      unit_title: "Perform Computer Essentials",
      file_data: pdf1Base64,
      mime_type: "application/pdf",
      file_size: pdf1Size,
      submitted_at: new Date(Date.now() - 48000000).toISOString(),
      status: "graded",
      grade: 93,
      comments: "Comprehensive ICT lab audit, workstation assembly logbook, and preventive maintenance schedule.",
      verified_by_trainer: true,
      verified_at: new Date(Date.now() - 2100000).toISOString(),
      verified_by_name: "Alexander Kinoti",
    },
    {
      id: "up_2",
      traineeId: "tr_it6_02",
      student_name: "Kaumbuthu Belinda Mukiri",
      filename: "Hardware_Diagnostics_Observation.png",
      uploadType: "Practical 2",
      task_code: "CP2",
      unit_offering_id: "uo_1",
      unit_code: "IT/CU/ICTA/CR/01/6/MA",
      unit_title: "Perform Computer Essentials",
      file_data: img2Data,
      mime_type: "image/svg+xml",
      file_size: 42100,
      submitted_at: new Date(Date.now() - 43200000).toISOString(),
      status: "graded",
      grade: 78,
      comments: "Good component identification and motherboard POST diagnostic verification.",
      verified_by_trainer: true,
      verified_at: new Date(Date.now() - 1800000).toISOString(),
      verified_by_name: "Alexander Kinoti",
    },
    {
      id: "up_2_cp1",
      traineeId: "tr_it6_02",
      student_name: "Kaumbuthu Belinda Mukiri",
      filename: "Port_Identification_And_BIOS_Setup_CP1.pdf",
      uploadType: "Practical 1",
      task_code: "CP1",
      unit_offering_id: "uo_1",
      unit_code: "IT/CU/ICTA/CR/01/6/MA",
      unit_title: "Perform Computer Essentials",
      file_data: pdf1Base64,
      mime_type: "application/pdf",
      file_size: pdf1Size,
      submitted_at: new Date(Date.now() - 50000000).toISOString(),
      status: "graded",
      grade: 80,
      comments: "Accurate external port mapping and CMOS configuration.",
      verified_by_trainer: true,
      verified_at: new Date(Date.now() - 1900000).toISOString(),
      verified_by_name: "Alexander Kinoti",
    },
    {
      id: "up_3",
      traineeId: "tr_it4_01",
      student_name: "Wanjau Alvin Gatere",
      filename: "Computer_Hardware_Assignment.docx",
      uploadType: "Assignment",
      task_code: "Assignment",
      unit_offering_id: "uo_1",
      unit_code: "IT/CU/ICT/CC/01/4/MA",
      unit_title: "Perform Computer Essentials",
      file_data: "UEsDBBQABgAIAAAAIQAAAAAAAAA=",
      mime_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      file_size: 64200,
      submitted_at: new Date(Date.now() - 172800000).toISOString(),
      status: "graded",
      grade: 85,
      comments: "Excellent hardware identification and peripheral classification.",
      verified_by_trainer: true,
      verified_at: new Date(Date.now() - 86400000).toISOString(),
      verified_by_name: "Alexander Kinoti",
    },
    {
      id: "up_3_cp1",
      traineeId: "tr_it4_01",
      student_name: "Wanjau Alvin Gatere",
      filename: "Workstation_Cabling_And_Safety_CP1.pdf",
      uploadType: "Practical 1",
      task_code: "CP1",
      unit_offering_id: "uo_1",
      unit_code: "IT/CU/ICT/CC/01/4/MA",
      unit_title: "Perform Computer Essentials",
      file_data: pdf1Base64,
      mime_type: "application/pdf",
      file_size: pdf1Size,
      submitted_at: new Date(Date.now() - 120000000).toISOString(),
      status: "graded",
      grade: 84,
      comments: "Proper ESD wrist-strap usage and peripheral cabling demonstrated.",
      verified_by_trainer: true,
      verified_at: new Date(Date.now() - 80000000).toISOString(),
      verified_by_name: "Alexander Kinoti",
    },
    {
      id: "up_4",
      traineeId: "tr_it6_03",
      student_name: "Ltumwa Lesoipa",
      filename: "Network_Configuration_Evidence.pdf",
      uploadType: "Practical 1",
      task_code: "CP1",
      unit_offering_id: "uo_1",
      unit_code: "IT/CU/ICTA/CR/01/6/MA",
      unit_title: "Perform Computer Essentials",
      file_data: pdf3Base64,
      mime_type: "application/pdf",
      file_size: pdf3Size,
      submitted_at: new Date(Date.now() - 12000000).toISOString(),
      status: "graded",
      grade: 74,
      comments: "Solid RJ-45 termination and LAN ping connectivity test.",
      verified_by_trainer: true,
      verified_at: new Date(Date.now() - 1500000).toISOString(),
      verified_by_name: "Alexander Kinoti",
    },
  ];
}

export function findMatchingTrainee(
  trainees: Trainee[],
  query: { traineeId?: string; regNumber?: string; studentName?: string }
): Trainee | undefined {
  if (query.traineeId) {
    const byId = trainees.find((t) => t.id === query.traineeId);
    if (byId) return byId;
  }
  if (query.regNumber) {
    const rawReg = query.regNumber.trim().toUpperCase();
    const cleanReg = rawReg.replace(/^(ITECH\s*6\s*MOD|ICT4\s*MOD|FBS\s*5\s*MOD|FBS6\s*MOD|FBP6\s*MOD|LS5\s*MOD|LS6\s*MOD)\//i, "");
    const byReg = trainees.find((t) => {
      const tAdm = (t.admNo || "").trim().toUpperCase();
      const tReg = (t.regCode || "").trim().toUpperCase();
      return (
        tAdm === rawReg ||
        tReg === rawReg ||
        tAdm === cleanReg ||
        (cleanReg.length >= 4 && (tReg.includes(cleanReg) || tAdm.includes(cleanReg)))
      );
    });
    if (byReg) return byReg;
  }
  if (query.studentName) {
    const normName = query.studentName.trim().toLowerCase();
    const byName = trainees.find((t) => t.name.trim().toLowerCase() === normName);
    if (byName) return byName;
  }
  return undefined;
}

export function syncScoreToContinuousMarksheet(params: {
  traineeId?: string;
  regNumber?: string;
  studentName?: string;
  taskCode: string;
  percentageScore: number;
  unitOfferingId?: string;
  level?: number;
}) {
  if (typeof window === "undefined") return;
  const unitOfferingId = params.unitOfferingId || "uo_1";
  const level = params.level || 6;
  const score = Math.round(Math.max(0, Math.min(100, params.percentageScore)));

  let resolvedTraineeId = params.traineeId;
  if (!resolvedTraineeId) {
    let roster: Trainee[] = OFFICIAL_MTTI_TRAINEES;
    try {
      const savedRoster = localStorage.getItem("mtti_trainees");
      if (savedRoster) roster = JSON.parse(savedRoster);
    } catch {}
    const matched = findMatchingTrainee(roster, {
      traineeId: params.traineeId,
      regNumber: params.regNumber,
      studentName: params.studentName,
    });
    resolvedTraineeId = matched?.id;
  }
  if (!resolvedTraineeId) return;

  try {
    const marksStorageKey = `mtti_marks_${unitOfferingId}`;
    const saved = localStorage.getItem(marksStorageKey);
    const marksData: any[] = saved ? JSON.parse(saved) : [];

    let entry = marksData.find((m: any) => m.trainee_id === resolvedTraineeId);
    if (entry && entry.is_locked) {
      return;
    }

    if (!entry) {
      entry = {
        unit_offering_id: unitOfferingId,
        trainee_id: resolvedTraineeId,
        ct_scores: ["", "", ""],
        computed_average_theory: 0,
        cp_scores: ["", "", ""],
        computed_average_practical: 0,
        project_score: "",
        assignment_score: "",
        weighted_mark: 0,
        is_locked: false,
      };
      marksData.push(entry);
    }

    if (!Array.isArray(entry.ct_scores)) entry.ct_scores = ["", "", ""];
    if (!Array.isArray(entry.cp_scores)) entry.cp_scores = ["", "", ""];

    const task = (params.taskCode || "CT1").trim().toUpperCase();
    if (task.startsWith("CP") || task.includes("PRAC") || task.includes("OBSERVATION") || task.includes("CHECKLIST")) {
      const match = task.match(/\d+/);
      const idx = match ? Math.max(0, parseInt(match[0], 10) - 1) : 0;
      while (entry.cp_scores.length <= idx) {
        entry.cp_scores.push("");
      }
      entry.cp_scores[idx] = score;
    } else if (task.includes("PROJ")) {
      entry.project_score = score;
    } else if (task.includes("ASSIGN")) {
      entry.assignment_score = score;
    } else {
      // CT1, CT2, CT3, CAT 1, CAT 2, CAT 3, WA1, WA2, WA3
      const match = task.match(/\d+/);
      const idx = match ? Math.max(0, parseInt(match[0], 10) - 1) : 0;
      while (entry.ct_scores.length <= idx) {
        entry.ct_scores.push("");
      }
      entry.ct_scores[idx] = score;
    }

    const theoryInputs = [
      ...entry.ct_scores,
      entry.assignment_score !== undefined && entry.assignment_score !== "" ? entry.assignment_score : "",
    ];
    entry.computed_average_theory = calculateAverages(theoryInputs);
    entry.computed_average_practical = calculateAverages(entry.cp_scores);
    entry.weighted_mark = calculateWeightedMark(
      entry.computed_average_theory,
      entry.computed_average_practical,
      level
    );

    localStorage.setItem(marksStorageKey, JSON.stringify(marksData));
    window.dispatchEvent(new CustomEvent("mtti-marks-updated", { detail: { traineeId: resolvedTraineeId, taskCode: params.taskCode, score } }));
  } catch (err) {
    console.error("Failed to sync assessment score to marksheet:", err);
  }
}

const TraineeContext = createContext<TraineeContextType | undefined>(undefined);

export function TraineeProvider({ children }: { children: ReactNode }) {
  // Initialize from localStorage or fallback to official roster (with automatic cleanup of phantom candidates)
  const [trainees, setTrainees] = useState<Trainee[]>(() => {
    const versionKey = "mtti_roster_version_v6";
    const currentVersion = localStorage.getItem(versionKey);
    const saved = localStorage.getItem("mtti_trainees");

    if (currentVersion === "v6" && saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 10) {
          // Strictly filter out phantom candidates
          const filtered = parsed.filter((t: Trainee) => {
            if (t.id === "tr_it6_12" || t.id === "tr_it6_13") return false;
            if (t.name === "LUCKYSUSAN KIANJIRU MUGO") return false;
            if (t.admNo === "10525" && t.classCode === "ICT4/ITECH6/S/26 MOD 1") return false;
            if (t.name === "Harriet Mwendwa" && t.classCode === "ICT4/ITECH6/S/26 MOD 1") return false;
            return true;
          });

          return filtered.map((t: Trainee) => {
            let classCode = t.classCode;
            if (
              classCode === "ITECH 6 MODULAR/S/2026" || 
              classCode === "ICT4 MOD/S/2026" || 
              classCode === "ICT4/ITECH6/S/2026 MOD 1" ||
              classCode === "ICT4/ITECH6/S/26 MOD 1"
            ) {
              classCode = "ICT4/ITECH6/S/26 MOD 1";
            } else if (classCode === "Admin 5/6/J/2026" || classCode === "ADMIN5/6/J/26") {
              classCode = "ADMIN5/6/J/26 MOD 3";
            } else if (classCode === "FBS 5 MOD/J/2026" || classCode === "FBS" || classCode === "FBS6 MOD/J/2026") {
              classCode = "FBS5/6/J/26";
            } else if (classCode === "LS5 MOD/S/2026" || classCode === "LS6 MOD/S/2026") {
              classCode = "LS5/6/S/26";
            }
            return {
              ...t,
              classCode,
              admNo: t.admNo?.replace(/^(ITECH\s*6\s*MOD|ICT4\s*MOD)\//i, "") || t.admNo
            };
          });
        }
      } catch {}
    }

    // Default to clean official roster and mark version
    localStorage.setItem(versionKey, "v6");
    localStorage.setItem("mtti_trainees", JSON.stringify(OFFICIAL_MTTI_TRAINEES));
    return OFFICIAL_MTTI_TRAINEES;
  });

  const [uploads, setUploads] = useState<Upload[]>(() => {
    const initial = getInitialUploads();
    const saved = localStorage.getItem("mtti_uploads");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const enriched = parsed.map((item: Upload) => {
            const match = initial.find((i) => i.id === item.id);
            return {
              ...item,
              file_data: item.file_data || match?.file_data,
              mime_type: item.mime_type || match?.mime_type,
              task_code: item.task_code || match?.task_code || "CP1",
              unit_offering_id: item.unit_offering_id || match?.unit_offering_id || "uo_1",
              verified_by_trainer: item.verified_by_trainer ?? match?.verified_by_trainer ?? false,
              status: item.status === "pending" && match?.status === "graded" ? "graded" : item.status,
              grade: item.grade === null && match?.grade !== null && match?.grade !== undefined ? match.grade : item.grade,
              comments: item.comments || match?.comments || "",
            };
          });
          const existingIds = new Set(enriched.map((u: Upload) => u.id));
          const missingInitial = initial.filter((u) => !existingIds.has(u.id));
          return [...enriched, ...missingInitial];
        }
      } catch {}
    }
    return initial;
  });

  // Persist to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem("mtti_trainees", JSON.stringify(trainees));
  }, [trainees]);

  // Rehydrate from backend API / PostgreSQL on mount
  useEffect(() => {
    fetch("/api/trainees")
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setTrainees(prev => {
            const existingMap = new Map<string, Trainee>();
            prev.forEach(t => existingMap.set(t.id, t));
            data.data.forEach((incoming: any) => {
              const mapped: Trainee = {
                id: incoming.id,
                name: incoming.name,
                regCode: incoming.reg_code || incoming.adm_no || incoming.reg_number,
                admNo: incoming.adm_no || incoming.reg_number,
                classCode: incoming.class_code || incoming.class_id || "ICT4/ITECH6/S/26 MOD 1",
                department: incoming.department,
                gender: incoming.gender,
                phone: incoming.phone,
                remarks: incoming.remarks,
              };
              existingMap.set(mapped.id, mapped);
            });
            const merged = Array.from(existingMap.values());
            localStorage.setItem("mtti_trainees", JSON.stringify(merged));
            return merged;
          });
        }
      })
      .catch(e => console.warn("Could not fetch remote trainees:", e));
  }, []);

  useEffect(() => {
    localStorage.setItem("mtti_uploads", JSON.stringify(uploads));
  }, [uploads]);

  const resetToOfficialRoster = () => {
    setTrainees(OFFICIAL_MTTI_TRAINEES);
    localStorage.setItem("mtti_trainees", JSON.stringify(OFFICIAL_MTTI_TRAINEES));
  };

  const registerTrainee = (newTrainee: Omit<Trainee, "id">) => {
    const existing = trainees.find(t => t.regCode === newTrainee.regCode);
    if (existing) return existing;

    const trainee: Trainee = {
      ...newTrainee,
      id: `tr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    setTrainees(prev => [...prev, trainee]);

    // Persist to backend API & PostgreSQL
    fetch("/api/trainees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(trainee),
    }).catch(err => console.warn("Backend trainee persist warning:", err));

    return trainee;
  };

  const addTrainee = (newTrainee: Omit<Trainee, "id">) => {
    const trainee: Trainee = {
      ...newTrainee,
      id: `tr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    setTrainees(prev => [trainee, ...prev]);

    // Persist to backend API & PostgreSQL
    fetch("/api/trainees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(trainee),
    }).catch(err => console.warn("Backend trainee persist warning:", err));

    return trainee;
  };

  const updateTrainee = (id: string, updates: Partial<Trainee>) => {
    setTrainees(prev =>
      prev.map(t => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const deleteTrainee = (id: string) => {
    setTrainees(prev => prev.filter(t => t.id !== id));
  };

  const recordUpload = (
    upload: Partial<Upload> & Pick<Upload, "traineeId" | "student_name" | "filename" | "uploadType">
  ) => {
    const newUpload: Upload = {
      id: `up_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      submitted_at: new Date().toISOString(),
      status: "pending",
      grade: null,
      comments: "",
      task_code: upload.task_code || "CP1",
      unit_offering_id: upload.unit_offering_id || "uo_1",
      verified_by_trainer: false,
      ...upload,
    };
    setUploads(prev => [newUpload, ...prev]);
  };

  const verifyUpload = (uploadId: string, trainerName: string = "Alexander Kinoti") => {
    const now = new Date().toISOString();
    setUploads(prev =>
      prev.map(up =>
        up.id === uploadId
          ? {
              ...up,
              verified_by_trainer: true,
              verified_at: now,
              verified_by_name: trainerName,
              status: up.status === "graded" ? "graded" : "verified",
            }
          : up
      )
    );
    toast.success("Assessment evidence verified by trainer.");
  };

  const awardUploadMark = (
    uploadId: string,
    params: {
      grade: number;
      comments: string;
      taskCode: string;
      unitOfferingId?: string;
      trainerName?: string;
    }
  ) => {
    const targetUpload = uploads.find(u => u.id === uploadId);
    const now = new Date().toISOString();
    const trainer = params.trainerName || "Alexander Kinoti";

    setUploads(prev =>
      prev.map(up =>
        up.id === uploadId
          ? {
              ...up,
              status: "graded",
              grade: params.grade,
              comments: params.comments,
              task_code: params.taskCode,
              verified_by_trainer: true,
              verified_at: now,
              verified_by_name: trainer,
            }
          : up
      )
    );

    const unitOfferingId = params.unitOfferingId || targetUpload?.unit_offering_id || "uo_1";
    const traineeId = targetUpload?.traineeId;

    syncScoreToContinuousMarksheet({
      traineeId,
      studentName: targetUpload?.student_name,
      taskCode: params.taskCode,
      percentageScore: params.grade,
      unitOfferingId,
    });

    toast.success(`Mark (${params.grade}%) awarded and synced to ${params.taskCode} marksheet!`);
  };

  const updateUploadGrade = (uploadId: string, grade: number, comments: string) => {
    const up = uploads.find(u => u.id === uploadId);
    awardUploadMark(uploadId, {
      grade,
      comments,
      taskCode: up?.task_code || "CP1",
      unitOfferingId: up?.unit_offering_id || "uo_1",
    });
  };

  const deleteUpload = (uploadId: string, callerRole: string = "trainer"): boolean => {
    const target = uploads.find(u => u.id === uploadId);
    if (!target) return false;
    if (callerRole === "trainee" && (target.verified_by_trainer || target.status === "graded")) {
      toast.error("Trainees cannot delete verified or graded assessment evidence.");
      return false;
    }
    setUploads(prev => prev.filter(up => up.id !== uploadId));
    return true;
  };

  return (
    <TraineeContext.Provider value={{ 
      trainees, 
      uploads, 
      registerTrainee, 
      addTrainee, 
      updateTrainee, 
      deleteTrainee, 
      recordUpload, 
      updateUploadGrade, 
      verifyUpload,
      awardUploadMark,
      deleteUpload,
      resetToOfficialRoster 
    }}>
      {children}
    </TraineeContext.Provider>
  );
}

export function useTrainees() {
  const context = useContext(TraineeContext);
  if (!context) {
    throw new Error("useTrainees must be used within a TraineeProvider");
  }
  return context;
}
