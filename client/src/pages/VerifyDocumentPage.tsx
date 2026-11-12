/**
 * Mukiria Technical Training Institute (MTTI)
 * Official Public Document Verification Portal
 *
 * Allows employers, TVET CDACC regulatory auditors, trainers, and trainees
 * to scan the QR code on any exported broadsheet or attendance register to
 * cryptographically verify authenticity against the institutional ledger.
 */

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Award,
  Calendar,
  Users,
  Search,
  ExternalLink,
  Building2,
  FileText,
  Clock,
  Printer,
} from "lucide-react";

interface VerificationResponse {
  valid: boolean;
  verified?: boolean;
  document_type?: string;
  unit_code?: string;
  term?: string;
  academic_year?: string;
  total_candidates?: number;
  competent_count?: number;
  nyc_count?: number;
  average_mark?: number;
  hod_signoff?: boolean;
  hod_name?: string;
  short_hash?: string;
  issued_at?: string;
  issuer?: string;
  canonical_status?: string;
  verification_notes?: string;
  verification_timestamp?: string;
  error?: string;
}

export default function VerifyDocumentPage() {
  const [tokenInput, setTokenInput] = useState("");
  const [result, setResult] = useState<VerificationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    // Parse ?token=... from window.location.search
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get("token");
      if (urlToken) {
        setTokenInput(urlToken);
        verifyToken(urlToken);
      }
    }
  }, []);

  const verifyToken = async (tokenToVerify: string) => {
    if (!tokenToVerify.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/verify-document?token=${encodeURIComponent(tokenToVerify.trim())}`);
      const data: VerificationResponse = await res.json();
      setResult(data);
    } catch (err: any) {
      setResult({
        valid: false,
        error: "Network error: Unable to reach Mukiria verification authority. Please verify connectivity.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyToken(tokenInput);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Institutional Top Header */}
      <header className="bg-[#000953] text-white border-b-4 border-[#c48820] py-4 px-6 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center p-1 border-2 border-[#c48820] shadow-sm">
              <Building2 className="w-6 h-6 text-[#000953]" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-wide uppercase">
                Mukiria Technical Training Institute
              </h1>
              <p className="text-xs text-blue-200 tracking-wider">
                TVET CDACC Document Authenticity & Verification Gateway
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-950/60 border border-blue-400/30">
            <Award className="w-4 h-4 text-[#c48820]" />
            <span>KNQF Level 3–6 Accredited</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Verification Status Card */}
        {loading ? (
          <div className="p-8 text-center bg-white rounded-2xl border shadow-sm space-y-3">
            <div className="w-10 h-10 border-4 border-[#000953] border-t-transparent rounded-full animate-spin mx-auto" />
            <h3 className="font-bold text-sm text-[#000953]">
              Verifying Cryptographic Digital Seal...
            </h3>
            <p className="text-xs text-slate-500">
              Validating HMAC-SHA256 institutional signature against Mukiria canonical ledger.
            </p>
          </div>
        ) : searched && result ? (
          result.valid ? (
            <div className="bg-white rounded-2xl border border-emerald-300 shadow-lg overflow-hidden animate-in fade-in duration-300">
              {/* Authenticated Banner */}
              <div className="bg-emerald-600 text-white p-6 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 shadow-inner">
                  <ShieldCheck className="w-10 h-10 text-white" />
                </div>
                <div>
                  <div className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-700 text-emerald-100 text-[11px] font-bold tracking-wider uppercase mb-1">
                    Canonical Authentic Document
                  </div>
                  <h2 className="text-xl font-black">
                    TVET CDACC Official Document Verified
                  </h2>
                  <p className="text-xs text-emerald-100 mt-0.5">
                    Cryptographic seal matches canonical records. No tampering or post-issuance alterations detected.
                  </p>
                </div>
              </div>

              {/* Document Metadata Grid */}
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                      Document Type
                    </span>
                    <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5 capitalize">
                      <FileText className="w-4 h-4 text-[#000953]" />
                      {result.document_type?.replace(/_/g, " ") || "Continuous Assessment Broadsheet"}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                      Unit of Competence
                    </span>
                    <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5 font-mono">
                      <Award className="w-4 h-4 text-[#c48820]" />
                      {result.unit_code}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                      Academic Period
                    </span>
                    <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      {result.term} (AY {result.academic_year || "2026"})
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                      Candidate Cohort Size
                    </span>
                    <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-purple-600" />
                      {result.total_candidates} Registered Trainees
                    </div>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs space-y-3">
                  <h4 className="font-bold text-[#000953] flex items-center gap-1.5 text-xs uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Verified Broadsheet Performance Ledger
                  </h4>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-white border border-blue-100 shadow-2xs">
                      <div className="text-[10px] text-slate-500 font-semibold uppercase">Competent</div>
                      <div className="text-lg font-black text-emerald-700">{result.competent_count ?? 0}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-blue-100 shadow-2xs">
                      <div className="text-[10px] text-slate-500 font-semibold uppercase">Not Yet Comp.</div>
                      <div className="text-lg font-black text-amber-600">{result.nyc_count ?? 0}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-blue-100 shadow-2xs">
                      <div className="text-[10px] text-slate-500 font-semibold uppercase">Cohort Average</div>
                      <div className="text-lg font-black text-[#000953]">
                        {result.average_mark ? `${result.average_mark}%` : "N/A"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* HOD & Cryptographic Sign-Off Section */}
                <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 space-y-2 text-xs">
                  <div className="flex flex-col sm:flex-row justify-between gap-2 border-b border-slate-200 pb-2">
                    <div>
                      <span className="text-slate-500 text-[11px]">HOD Authorization: </span>
                      <span className="font-bold text-slate-900">
                        {result.hod_signoff ? "APPROVED & DIGITALLY ENDORSED" : "PENDING ENDORSEMENT"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px]">Signatory: </span>
                      <span className="font-semibold text-slate-800">{result.hod_name}</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between gap-1 text-[11px] text-slate-500 pt-1">
                    <div className="flex items-center gap-1 font-mono">
                      <span className="font-bold text-slate-700">Verification Seal:</span>
                      <span className="px-2 py-0.5 rounded bg-white border font-bold text-[#000953]">
                        {result.short_hash}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Issued: {result.issued_at ? new Date(result.issued_at).toLocaleString() : "Canonical"}</span>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 text-center">
                  Verified by Mukiria Technical Training Institute (MTTI) Academic Gateway on{" "}
                  {new Date().toLocaleString()}.
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-rose-300 shadow-lg overflow-hidden animate-in fade-in duration-300">
              <div className="bg-rose-600 text-white p-6 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                <div className="w-16 h-16 rounded-full bg-rose-500 flex items-center justify-center shrink-0 shadow-inner">
                  <ShieldAlert className="w-10 h-10 text-white" />
                </div>
                <div>
                  <div className="inline-block px-2.5 py-0.5 rounded-full bg-rose-700 text-rose-100 text-[11px] font-bold tracking-wider uppercase mb-1">
                    Authenticity Warning
                  </div>
                  <h2 className="text-xl font-black">
                    Document Verification Failed
                  </h2>
                  <p className="text-xs text-rose-100 mt-0.5">
                    The digital seal could not be verified. This document may have been altered, forged, or generated without institutional authorization.
                  </p>
                </div>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    Security Rejection Reason:
                  </div>
                  <p className="font-mono text-[11px] leading-relaxed">
                    {result.error || "Cryptographic HMAC signature does not match canonical broadsheet payload."}
                  </p>
                </div>
                <p className="text-slate-600 text-xs">
                  Please request an officially re-exported PDF broadsheet from the Mukiria TTI Academic Office or contact the Head of Department.
                </p>
              </div>
            </div>
          )
        ) : null}

        {/* Manual Token Verification Form */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
          <h3 className="font-bold text-xs uppercase tracking-wider text-[#000953] flex items-center gap-1.5">
            <Search className="w-4 h-4 text-[#c48820]" />
            Verify Document by Digital Token or URL
          </h3>
          <p className="text-xs text-slate-500">
            Paste a document verification token or full scan URL from an exported MTTI broadsheet or attendance register:
          </p>
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Paste verification token or URL here..."
              className="flex-1 px-3 py-2 text-xs border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#000953] font-mono"
            />
            <button
              type="submit"
              disabled={loading || !tokenInput.trim()}
              className="px-4 py-2 bg-[#000953] hover:bg-[#000e7a] text-white text-xs font-bold rounded-lg transition disabled:opacity-50"
            >
              Verify
            </button>
          </form>
        </div>
      </main>

      {/* Institutional Footer */}
      <footer className="border-t bg-white py-4 px-6 text-center text-xs text-slate-400">
        © 2026 Mukiria Technical Training Institute. TVET CDACC Official Academic Governance Subsystem.
      </footer>
    </div>
  );
}
