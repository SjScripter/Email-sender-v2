"use client";

import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { SchoolRecord } from "@/types";
import { StatusBadge } from "@/components/Badges";
import { cn } from "@/lib/utils";
import {
  CheckSquare,
  Square,
  Filter,
  Users,
  AlertTriangle,
  ChevronDown,
  Search,
} from "lucide-react";
import { toast } from "sonner";

export function SelectStep() {
  const { state, dispatch, goToStep } = useApp();
  const { schools, selectedSchoolIds } = state;

  const [filters, setFilters] = useState({
    board: "",
    area: "",
    priority: "",
    minScore: "",
    search: "",
    showInvalid: false,
  });

  const validSchools = useMemo(
    () => schools.filter((s) => s.status === "valid"),
    [schools]
  );
  const invalidSchools = useMemo(
    () => schools.filter((s) => s.status !== "valid"),
    [schools]
  );

  // Get unique filter values
  const boards = useMemo(
    () => [...new Set(validSchools.map((s) => s.board).filter(Boolean))] as string[],
    [validSchools]
  );
  const areas = useMemo(
    () => [...new Set(validSchools.map((s) => s.area).filter(Boolean))] as string[],
    [validSchools]
  );
  const priorities = useMemo(
    () => [...new Set(validSchools.map((s) => s.priority).filter(Boolean))] as string[],
    [validSchools]
  );

  const filteredSchools = useMemo(() => {
    return validSchools.filter((s) => {
      if (filters.board && s.board !== filters.board) return false;
      if (filters.area && s.area !== filters.area) return false;
      if (filters.priority && s.priority !== filters.priority) return false;
      if (filters.minScore) {
        const score = parseFloat(s.target_score || "0");
        if (score < parseFloat(filters.minScore)) return false;
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (
          !s.school_name.toLowerCase().includes(q) &&
          !s.email.toLowerCase().includes(q) &&
          !(s.principal_name || "").toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [validSchools, filters]);

  const allFilteredSelected = filteredSchools.every((s) =>
    selectedSchoolIds.has(s.id)
  );

  const toggleAll = () => {
    if (allFilteredSelected) {
      // Deselect filtered schools
      const next = new Set(selectedSchoolIds);
      filteredSchools.forEach((s) => next.delete(s.id));
      dispatch({ type: "SET_SELECTED_IDS", ids: next });
    } else {
      // Select filtered schools
      const next = new Set(selectedSchoolIds);
      filteredSchools.forEach((s) => next.add(s.id));
      dispatch({ type: "SET_SELECTED_IDS", ids: next });
    }
  };

  const toggleSchool = (id: string) => {
    dispatch({ type: "TOGGLE_SCHOOL", id });
  };

  const handleContinue = () => {
    if (selectedSchoolIds.size === 0) {
      toast.error("Please select at least one school.");
      return;
    }
    toast.success(`${selectedSchoolIds.size} schools selected.`);
    goToStep("compose");
  };

  const clearFilters = () => {
    setFilters({ board: "", area: "", priority: "", minScore: "", search: "", showInvalid: false });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Rows", value: schools.length, color: "blue" },
          { label: "Valid", value: validSchools.length, color: "green" },
          { label: "Issues", value: invalidSchools.length, color: "orange" },
          { label: "Selected", value: selectedSchoolIds.size, color: "purple" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-4 rounded-xl bg-white/3 border border-white/10 text-center"
          >
            <div
              className={cn(
                "text-2xl font-bold",
                stat.color === "blue" && "text-blue-400",
                stat.color === "green" && "text-green-400",
                stat.color === "orange" && "text-orange-400",
                stat.color === "purple" && "text-purple-400"
              )}
            >
              {stat.value}
            </div>
            <div className="text-xs text-white/50 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="p-4 rounded-xl bg-white/3 border border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-white/50" />
          <span className="text-sm font-medium text-white/70">Filters</span>
          {(filters.board || filters.area || filters.priority || filters.minScore || filters.search) && (
            <button onClick={clearFilters} className="ml-auto text-xs text-blue-400 hover:text-blue-300">
              Clear filters
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
            <input
              value={filters.search}
              onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
              placeholder="Search schools..."
              className="w-full pl-8 pr-3 py-2 text-xs bg-white/5 border border-white/10 rounded-lg text-white/80 focus:outline-none focus:border-blue-500/50"
            />
          </div>
          <SelectFilter
            value={filters.board}
            onChange={(v) => setFilters((p) => ({ ...p, board: v }))}
            options={boards}
            placeholder="All Boards"
          />
          <SelectFilter
            value={filters.area}
            onChange={(v) => setFilters((p) => ({ ...p, area: v }))}
            options={areas}
            placeholder="All Areas"
          />
          <SelectFilter
            value={filters.priority}
            onChange={(v) => setFilters((p) => ({ ...p, priority: v }))}
            options={priorities}
            placeholder="All Priorities"
          />
          <div>
            <input
              type="number"
              value={filters.minScore}
              onChange={(e) => setFilters((p) => ({ ...p, minScore: e.target.value }))}
              placeholder="Min Score"
              className="w-full px-3 py-2 text-xs bg-white/5 border border-white/10 rounded-lg text-white/80 focus:outline-none focus:border-blue-500/50"
            />
          </div>
        </div>
      </div>

      {/* Selection summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleAll}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border border-white/10 hover:border-blue-500/30 hover:text-blue-300 text-white/60 transition-all"
          >
            {allFilteredSelected ? (
              <CheckSquare className="w-4 h-4" />
            ) : (
              <Square className="w-4 h-4" />
            )}
            {allFilteredSelected ? "Deselect All Shown" : "Select All Shown"}
          </button>
          <button
            onClick={() => dispatch({ type: "DESELECT_ALL" })}
            className="text-xs text-white/40 hover:text-white/60 transition-colors"
          >
            Clear selection
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-white/40" />
          <span className="text-sm text-white/60">
            <span className="text-white font-semibold">{selectedSchoolIds.size}</span>{" "}
            of {filteredSchools.length} shown selected
          </span>
        </div>
      </div>

      {/* Schools table */}
      <div className="rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[#0f172a] z-10">
              <tr>
                <th className="w-10 px-4 py-3 border-b border-white/10"></th>
                <th className="px-4 py-3 text-left text-white/50 font-medium text-xs border-b border-white/10 whitespace-nowrap">School Name</th>
                <th className="px-4 py-3 text-left text-white/50 font-medium text-xs border-b border-white/10 whitespace-nowrap">Email</th>
                <th className="px-4 py-3 text-left text-white/50 font-medium text-xs border-b border-white/10 whitespace-nowrap">Principal</th>
                <th className="px-4 py-3 text-left text-white/50 font-medium text-xs border-b border-white/10 whitespace-nowrap">Area</th>
                <th className="px-4 py-3 text-left text-white/50 font-medium text-xs border-b border-white/10 whitespace-nowrap">Board</th>
                <th className="px-4 py-3 text-left text-white/50 font-medium text-xs border-b border-white/10 whitespace-nowrap">Score</th>
                <th className="px-4 py-3 text-left text-white/50 font-medium text-xs border-b border-white/10 whitespace-nowrap">Priority</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchools.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-white/40 text-sm">
                    No schools match the current filters
                  </td>
                </tr>
              ) : (
                filteredSchools.map((school) => {
                  const isSelected = selectedSchoolIds.has(school.id);
                  return (
                    <tr
                      key={school.id}
                      onClick={() => toggleSchool(school.id)}
                      className={cn(
                        "cursor-pointer border-b border-white/5 last:border-0 transition-colors",
                        isSelected ? "bg-blue-500/8" : "hover:bg-white/2"
                      )}
                    >
                      <td className="w-10 px-4 py-3">
                        <div
                          className={cn(
                            "w-4 h-4 rounded border-2 flex items-center justify-center transition-all",
                            isSelected
                              ? "bg-blue-500 border-blue-500"
                              : "border-white/20"
                          )}
                        >
                          {isSelected && (
                            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 12 12">
                              <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-white/90 whitespace-nowrap">
                        {school.school_name}
                      </td>
                      <td className="px-4 py-3 text-white/50 text-xs whitespace-nowrap">
                        {school.email}
                      </td>
                      <td className="px-4 py-3 text-white/60 whitespace-nowrap text-xs">
                        {school.principal_name || "—"}
                      </td>
                      <td className="px-4 py-3 text-white/60 whitespace-nowrap text-xs">
                        {school.area || "—"}
                      </td>
                      <td className="px-4 py-3 text-white/60 whitespace-nowrap text-xs">
                        {school.board || "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {school.target_score ? (
                          <span className={cn(
                            "text-xs font-semibold px-2 py-0.5 rounded-full",
                            parseFloat(school.target_score) >= 80
                              ? "text-green-400 bg-green-500/10"
                              : parseFloat(school.target_score) >= 60
                              ? "text-yellow-400 bg-yellow-500/10"
                              : "text-red-400 bg-red-500/10"
                          )}>
                            {school.target_score}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs">
                        {school.priority ? (
                          <span className={cn(
                            "px-2 py-0.5 rounded-full font-medium",
                            school.priority.toLowerCase() === "high"
                              ? "text-red-300 bg-red-500/10"
                              : school.priority.toLowerCase() === "medium"
                              ? "text-yellow-300 bg-yellow-500/10"
                              : "text-green-300 bg-green-500/10"
                          )}>
                            {school.priority}
                          </span>
                        ) : "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invalid schools warning */}
      {invalidSchools.length > 0 && (
        <div
          className="flex items-center gap-3 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 cursor-pointer"
          onClick={() => setFilters((p) => ({ ...p, showInvalid: !p.showInvalid }))}
        >
          <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-orange-300">
              {invalidSchools.length} records excluded due to validation issues
            </p>
            <p className="text-xs text-orange-400/70">
              These records will not be emailed. Click to view details.
            </p>
          </div>
          <ChevronDown
            className={cn(
              "w-4 h-4 text-orange-400 transition-transform",
              filters.showInvalid && "rotate-180"
            )}
          />
        </div>
      )}

      {filters.showInvalid && invalidSchools.length > 0 && (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-white/3 border-b border-white/10">
                <th className="px-4 py-2 text-left text-white/50 font-medium">School</th>
                <th className="px-4 py-2 text-left text-white/50 font-medium">Email</th>
                <th className="px-4 py-2 text-left text-white/50 font-medium">Issue</th>
              </tr>
            </thead>
            <tbody>
              {invalidSchools.map((s) => (
                <tr key={s.id} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-2 text-white/70">{s.school_name}</td>
                  <td className="px-4 py-2 text-white/50">{s.email || "—"}</td>
                  <td className="px-4 py-2">
                    <StatusBadge status={s.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => goToStep("map")}
          className="px-5 py-2.5 rounded-xl border border-white/10 hover:border-white/20 text-white/60 hover:text-white/80 text-sm font-medium transition-all"
        >
          ← Back
        </button>
        <button
          onClick={handleContinue}
          disabled={selectedSchoolIds.size === 0}
          className="flex-1 py-3 rounded-xl bg-blue-500 hover:bg-blue-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/20"
        >
          Continue with {selectedSchoolIds.size} Selected Schools →
        </button>
      </div>
    </div>
  );
}

function SelectFilter({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/80 focus:outline-none focus:border-blue-500/50"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/30 pointer-events-none" />
    </div>
  );
}
