/**
 * ModularProgressionViewer.tsx
 *
 * Interactive Visualizer for the Official TVET ICT Modularized Progression Graph
 * Republic of Kenya — Ministry of Education
 * State Department for Technical, Vocational Education and Training (TVET)
 */

import React, { useState } from "react";
import { 
  TVET_LEVELS, 
  TVET_MODULES, 
  TVETLevel, 
  TVETModuleConfig, 
  TVETProgressionUnit 
} from "@/lib/tvetProgression";
import { OFFICIAL_LEARNING_PLANS, getLearningPlanTVETModule, type LearningPlanRecord } from "@/data/learningPlans";
import { 
  Layers, 
  GraduationCap, 
  Clock, 
  Award, 
  CheckCircle2, 
  BookOpen, 
  ArrowRight, 
  Info, 
  Briefcase, 
  FileText,
  ExternalLink,
  ChevronRight,
  Filter
} from "lucide-react";
import { Link } from "wouter";

interface ModularProgressionViewerProps {
  onSelectUnit?: (unitTitle: string, unitCode?: string) => void;
}

export default function ModularProgressionViewer({ onSelectUnit }: ModularProgressionViewerProps) {
  const [selectedLevel, setSelectedLevel] = useState<TVETLevel | 'ALL'>('ALL');
  const [activeModule, setActiveModule] = useState<TVETModuleConfig>(TVET_MODULES[0]);
  const [selectedUnit, setSelectedUnit] = useState<TVETProgressionUnit | null>(TVET_MODULES[0].units[0]);

  // Find digitized plans associated with the active module
  const plansForActiveModule = OFFICIAL_LEARNING_PLANS.filter((p) => {
    const mod = getLearningPlanTVETModule(p);
    return mod?.moduleNumber === activeModule.moduleNumber;
  });

  const levels: TVETLevel[] = ['LEVEL_3', 'LEVEL_4', 'LEVEL_5', 'LEVEL_6'];

  return (
    <div className="space-y-6">
      {/* Official Header Banner */}
      <div className="bg-gradient-to-r from-[#000953] via-[#051367] to-[#000953] text-white p-6 rounded-2xl shadow-lg border border-amber-500/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold uppercase tracking-wider border border-amber-500/40">
              <GraduationCap className="w-3.5 h-3.5" />
              Republic of Kenya • Ministry of Education
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              ICT Level 4/5/6 Modularized Progression Graph
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl">
              State Department for Technical, Vocational Education and Training (TVET).
              Standardized modular ladder connecting Artisan (Level 4), Craft (Level 5), and Diploma (Level 6) qualifications with nominal contact hours and industrial training gateways.
            </p>
          </div>

          {/* Quick Level Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 bg-black/30 p-1.5 rounded-xl border border-white/10 self-start md:self-auto">
            <button
              onClick={() => setSelectedLevel('ALL')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                selectedLevel === 'ALL'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              All Levels
            </button>
            {levels.map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  selectedLevel === lvl
                    ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {TVET_LEVELS[lvl].name.split(' ')[0]} {TVET_LEVELS[lvl].name.split(' ')[1] || ''}
              </button>
            ))}
          </div>
        </div>

        {/* Level Qualification Metrics Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-white/10">
          {levels.map((lvl) => {
            const cfg = TVET_LEVELS[lvl];
            const isMatch = selectedLevel === 'ALL' || selectedLevel === lvl;
            return (
              <div
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  isMatch
                    ? 'bg-white/10 border-amber-400/50 shadow-sm'
                    : 'bg-white/5 border-transparent opacity-60 hover:opacity-90'
                }`}
              >
                <div className="text-[11px] font-medium text-amber-300 uppercase tracking-wider">{cfg.name}</div>
                <div className="text-sm font-bold text-white mt-0.5 truncate">{cfg.qualification}</div>
                <div className="text-xs text-slate-300 mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>{cfg.nominalHoursRange.display}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Official Master Grid (Verbatim Reproduction of Ministry Chart) */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              Modular Progression Ladder Matrix
            </h3>
            <p className="text-xs text-muted-foreground">
              Click any module or milestone cell to inspect unit competencies, nominal hours, and linked official learning plans.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto pb-2">
          <table className="w-full min-w-[980px] border-collapse text-left text-xs">
            <thead>
              <tr className="bg-[#000953] text-white">
                <th className="p-3 font-semibold uppercase tracking-wider w-44 rounded-tl-xl border-r border-blue-900">
                  Level & Nominal Hours
                </th>
                <th className="p-3 font-semibold uppercase tracking-wider border-r border-blue-900 text-center">Module 1</th>
                <th className="p-3 font-semibold uppercase tracking-wider border-r border-blue-900 text-center">Module 2</th>
                <th className="p-3 font-semibold uppercase tracking-wider border-r border-blue-900 text-center">Module 3</th>
                <th className="p-3 font-semibold uppercase tracking-wider border-r border-blue-900 text-center">Module 4</th>
                <th className="p-3 font-semibold uppercase tracking-wider border-r border-blue-900 text-center bg-amber-600/30 text-amber-300">
                  Practicum
                </th>
                <th className="p-3 font-semibold uppercase tracking-wider border-r border-blue-900 text-center">Module 5</th>
                <th className="p-3 font-semibold uppercase tracking-wider border-r border-blue-900 text-center">Module 6</th>
                <th className="p-3 font-semibold uppercase tracking-wider border-r border-blue-900 text-center">Module 7</th>
                <th className="p-3 font-semibold uppercase tracking-wider text-center bg-amber-600/30 text-amber-300 rounded-tr-xl">
                  Practicum
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {/* Level 3 */}
              {(selectedLevel === 'ALL' || selectedLevel === 'LEVEL_3') && (
                <tr className="hover:bg-muted/40 transition-colors">
                  <td className="p-3 font-bold bg-muted/30 border-r border-border">
                    <div className="text-primary font-bold">LEVEL 3</div>
                    <div className="text-[11px] text-muted-foreground font-medium">300–599 HRS</div>
                  </td>
                  <td 
                    onClick={() => { setActiveModule(TVET_MODULES[0]); setSelectedUnit(TVET_MODULES[0].units[0]); }}
                    className="p-2.5 border-r border-border cursor-pointer hover:bg-primary/5 transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/40 space-y-1">
                      <div className="font-semibold text-primary text-[11px]">COMPUTER ESSENTIALS</div>
                      <div className="font-semibold text-primary text-[11px]">COMPUTER OPERATIONS</div>
                    </div>
                  </td>
                  <td colSpan={1} className="p-2.5 border-r border-border">
                    <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 font-semibold text-center text-[11px]">
                      INDUSTRIAL TRAINING (Exit Gate)
                    </div>
                  </td>
                  <td colSpan={7} className="p-2.5 bg-muted/10 text-muted-foreground/40 text-center text-xs italic">
                    Not applicable to Level 3
                  </td>
                </tr>
              )}

              {/* Level 4 Artisan */}
              {(selectedLevel === 'ALL' || selectedLevel === 'LEVEL_4') && (
                <tr className="hover:bg-muted/40 transition-colors">
                  <td className="p-3 font-bold bg-muted/30 border-r border-border">
                    <div className="text-primary font-bold">LEVEL 4 (ARTISAN)</div>
                    <div className="text-[11px] text-muted-foreground font-medium">600–1199 HRS</div>
                  </td>
                  <td 
                    onClick={() => { setActiveModule(TVET_MODULES[0]); setSelectedUnit(TVET_MODULES[0].units[0]); }}
                    className="p-2.5 border-r border-border cursor-pointer hover:bg-primary/5 transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/40 space-y-1">
                      <div className="font-semibold text-primary text-[11px]">COMPUTER ESSENTIALS</div>
                      <div className="font-semibold text-primary text-[11px]">COMPUTER OPERATIONS</div>
                    </div>
                  </td>
                  <td 
                    onClick={() => { setActiveModule(TVET_MODULES[1]); setSelectedUnit(TVET_MODULES[1].units[1]); }}
                    className="p-2.5 border-r border-border cursor-pointer hover:bg-primary/5 transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 space-y-1">
                      <div className="font-semibold text-emerald-800 dark:text-emerald-300 text-[11px]">COMPUTER NETWORK SETUP</div>
                      <div className="font-semibold text-emerald-800 dark:text-emerald-300 text-[11px]">COMPUTER REPAIR & MAINT.</div>
                    </div>
                  </td>
                  <td colSpan={1} className="p-2.5 border-r border-border">
                    <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 font-semibold text-center text-[11px]">
                      INDUSTRIAL TRAINING (Artisan Exit Gate)
                    </div>
                  </td>
                  <td colSpan={6} className="p-2.5 bg-muted/10 text-muted-foreground/40 text-center text-xs italic">
                    Progression to Level 5 Craft upon completion
                  </td>
                </tr>
              )}

              {/* Level 5 Craft */}
              {(selectedLevel === 'ALL' || selectedLevel === 'LEVEL_5') && (
                <tr className="hover:bg-muted/40 transition-colors">
                  <td className="p-3 font-bold bg-muted/30 border-r border-border">
                    <div className="text-primary font-bold">LEVEL 5 (CRAFT)</div>
                    <div className="text-[11px] text-muted-foreground font-medium">1200–2399 HRS</div>
                  </td>
                  <td 
                    onClick={() => { setActiveModule(TVET_MODULES[0]); setSelectedUnit(TVET_MODULES[0].units[0]); }}
                    className="p-2.5 border-r border-border cursor-pointer hover:bg-primary/5 transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/40 space-y-1">
                      <div className="font-semibold text-primary text-[11px]">COMPUTER ESSENTIALS</div>
                      <div className="font-semibold text-primary text-[11px]">COMPUTER OPERATIONS</div>
                    </div>
                  </td>
                  <td 
                    onClick={() => { setActiveModule(TVET_MODULES[1]); setSelectedUnit(TVET_MODULES[1].units[1]); }}
                    className="p-2.5 border-r border-border cursor-pointer hover:bg-primary/5 transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 space-y-1">
                      <div className="font-semibold text-emerald-800 dark:text-emerald-300 text-[11px]">COMPUTER NETWORK SETUP</div>
                      <div className="font-semibold text-emerald-800 dark:text-emerald-300 text-[11px]">COMPUTER REPAIR & MAINT.</div>
                    </div>
                  </td>
                  <td 
                    onClick={() => { setActiveModule(TVET_MODULES[2]); setSelectedUnit(TVET_MODULES[2].units[1]); }}
                    className="p-2.5 border-r border-border cursor-pointer hover:bg-primary/5 transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-800/40 space-y-0.5">
                      <div className="font-semibold text-purple-900 dark:text-purple-300 text-[10px]">BASIC ELECTRONICS</div>
                      <div className="font-semibold text-purple-900 dark:text-purple-300 text-[10px]">COMPUTER SOFTWARE</div>
                      <div className="font-semibold text-purple-900 dark:text-purple-300 text-[10px]">WORK ETHICS & PRACTICES</div>
                      <div className="font-semibold text-purple-900 dark:text-purple-300 text-[10px]">NETWORK DESIGN & MGMT</div>
                    </div>
                  </td>
                  <td 
                    onClick={() => { setActiveModule(TVET_MODULES[3]); setSelectedUnit(TVET_MODULES[3].units[0]); }}
                    className="p-2.5 border-r border-border cursor-pointer hover:bg-primary/5 transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40 space-y-0.5">
                      <div className="font-semibold text-amber-900 dark:text-amber-300 text-[10px]">PROGRAMMING PRINCIPLES</div>
                      <div className="font-semibold text-amber-900 dark:text-amber-300 text-[10px]">DATABASE SYSTEMS</div>
                      <div className="font-semibold text-amber-900 dark:text-amber-300 text-[10px]">COMMUNICATION SKILLS</div>
                      <div className="font-semibold text-amber-900 dark:text-amber-300 text-[10px]">ENTREPRENEURIAL SKILLS</div>
                    </div>
                  </td>
                  <td className="p-2.5 border-r border-border">
                    <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 font-semibold text-center text-[11px]">
                      INDUSTRIAL TRAINING (Craft Exit Gate)
                    </div>
                  </td>
                  <td colSpan={4} className="p-2.5 bg-muted/10 text-muted-foreground/40 text-center text-xs italic">
                    Progression to Level 6 Diploma upon completion
                  </td>
                </tr>
              )}

              {/* Level 6 Diploma */}
              {(selectedLevel === 'ALL' || selectedLevel === 'LEVEL_6') && (
                <tr className="hover:bg-muted/40 transition-colors">
                  <td className="p-3 font-bold bg-muted/30 border-r border-border">
                    <div className="text-primary font-bold">LEVEL 6 (DIPLOMA)</div>
                    <div className="text-[11px] text-muted-foreground font-medium">2400–4799 HRS</div>
                  </td>
                  <td 
                    onClick={() => { setActiveModule(TVET_MODULES[0]); setSelectedUnit(TVET_MODULES[0].units[0]); }}
                    className="p-2.5 border-r border-border cursor-pointer hover:bg-primary/5 transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/40 space-y-1">
                      <div className="font-semibold text-primary text-[11px]">COMPUTER ESSENTIALS</div>
                      <div className="font-semibold text-primary text-[11px]">COMPUTER OPERATIONS</div>
                    </div>
                  </td>
                  <td 
                    onClick={() => { setActiveModule(TVET_MODULES[1]); setSelectedUnit(TVET_MODULES[1].units[1]); }}
                    className="p-2.5 border-r border-border cursor-pointer hover:bg-primary/5 transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 space-y-1">
                      <div className="font-semibold text-emerald-800 dark:text-emerald-300 text-[11px]">COMPUTER NETWORK SETUP</div>
                      <div className="font-semibold text-emerald-800 dark:text-emerald-300 text-[11px]">COMPUTER REPAIR & MAINT.</div>
                    </div>
                  </td>
                  <td 
                    onClick={() => { setActiveModule(TVET_MODULES[2]); setSelectedUnit(TVET_MODULES[2].units[1]); }}
                    className="p-2.5 border-r border-border cursor-pointer hover:bg-primary/5 transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-800/40 space-y-0.5">
                      <div className="font-semibold text-purple-900 dark:text-purple-300 text-[10px]">BASIC ELECTRONICS</div>
                      <div className="font-semibold text-purple-900 dark:text-purple-300 text-[10px]">COMPUTER SOFTWARE</div>
                      <div className="font-semibold text-purple-900 dark:text-purple-300 text-[10px]">WORK ETHICS & PRACTICES</div>
                      <div className="font-semibold text-purple-900 dark:text-purple-300 text-[10px]">NETWORK DESIGN & MGMT</div>
                    </div>
                  </td>
                  <td 
                    onClick={() => { setActiveModule(TVET_MODULES[3]); setSelectedUnit(TVET_MODULES[3].units[0]); }}
                    className="p-2.5 border-r border-border cursor-pointer hover:bg-primary/5 transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40 space-y-0.5">
                      <div className="font-semibold text-amber-900 dark:text-amber-300 text-[10px]">PROGRAMMING PRINCIPLES</div>
                      <div className="font-semibold text-amber-900 dark:text-amber-300 text-[10px]">DATABASE SYSTEMS</div>
                      <div className="font-semibold text-amber-900 dark:text-amber-300 text-[10px]">COMMUNICATION SKILLS</div>
                      <div className="font-semibold text-amber-900 dark:text-amber-300 text-[10px]">ENTREPRENEURIAL SKILLS</div>
                    </div>
                  </td>
                  <td className="p-2.5 border-r border-border">
                    <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-800 dark:text-sky-300 font-semibold text-center text-[10px]">
                      INTERIM INDUSTRIAL TRAINING
                    </div>
                  </td>
                  <td 
                    onClick={() => { setActiveModule(TVET_MODULES[4]); setSelectedUnit(TVET_MODULES[4].units[2]); }}
                    className="p-2.5 border-r border-border cursor-pointer hover:bg-primary/5 transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/40 space-y-0.5">
                      <div className="font-semibold text-indigo-900 dark:text-indigo-300 text-[10px]">DISCRETE MATH</div>
                      <div className="font-semibold text-indigo-900 dark:text-indigo-300 text-[10px]">SYSTEM ANALYSIS & DESIGN</div>
                      <div className="font-semibold text-indigo-900 dark:text-indigo-300 text-[10px]">WEBSITE APPLICATION</div>
                    </div>
                  </td>
                  <td 
                    onClick={() => { setActiveModule(TVET_MODULES[5]); setSelectedUnit(TVET_MODULES[5].units[0]); }}
                    className="p-2.5 border-r border-border cursor-pointer hover:bg-primary/5 transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/40 space-y-1">
                      <div className="font-semibold text-rose-900 dark:text-rose-300 text-[11px]">ICT SECURITY</div>
                      <div className="font-semibold text-rose-900 dark:text-rose-300 text-[11px]">DESKTOP APPLICATION</div>
                    </div>
                  </td>
                  <td 
                    onClick={() => { setActiveModule(TVET_MODULES[6]); setSelectedUnit(TVET_MODULES[6].units[1]); }}
                    className="p-2.5 border-r border-border cursor-pointer hover:bg-primary/5 transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/40 space-y-1">
                      <div className="font-semibold text-teal-900 dark:text-teal-300 text-[11px]">ICT SECURITY (ADVANCED)</div>
                      <div className="font-semibold text-teal-900 dark:text-teal-300 text-[11px]">DESKTOP APP / MIS</div>
                    </div>
                  </td>
                  <td className="p-2.5">
                    <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 font-semibold text-center text-[11px]">
                      FINAL INDUSTRIAL TRAINING (Diploma Exit)
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Module Deep-Dive Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Module Navigation Tabs */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              Select TVET Module Stage
            </h4>
            <span className="text-xs bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
              7 Modules
            </span>
          </div>

          <div className="space-y-2">
            {TVET_MODULES.map((mod) => {
              const isSelected = activeModule.moduleNumber === mod.moduleNumber;
              return (
                <button
                  key={mod.moduleNumber}
                  onClick={() => {
                    setActiveModule(mod);
                    setSelectedUnit(mod.units[0]);
                  }}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-background hover:bg-muted/60 border-border text-foreground"
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold uppercase tracking-wider ${isSelected ? "text-amber-300" : "text-primary"}`}>
                        {mod.title}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${isSelected ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"}`}>
                        {mod.units.length} Units
                      </span>
                    </div>
                    <div className={`text-xs font-medium truncate max-w-[200px] ${isSelected ? "text-white" : "text-muted-foreground"}`}>
                      {mod.subtitle}
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 ${isSelected ? "text-amber-300" : "text-muted-foreground"}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Units Breakdown in Selected Module */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                {activeModule.title} Breakdown
              </span>
              <h4 className="text-base font-bold text-foreground">
                {activeModule.subtitle}
              </h4>
            </div>
            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {activeModule.units.reduce((acc, u) => acc + u.nominalHours, 0)} Total Hrs
            </span>
          </div>

          <div className="space-y-2.5">
            {activeModule.units.map((unit) => {
              const isUnitActive = selectedUnit?.title === unit.title;
              return (
                <div
                  key={unit.title}
                  onClick={() => {
                    setSelectedUnit(unit);
                    if (onSelectUnit) onSelectUnit(unit.title, unit.canonicalCode);
                  }}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isUnitActive
                      ? "bg-primary/5 border-primary shadow-xs"
                      : "bg-background hover:bg-muted/40 border-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <CheckCircle2 className={`w-3.5 h-3.5 ${isUnitActive ? "text-primary" : "text-muted-foreground/50"}`} />
                        {unit.title}
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2">
                        {unit.description}
                      </p>
                    </div>
                    <span className="shrink-0 text-[10px] font-bold bg-muted px-2 py-0.5 rounded text-muted-foreground">
                      {unit.nominalHours}h
                    </span>
                  </div>
                  {unit.canonicalCode && (
                    <div className="mt-2 text-[10px] font-mono text-primary bg-primary/5 px-2 py-0.5 rounded inline-block">
                      {unit.canonicalCode}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {activeModule.hasIndustrialAttachmentAfter && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
              <Briefcase className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="font-semibold">
                {activeModule.attachmentTitle || "Mandatory Industrial Training Gateway"}
              </div>
            </div>
          )}
        </div>

        {/* Digitized Institutional Learning Plans in Codebase for this Module */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Digitized MTTI Learning Plans
            </h4>
            <span className="text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold px-2 py-0.5 rounded-full">
              {plansForActiveModule.length} Ready
            </span>
          </div>

          {plansForActiveModule.length === 0 ? (
            <div className="p-6 text-center rounded-xl bg-muted/20 border border-dashed border-border space-y-2">
              <Info className="w-8 h-8 text-muted-foreground/40 mx-auto" />
              <p className="text-xs text-muted-foreground">
                No digitized Learning Plan loaded for {activeModule.title} yet. You can upload or parse this syllabus in the Curriculum Hub.
              </p>
              <Link href="/curriculum-hub">
                <button className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold">
                  <BookOpen className="w-3.5 h-3.5" />
                  Parse Unit Document
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {plansForActiveModule.map((plan) => (
                <div
                  key={plan.metadata.unitCode}
                  className="p-3.5 rounded-xl border border-border bg-background space-y-2 hover:border-primary/50 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-foreground">
                        {plan.metadata.unitTitle}
                      </div>
                      <div className="text-[11px] font-mono text-muted-foreground">
                        {plan.metadata.unitCode} • Cohort: {plan.metadata.cohortCode}
                      </div>
                    </div>
                    <span className="text-[10px] bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded">
                      L{plan.metadata.level}
                    </span>
                  </div>

                  <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-1 border-t border-border/50">
                    <span>Trainer: <strong className="text-foreground">{plan.metadata.trainerName}</strong></span>
                    <span>{plan.schedule.length} Sessions</span>
                  </div>

                  <Link href={`/learning-plan?code=${encodeURIComponent(plan.metadata.unitCode)}`}>
                    <button className="w-full mt-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground text-xs font-semibold transition-all">
                      <span>View Form MTTI/F/CUR/02</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
