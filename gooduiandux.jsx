"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  BookOpen,
  LogOut,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Camera,
  X,
  Upload,
} from "lucide-react"

interface Student {
  id: string
  first_name: string
  last_name: string
  apogee_code: string
  cne: string
  avatar_url: string | null
}

interface Grade {
  id: number
  module_name: string
  semester: number
  normalNote: number | null
  ratNote: number | null
}

interface Exam {
  id: number
  module: string
  date: string
  time: string
  type: string
  fullDateTime: Date
}

type TabType = "normal" | "rattrapage" | "final"

function NavItem({ active, label }: { active?: boolean; label: string }) {
  return (
    <button
      className={cn(
        "w-full px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 text-left",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
      )}
    >
      {label}
    </button>
  )
}

function StatCard({
  label,
  value,
  suffix,
}: {
  label: string
  value: string | number
  suffix?: string
}) {
  return (
    <div className="bg-card rounded-3xl border border-border/50 p-6 shadow-sm hover:shadow-md transition-all duration-300">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
        {label}
      </p>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold text-foreground">{value}</span>
        {suffix && (
          <span className="text-sm text-muted-foreground">{suffix}</span>
        )}
      </div>
    </div>
  )
}

export default function StudentDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  // Data States
  const [student, setStudent] = useState<Student | null>(null)
  const [gradesData, setGradesData] = useState<Grade[]>([])
  const [examsData, setExamsData] = useState<Exam[]>([])

  // UI States
  const [selectedSemester, setSelectedSemester] = useState(1)
  const [selectedTab, setSelectedTab] = useState<TabType>("normal")

  // Edit Profile States
  const [showEditModal, setShowEditModal] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    fetchStudentData()
  }, [])

  async function fetchStudentData() {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()
      if (authError || !user) {
        router.push("/student-login")
        return
      }

      // 1. Fetch Student Info
      const { data: studentData } = await supabase
        .from("students")
        .select("*")
        .eq("id", user.id)
        .single()

      if (studentData) {
        setStudent(studentData)
      }

      // 2. Fetch Modules & Grades
      const { data: allModules } = await supabase.from("modules").select("*")
      const { data: dbGrades } = await supabase
        .from("grades")
        .select("id, normal_note, rattrapage_note, module_id")
        .eq("student_id", user.id)

      const formattedGrades = (allModules || []).map(
        (mod: { id: number; module_name: string; semester_id: number }) => {
          const studentGrade = (dbGrades || []).find(
            (g: { module_id: number }) => g.module_id === mod.id
          )
          return {
            id: mod.id,
            module_name: mod.module_name,
            semester: mod.semester_id,
            normalNote: studentGrade?.normal_note ?? null,
            ratNote: studentGrade?.rattrapage_note ?? null,
          }
        }
      )
      setGradesData(formattedGrades)

      // 3. Fetch Exams
      const { data: dbExams } = await supabase
        .from("exams")
        .select("id, date, time, type, modules(module_name)")

      if (dbExams) {
        const now = new Date()

        const processedExams = dbExams
          .map(
            (e: {
              id: number
              date: string
              time: string
              type: string
              modules: { module_name: string } | null
            }) => {
              const examDateTime = new Date(`${e.date}T${e.time}`)

              return {
                id: e.id,
                module: e.modules?.module_name || "Exam",
                date: e.date,
                time: e.time,
                type: e.type,
                fullDateTime: examDateTime,
              }
            }
          )
          .filter((exam: Exam) => {
            const examPlus4Hours = new Date(
              exam.fullDateTime.getTime() + 4 * 60 * 60 * 1000
            )
            return now <= examPlus4Hours
          })
          .sort(
            (a: Exam, b: Exam) =>
              a.fullDateTime.getTime() - b.fullDateTime.getTime()
          )

        setExamsData(processedExams)
      }
    } catch (error) {
      console.error("Fetch Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateAvatar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!avatarFile || !student) return

    // Check file size (max 1MB)
    const MAX_FILE_SIZE = 1024 * 1024
    if (avatarFile.size > MAX_FILE_SIZE) {
      alert("Image is too large. Please choose a file smaller than 1 MB.")
      return
    }

    setIsUpdating(true)
    try {
      // 1. Create unique filename
      const fileExt = avatarFile.name.split(".").pop()
      const fileName = `${student.id}-${Date.now()}.${fileExt}`

      // 2. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, avatarFile, {
          cacheControl: "3600",
          upsert: true,
        })

      if (uploadError) throw uploadError

      // 3. Get Public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(fileName)

      // 4. Update student record
      const { error: dbError } = await supabase
        .from("students")
        .update({ avatar_url: publicUrl })
        .eq("id", student.id)

      if (dbError) throw dbError

      // 5. Update local state
      setStudent((prev) => (prev ? { ...prev, avatar_url: publicUrl } : null))
      setShowEditModal(false)
      setAvatarFile(null)
    } catch (error) {
      console.error("Upload Error:", error)
      alert("Error updating profile picture.")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  // --- LOGIC CALCULATIONS ---
  const currentSemesterGrades = gradesData.filter(
    (g) => g.semester === selectedSemester
  )

  let displayedGrades: Grade[] = []
  if (selectedTab === "normal") {
    displayedGrades = currentSemesterGrades
  } else if (selectedTab === "rattrapage") {
    displayedGrades = currentSemesterGrades.filter(
      (g) => g.normalNote === null || (g.normalNote !== null && g.normalNote < 10)
    )
  } else if (selectedTab === "final") {
    displayedGrades = currentSemesterGrades
  }

  const getSemesterStats = () => {
    const grades = currentSemesterGrades.filter(
      (g) => g.normalNote !== null || g.ratNote !== null
    )
    if (grades.length === 0)
      return { average: "0.00", passed: 0, total: currentSemesterGrades.length }

    const bestNotes = grades.map((g) =>
      Math.max(g.normalNote || 0, g.ratNote || 0)
    )
    const average = bestNotes.reduce((a, b) => a + b, 0) / grades.length
    const passed = bestNotes.filter((n) => n >= 10).length

    return {
      average: average.toFixed(2),
      passed,
      total: currentSemesterGrades.length,
    }
  }

  const stats = getSemesterStats()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-card/80 backdrop-blur-xl border-r border-border/50 z-50 hidden lg:flex flex-col">
        <div className="p-6 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-bold text-sm">
              2A
            </div>
            <div>
              <h1 className="font-semibold text-foreground text-sm">
                Master 2APD
              </h1>
              <p className="text-xs text-muted-foreground">Student Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <NavItem active label="Dashboard" />
          <NavItem label="Grades" />
          <NavItem label="Schedule" />
          <NavItem label="Documents" />
          <NavItem label="Settings" />
        </nav>

        <div className="p-4 border-t border-border/50">
          <button
            onClick={handleSignOut}
            className="w-full px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-all duration-200 text-left flex items-center gap-2"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:pl-64">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-bold text-xs">
                2A
              </div>
              <span className="font-semibold text-sm">Master 2APD</span>
            </div>
            <button
              onClick={handleSignOut}
              className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-destructive rounded-xl transition-colors"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
              Welcome back, {student?.first_name || "Student"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {"Here's"} an overview of your academic progress
            </p>
          </div>

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
            {/* Profile Card */}
            <div className="lg:col-span-4 bg-card rounded-3xl border border-border/50 p-6 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden">
              <div className="absolute -top-20 -right-20 w-48 h-48 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full blur-3xl pointer-events-none"></div>
              <div className="flex flex-col items-center text-center relative">
                <button
                  onClick={() => setShowEditModal(true)}
                  className="relative group mb-4"
                >
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary text-3xl font-bold overflow-hidden ring-4 ring-background shadow-lg">
                    {student?.avatar_url ? (
                      <img
                        src={student.avatar_url}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      student?.first_name?.[0] || "?"
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-foreground text-background rounded-xl flex items-center justify-center shadow-lg group-hover:bg-primary transition-colors border-2 border-background">
                    <Camera size={14} />
                  </div>
                </button>

                <h2 className="text-xl font-bold text-foreground">
                  {student?.first_name} {student?.last_name}
                </h2>
                <p className="text-xs font-medium text-primary uppercase tracking-wider mt-1">
                  Master 2APD
                </p>

                <div className="flex gap-3 mt-6 w-full">
                  <div className="flex-1 bg-muted/50 rounded-2xl p-3">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                      Apogee
                    </p>
                    <p className="text-sm font-bold text-foreground mt-0.5">
                      {student?.apogee_code}
                    </p>
                  </div>
                  <div className="flex-1 bg-muted/50 rounded-2xl p-3">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                      CNE
                    </p>
                    <p className="text-sm font-bold text-foreground mt-0.5">
                      {student?.cne}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="lg:col-span-8 grid grid-cols-3 gap-4">
              <StatCard label="Average" value={stats.average} suffix="/20" />
              <StatCard
                label="Validated"
                value={stats.passed}
                suffix={`/${stats.total}`}
              />
              <StatCard
                label="Upcoming"
                value={examsData.length}
                suffix="exams"
              />
            </div>

            {/* Grades Section */}
            <div className="lg:col-span-8 bg-card rounded-3xl border border-border/50 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-border/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h2 className="text-lg font-bold text-foreground">
                    Transcript
                  </h2>

                  <div className="flex gap-2 bg-muted/50 p-1 rounded-xl">
                    {[1, 2, 3].map((sem) => (
                      <button
                        key={sem}
                        onClick={() => setSelectedSemester(sem)}
                        className={cn(
                          "px-4 py-2 text-xs font-medium rounded-lg transition-all duration-200",
                          selectedSemester === sem
                            ? "bg-card text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        S{sem}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Session Tabs */}
                <div className="flex gap-1 mt-4 bg-muted/30 p-1 rounded-xl">
                  {(["normal", "rattrapage", "final"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setSelectedTab(tab)}
                      className={cn(
                        "flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200",
                        selectedTab === tab
                          ? tab === "final"
                            ? "bg-emerald-50 text-emerald-700 shadow-sm"
                            : "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {tab === "normal" && "Normal Session"}
                      {tab === "rattrapage" && "Retake"}
                      {tab === "final" && "Final Grade"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4">
                {displayedGrades.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground text-sm bg-muted/30 rounded-2xl">
                    No modules available for this session.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {displayedGrades.map((grade) => {
                      const nNote = grade.normalNote
                      const rNote = grade.ratNote
                      const bestNote = Math.max(nNote || 0, rNote || 0)
                      const hasAnyGrade = nNote !== null || rNote !== null

                      let status = {
                        label: "--",
                        color: "bg-muted text-muted-foreground",
                        Icon: null as React.ComponentType<{
                          size?: number
                        }> | null,
                      }

                      if (selectedTab === "normal") {
                        if (nNote !== null) {
                          status =
                            nNote >= 10
                              ? {
                                  label: "V",
                                  color: "bg-emerald-100 text-emerald-700",
                                  Icon: CheckCircle2,
                                }
                              : {
                                  label: "Retake",
                                  color: "bg-amber-100 text-amber-700",
                                  Icon: AlertCircle,
                                }
                        }
                      } else if (selectedTab === "rattrapage") {
                        if (rNote !== null || nNote !== null) {
                          status =
                            bestNote >= 10
                              ? {
                                  label: "VR",
                                  color: "bg-emerald-100 text-emerald-700",
                                  Icon: CheckCircle2,
                                }
                              : {
                                  label: "NV",
                                  color: "bg-red-100 text-red-700",
                                  Icon: XCircle,
                                }
                        }
                      } else if (selectedTab === "final") {
                        if (hasAnyGrade) {
                          if (nNote !== null && nNote >= 10) {
                            status = {
                              label: "V",
                              color: "bg-emerald-100 text-emerald-700",
                              Icon: CheckCircle2,
                            }
                          } else if (bestNote >= 10) {
                            status = {
                              label: "VR",
                              color: "bg-emerald-100 text-emerald-700",
                              Icon: CheckCircle2,
                            }
                          } else {
                            status = {
                              label: "NV",
                              color: "bg-red-100 text-red-700",
                              Icon: XCircle,
                            }
                          }
                        }
                      }

                      return (
                        <div
                          key={grade.id}
                          className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                              <BookOpen size={18} />
                            </div>
                            <span className="font-medium text-foreground text-sm">
                              {grade.module_name}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            {selectedTab === "normal" && (
                              <span className="text-sm font-bold text-foreground bg-muted px-3 py-1.5 rounded-lg min-w-[3rem] text-center">
                                {nNote !== null ? nNote : "--"}
                              </span>
                            )}

                            {selectedTab === "rattrapage" && (
                              <span className="text-sm font-bold text-foreground bg-muted px-3 py-1.5 rounded-lg min-w-[3rem] text-center">
                                {rNote !== null ? rNote : "--"}
                              </span>
                            )}

                            {selectedTab === "final" && (
                              <>
                                <span className="text-xs text-muted-foreground">
                                  {nNote ?? "--"}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {rNote ?? "--"}
                                </span>
                                <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg min-w-[3rem] text-center">
                                  {hasAnyGrade ? bestNote : "--"}
                                </span>
                              </>
                            )}

                            <span
                              className={cn(
                                "text-xs font-bold px-2.5 py-1 rounded-lg inline-flex items-center gap-1",
                                status.color
                              )}
                            >
                              {status.Icon && <status.Icon size={12} />}
                              {status.label}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Exams Section */}
            <div className="lg:col-span-4 bg-card rounded-3xl border border-border/50 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Calendar className="text-primary" size={20} />
                Upcoming Exams
              </h2>

              {examsData.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-sm bg-muted/30 rounded-2xl">
                  No exams scheduled.
                </div>
              ) : (
                <div className="space-y-3">
                  {examsData.map((exam) => (
                    <div
                      key={exam.id}
                      className="p-4 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-all duration-200 group border border-transparent hover:border-primary/10"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span
                          className={cn(
                            "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md",
                            exam.type === "normal"
                              ? "bg-primary/10 text-primary"
                              : "bg-amber-100 text-amber-700"
                          )}
                        >
                          {exam.type === "normal" ? "Normal" : "Retake"}
                        </span>
                      </div>
                      <h3 className="font-semibold text-foreground text-sm mb-3">
                        {exam.module}
                      </h3>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground border-t border-border/50 pt-3">
                        <span className="flex items-center gap-1.5">
                          <Calendar
                            size={14}
                            className="group-hover:text-primary transition-colors"
                          />
                          {exam.date}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock
                            size={14}
                            className="group-hover:text-primary transition-colors"
                          />
                          {exam.time}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Edit Avatar Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/20 backdrop-blur-sm">
          <div className="bg-card w-full max-w-sm rounded-3xl shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => {
                setShowEditModal(false)
                setAvatarFile(null)
              }}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
            >
              <X size={16} />
            </button>

            <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4">
              <Upload size={24} />
            </div>

            <h2 className="text-xl font-bold text-foreground mb-1">
              Update Photo
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Upload a new profile picture (Max: 1 MB. PNG, JPG, WEBP).
            </p>

            <form onSubmit={handleUpdateAvatar} className="space-y-5">
              <div>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                  required
                  className="w-full text-sm text-muted-foreground file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-muted file:text-foreground hover:file:bg-muted/80 file:cursor-pointer transition-all border-2 border-dashed border-border rounded-xl p-2 focus:outline-none focus:border-primary"
                />
              </div>
              <button
                disabled={isUpdating || !avatarFile}
                type="submit"
                className="w-full bg-foreground text-background rounded-xl py-3.5 text-sm font-semibold hover:bg-foreground/90 shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isUpdating ? (
                  <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                ) : (
                  "Upload and Save"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}