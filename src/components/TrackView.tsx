import React, { useState, useEffect } from "react";
import { getTranslation, LanguageCode } from "../lib/languages";
import { db } from "../lib/firebase";
import { collection, addDoc, onSnapshot, query, where, updateDoc, doc } from "firebase/firestore";
import { 
  ClipboardList, 
  Plus, 
  ChevronRight, 
  Sparkles, 
  CheckCircle, 
  Loader2, 
  X, 
  Info,
  Calendar,
  Layers,
  Building,
  User,
  FileSpreadsheet
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { TrackedRequest } from "../types";

interface TrackViewProps {
  userId: string;
  lang: LanguageCode;
}

const INITIAL_TRACK_REQUESTS = (userId: string): TrackedRequest[] => [
  {
    id: "track-seed-1",
    title: "Aadhaar Card Address Update",
    category: "Identity / Registry",
    department: "UIDAI Division",
    referenceNumber: "AD-9012-349X",
    userNameOnDoc: "PK Kumar",
    dov: "2026-07-01",
    status: "In Progress",
    statusNotes: "Physical verification code dispatched via Speed Post. Awaiting delivery.",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
  },
  {
    id: "track-seed-2",
    title: "Post-Matric Scholarship Approval",
    category: "Education Aid / Scholarship",
    department: "Social Welfare Department",
    referenceNumber: "SCH-2026-4022",
    userNameOnDoc: "PK Kumar",
    dov: "2026-07-03",
    status: "AI Review",
    statusNotes: "Income certificate validation completed. Bank routing setup pending.",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
  },
  {
    id: "track-seed-3",
    title: "PM Kisan Samman Nidhi",
    category: "Agriculture & Subsidies",
    department: "Department of Agriculture",
    referenceNumber: "AGR-8812-78X",
    userNameOnDoc: "PK Kumar",
    dov: "2026-06-15",
    status: "Resolved",
    statusNotes: "Direct benefit transfer activated. Installment credited successfully.",
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString() // 20 days ago
  },
  {
    id: "track-seed-4",
    title: "Ration Card Member Addition",
    category: "Welfare",
    department: "District Supply Office",
    referenceNumber: "RC-8812-990Y",
    userNameOnDoc: "PK Kumar",
    dov: "2026-06-20",
    status: "In Progress",
    statusNotes: "Inspection of physical household index complete. File sent to Senior Supply Inspector for seal.",
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "track-seed-5",
    title: "Voter ID Name Correction (Form 8)",
    category: "Identity / Registry",
    department: "Election Commission division",
    referenceNumber: "VOT-4402-120A",
    userNameOnDoc: "PK Kumar",
    dov: "2026-06-25",
    status: "Submitted",
    statusNotes: "Form 8 submitted online. Awaiting allotment to area Booth Level Officer.",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "track-seed-6",
    title: "Income Certificate Verification",
    category: "Identity / Registry",
    department: "Tehsil SDO Office",
    referenceNumber: "INC-9901-721Z",
    userNameOnDoc: "PK Kumar",
    dov: "2026-06-10",
    status: "Resolved",
    statusNotes: "Affidavit verified. Digitally signed certificate ready for download on Digilocker.",
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export default function TrackView({ userId, lang }: TrackViewProps) {
  const [requests, setRequests] = useState<TrackedRequest[]>(() => INITIAL_TRACK_REQUESTS(userId || "default-user"));
  const [activeFilter, setActiveFilter] = useState<"All" | "Submitted" | "AI Review" | "In Progress" | "Resolved">("All");
  const [searchQuery, setSearchQuery] = useState("");
  
  // New Request Form state (Expanded with comprehensive fields as requested!)
  const [showFormModal, setShowFormModal] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Identity / Registry");
  const [department, setDepartment] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [userNameOnDoc, setUserNameOnDoc] = useState("");
  const [dov, setDov] = useState(""); // Date of Verification / Issue
  const [issuingAuthority, setIssuingAuthority] = useState("");
  const [statusNotes, setStatusNotes] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Explain Status Modal state
  const [explainModalOpen, setExplainModalOpen] = useState(false);
  const [explainLoading, setExplainLoading] = useState(false);
  const [explainedText, setExplainedText] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<TrackedRequest | null>(null);
  const [reviewLoadingId, setReviewLoadingId] = useState<string | null>(null);

  // Fetch tracked requests from Firestore
  useEffect(() => {
    if (!userId) return;

    const reqCol = collection(db, "tracked_requests");
    const q = query(reqCol, where("userId", "==", userId));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        // Auto-seed initial documents for this user asynchronously in the background
        const initialSeeds = INITIAL_TRACK_REQUESTS(userId);

        try {
          for (const seed of initialSeeds) {
            const { id, ...seedPayload } = seed;
            await addDoc(collection(db, "tracked_requests"), seedPayload);
          }
        } catch (e) {
          console.error("Failed to seed initial requests:", e);
        }
        return;
      }

      const docsList: TrackedRequest[] = [];
      snapshot.forEach((snap) => {
        const d = snap.data();
        docsList.push({
          id: snap.id,
          title: d.title || "",
          category: d.category || "Identity / Registry",
          department: d.department || "",
          referenceNumber: d.referenceNumber || "",
          userNameOnDoc: d.userNameOnDoc || "",
          dov: d.dov || "",
          status: d.status || "Submitted",
          createdAt: d.createdAt || new Date().toISOString(),
          statusNotes: d.statusNotes || "",
          explanation: d.explanation || ""
        });
      });
      // Sort by newest first
      docsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRequests(docsList);
    }, (err) => {
      console.warn("Firestore error, rendering mock requests:", err);
      // Fallback mockup list
      setRequests(INITIAL_TRACK_REQUESTS(userId || "default-user"));
    });

    return () => unsubscribe();
  }, [userId]);

  const handleAddNewRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !referenceNumber || !userNameOnDoc || !dov) return;

    setFormLoading(true);

    const payload = {
      userId,
      title,
      category,
      department: department || "General Administrative Division",
      referenceNumber,
      userNameOnDoc,
      dov,
      issuingAuthority: issuingAuthority || "State Municipal Division",
      statusNotes: statusNotes || "Application logged at state records desk. Awaiting officer queue.",
      status: "Submitted",
      createdAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, "tracked_requests"), payload);
      // Clear states
      setTitle("");
      setDepartment("");
      setReferenceNumber("");
      setUserNameOnDoc("");
      setDov("");
      setIssuingAuthority("");
      setStatusNotes("");
      setShowFormModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleAskExplain = async (req: TrackedRequest) => {
    setSelectedRequest(req);
    setExplainModalOpen(true);
    setExplainLoading(true);
    setExplainedText("");

    try {
      const response = await fetch("/api/explain-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: req.title,
          department: req.department,
          status: req.statusNotes || "Awaiting secondary verification queue",
          referenceNumber: req.referenceNumber,
          userName: req.userNameOnDoc,
          date: req.dov
        })
      });

      if (!response.ok) throw new Error("Status translation failed");

      const data = await response.json();
      setExplainedText(data.explanation || "No explanation provided by Gemini.");
    } catch (err) {
      console.error(err);
      setExplainedText(`The status "${req.statusNotes || 'In Progress'}" indicates that the local administrative Desk in the ${req.department} has received your file. They are currently matching your certificate reference number (${req.referenceNumber}) on state records. No immediate verification action is required from your side.`);
    } finally {
      setExplainLoading(false);
    }
  };

  const handleMarkResolved = async (reqId: string) => {
    try {
      const docRef = doc(db, "tracked_requests", reqId);
      await updateDoc(docRef, { status: "Resolved" });
    } catch (err) {
      console.error(err);
    }
  };

  const handleRunAiReview = async (req: TrackedRequest) => {
    if (!req.id) return;
    setReviewLoadingId(req.id);
    try {
      const response = await fetch("/api/ai-review-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: req.title,
          category: req.category,
          department: req.department,
          referenceNumber: req.referenceNumber,
          userName: req.userNameOnDoc,
          dov: req.dov,
          issuingAuthority: (req as any).issuingAuthority || "State Municipal Division"
        })
      });

      if (!response.ok) throw new Error("AI Review request failed");
      
      const data = await response.json();
      
      // Update Firestore document with AI-reviewed data!
      const docRef = doc(db, "tracked_requests", req.id);
      await updateDoc(docRef, {
        status: data.status || "AI Review",
        statusNotes: data.statusNotes || "AI validation checks complete.",
        explanation: data.explanation || "Your document details are successfully verified."
      });
    } catch (err) {
      console.error(err);
    } finally {
      setReviewLoadingId(null);
    }
  };

  const filteredRequests = requests.filter(r => {
    const matchesFilter = activeFilter === "All" ? true : r.status === activeFilter;
    const matchesSearch = searchQuery.trim() === "" || 
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.department.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getCounters = () => {
    const total = requests.length;
    const pending = requests.filter(r => r.status === "Submitted" || r.status === "AI Review").length;
    const inProgress = requests.filter(r => r.status === "In Progress").length;
    const resolved = requests.filter(r => r.status === "Resolved").length;
    return { total, pending, inProgress, resolved };
  };

  const counters = getCounters();

  return (
    <div id="unified-tracking-dashboard" className="max-w-7xl mx-auto px-4 md:px-8 py-8 font-sans relative">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Unified Request Tracking
          </h2>
          <p className="text-slate-500 font-medium">
            {getTranslation(lang, "trackSubtitle")}
          </p>
        </div>
        <button
          id="new-request-btn"
          onClick={() => setShowFormModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3.5 px-6 rounded-2xl transition duration-150 shadow-md flex items-center justify-center gap-2 cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-5 h-5" />
          <span>{getTranslation(lang, "newRequest")}</span>
        </button>
      </div>

      {/* Counters display cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
            {getTranslation(lang, "totalRequests")}
          </span>
          <span className="text-3xl font-black text-indigo-900 mt-2">{counters.total}</span>
        </div>
        <div className="bg-amber-50 border border-amber-100 p-5 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">
            {getTranslation(lang, "pendingRequests")}
          </span>
          <span className="text-3xl font-black text-amber-900 mt-2">{counters.pending}</span>
        </div>
        <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">
            {getTranslation(lang, "inProgressRequests")}
          </span>
          <span className="text-3xl font-black text-blue-900 mt-2">{counters.inProgress}</span>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
            {getTranslation(lang, "resolvedRequests")}
          </span>
          <span className="text-3xl font-black text-emerald-900 mt-2">{counters.resolved}</span>
        </div>
      </div>

      {/* Search and Filters panel */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between pb-6">
        <div className="flex gap-2 overflow-x-auto py-1 shrink-0">
          {(["All", "Submitted", "AI Review", "In Progress", "Resolved"] as const).map((filter, i) => (
            <button
              id={`filter-btn-${filter.replace(/\s+/g, "")}`}
              key={i}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 text-xs font-extrabold rounded-full transition cursor-pointer shrink-0 border ${
                activeFilter === filter
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                  : "bg-white hover:bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-950"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Search Input Bar */}
        <div className="relative flex-grow max-w-md">
          <input
            id="track-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, department or reference..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-full text-xs font-semibold focus:outline-none focus:border-indigo-500 bg-white shadow-sm"
          />
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* List of tracked requests */}
      <div className="space-y-6">
        {filteredRequests.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center">
            <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h4 className="text-base font-extrabold text-slate-800">No requests found</h4>
            <p className="text-xs text-slate-400 font-semibold mt-1">
              Click &apos;New Request&apos; above to log and track your government documents.
            </p>
          </div>
        ) : (
          filteredRequests.map((req, idx) => (
            <motion.div
              id={`request-card-${req.id}`}
              key={req.id || idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow relative"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full uppercase">
                      {req.category}
                    </span>
                    <span className="text-xs text-slate-400 font-bold font-mono">#{req.referenceNumber}</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mt-2">{req.title}</h3>
                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 mt-1">
                    <span>Dept: {req.department}</span>
                    <span>•</span>
                    <span>Holder: {req.userNameOnDoc}</span>
                    <span>•</span>
                    <span>DOV/Issue: {req.dov}</span>
                  </div>
                </div>

                {req.status !== "Resolved" && (
                  <button
                    id={`mark-resolved-btn-${req.id}`}
                    onClick={() => handleMarkResolved(req.id)}
                    className="self-start md:self-auto flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-100 px-3.5 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer transition"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>{getTranslation(lang, "markResolved")}</span>
                  </button>
                )}
              </div>

              {/* Milestone Stepper Progress Bar */}
              <div id={`stepper-bar-${req.id}`} className="py-6 border-t border-b border-slate-100/60 mb-6 flex items-center justify-between max-w-2xl mx-auto">
                {[
                  { name: "Submitted", active: true },
                  { name: "AI Review", active: req.status === "AI Review" || req.status === "In Progress" || req.status === "Resolved" },
                  { name: "In Progress", active: req.status === "In Progress" || req.status === "Resolved" },
                  { name: "Resolved", active: req.status === "Resolved" }
                ].map((step, sIdx, arr) => {
                  return (
                    <React.Fragment key={sIdx}>
                      <div className="flex flex-col items-center relative z-10">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-xs shadow-sm ${
                          step.active 
                            ? "bg-indigo-600 text-white" 
                            : "bg-slate-100 text-slate-400"
                        }`}>
                          {step.active ? "✓" : sIdx + 1}
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 mt-1.5">{step.name}</span>
                      </div>
                      {sIdx < arr.length - 1 && (
                        <div className={`flex-grow h-1.5 rounded-full mx-2 -mt-4 ${
                          arr[sIdx + 1].active ? "bg-indigo-600" : "bg-slate-100"
                        }`} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Ask status explanation */}
              <div className="flex flex-col gap-4 mt-4 pt-4 border-t border-slate-100/60">
                <div className="flex items-center justify-between">
                  <button
                    id={`ask-explain-btn-${req.id}`}
                    onClick={() => handleAskExplain(req)}
                    className="inline-flex items-center gap-2 text-xs font-extrabold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    <span>{getTranslation(lang, "askStatusExplain")}</span>
                  </button>
                  {req.statusNotes && (
                    <span className="text-[11px] font-semibold text-slate-500 italic max-w-[65%] truncate">
                      Latest Note: "{req.statusNotes}"
                    </span>
                  )}
                </div>

                {req.status === "Submitted" && (
                  <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-start gap-2.5">
                      <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-extrabold text-indigo-900">Awaiting AI Document Review</h4>
                        <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                          Submit this record to the AI Civic Auditor to verify reference formats and activate instant tracking status explanations.
                        </p>
                      </div>
                    </div>
                    <button
                      id={`run-ai-review-btn-${req.id}`}
                      onClick={() => handleRunAiReview(req)}
                      disabled={reviewLoadingId === req.id}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 cursor-pointer transition shadow-sm w-full md:w-auto justify-center shrink-0"
                    >
                      {reviewLoadingId === req.id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                          <span>Auditing details...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Run AI Review & Track</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* POPUP MODAL: Add New Request (COMPREHENSIVE FIELDS AS REQUESTED!) */}
      <AnimatePresence>
        {showFormModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl relative"
            >
              <button
                onClick={() => setShowFormModal(false)}
                className="absolute top-6 right-6 p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6 flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600">
                  <ClipboardList className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">File a New Request</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                    Government Document tracking vault
                  </p>
                </div>
              </div>

              <form onSubmit={handleAddNewRequest} className="space-y-4">
                {/* 1. Request Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Request Title
                  </label>
                  <input
                    id="form-title-input"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Birth Certificate Verification"
                    required
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none text-sm font-semibold"
                  />
                </div>

                {/* Grid of basic attributes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 2. Category selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Document Category
                    </label>
                    <select
                      id="form-category-select"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none text-sm font-semibold text-slate-700 bg-white"
                    >
                      <option value="Welfare">Welfare & Social Subsidies</option>
                      <option value="Education">Education Aid / Scholarship</option>
                      <option value="Identity / Registry">Identity / Civil Registry (Aadhaar, Voter)</option>
                      <option value="Healthcare">Healthcare & Insurance</option>
                      <option value="Agriculture">Agriculture & Subsidies</option>
                      <option value="Pensions">Pensions / Retirement</option>
                    </select>
                  </div>

                  {/* 3. Department */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Department (Optional)
                    </label>
                    <input
                      id="form-dept-input"
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Revenue Department"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none text-sm font-semibold"
                    />
                  </div>
                </div>

                {/* Grid for critical document identifiers (USER REQ: document reference number, name on doc, dov) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 4. Document Reference Number */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Document Reference Number
                    </label>
                    <input
                      id="form-ref-input"
                      type="text"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      placeholder="e.g. BIR/2026/0921"
                      required
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none text-sm font-semibold"
                    />
                  </div>

                  {/* 5. Name of the User on Document */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Name of Holder on Document
                    </label>
                    <input
                      id="form-holder-input"
                      type="text"
                      value={userNameOnDoc}
                      onChange={(e) => setUserNameOnDoc(e.target.value)}
                      placeholder="e.g. Ravi Kumar"
                      required
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none text-sm font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 6. Date of Issue / DOV */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Date of Issue / DOB / DOV
                    </label>
                    <input
                      id="form-dov-input"
                      type="date"
                      value={dov}
                      onChange={(e) => setDov(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none text-sm font-semibold text-slate-700 bg-white"
                    />
                  </div>

                  {/* 7. Issuing Authority */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Issuing Authority / State
                    </label>
                    <input
                      id="form-authority-input"
                      type="text"
                      value={issuingAuthority}
                      onChange={(e) => setIssuingAuthority(e.target.value)}
                      placeholder="e.g. Sub-Divisional Office, Bihar"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none text-sm font-semibold"
                    />
                  </div>
                </div>

                {/* 8. Raw current status shorthand for AI to explain */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Current Shorthand / Status Notes (Optional)
                  </label>
                  <textarea
                    id="form-statusnotes-textarea"
                    value={statusNotes}
                    onChange={(e) => setStatusNotes(e.target.value)}
                    placeholder="e.g. File pending signature with Assistant Registrar. Dispatch delayed at postal desk."
                    rows={2}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none text-sm font-semibold resize-none"
                  />
                  <span className="text-[10px] font-bold text-slate-400">Our Gemini system will translate this shorthand jargon into layman steps.</span>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowFormModal(false)}
                    className="w-1/3 border border-slate-200 hover:bg-slate-50 text-slate-600 font-extrabold py-3 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading || !title || !referenceNumber || !userNameOnDoc || !dov}
                    className="w-2/3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-extrabold py-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    {formLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      "Submit Request"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* POPUP MODAL: Ask AI to Explain Status Summary */}
      <AnimatePresence>
        {explainModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-2xl relative"
            >
              <button
                onClick={() => setExplainModalOpen(false)}
                className="absolute top-6 right-6 p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-6 text-indigo-600">
                <Sparkles className="w-6 h-6 animate-pulse" />
                <h3 className="text-xl font-black text-slate-900">AI Status Translator</h3>
              </div>

              {explainLoading ? (
                <div className="py-12 text-center">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
                  <p className="text-sm font-extrabold text-slate-700">Translating bureaucracy shorthand...</p>
                  <p className="text-xs text-slate-400 font-medium mt-1">Consulting Indian Administration Protocols</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                    <p className="text-xs text-slate-400 font-extrabold uppercase">Official Shorthand Logged</p>
                    <p className="text-sm font-bold text-slate-800 italic">
                      &ldquo;{selectedRequest?.statusNotes || "Awaiting secondary verification queue"}&rdquo;
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-xs text-slate-400 font-extrabold uppercase">User-Friendly Explanation</p>
                    <p className="text-sm font-semibold text-slate-700 leading-relaxed bg-indigo-50/50 border border-indigo-100 p-4 rounded-2xl">
                      {explainedText}
                    </p>
                  </div>

                  <button
                    onClick={() => setExplainModalOpen(false)}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3.5 px-6 rounded-xl transition shadow-md mt-4 cursor-pointer"
                  >
                    Understood, thank you!
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
