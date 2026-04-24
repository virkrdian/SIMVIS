import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "jspdf-autotable";
import Papa from "papaparse";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import {
  downloadTaskPDF,
  downloadTaskTXT,
  getEvidenceLinks,
} from "../../utils/taskExport";
import AnalyticsDashboard from "./AnalyticsDashboard";

export default function ManagerDashboard() {
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const BRAND_LEFT_LOGO_URL =
    process.env.REACT_APP_BRAND_LEFT_LOGO_URL || "/brand-left.png";
  const BRAND_RIGHT_LOGO_URL =
    process.env.REACT_APP_BRAND_RIGHT_LOGO_URL || "/brand-right.png";
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]); // State untuk tasks
  const [taskStatusFilter, setTaskStatusFilter] = useState("pending");
  const [segments, setSegments] = useState([]);
  const [segmentName, setSegmentName] = useState("");
  const [segmentNotice, setSegmentNotice] = useState("");
  const [isSegmentSubmitting, setIsSegmentSubmitting] = useState(false);
  const reportRef = useRef(null); // Ref untuk export image
  const [leftLogoFailed, setLeftLogoFailed] = useState(false);
  const [rightLogoFailed, setRightLogoFailed] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [activeTab, setActiveTab] = useState("overview"); // 'overview', 'tasks', 'officers'
  const authHeader = {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  };

  const FALLBACK_LEFT_LOGO = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="150" viewBox="0 0 300 150">
       <g transform="translate(10, 25)">
          <text x="5" y="90" font-family="Georgia, serif" font-weight="bold" font-size="100" fill="#2563EB">S</text>
          <text x="80" y="80" font-family="Arial, sans-serif" font-weight="bold" font-size="45" fill="#2563EB">SIMVIS</text>
       </g>
    </svg>`
  )}`;

  const FALLBACK_RIGHT_LOGO = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 150">
       <style>
         .text { font-family: "Trebuchet MS", Arial, sans-serif; fill: #000000; }
         .bold { font-weight: bold; }
         .italic { font-style: italic; }
         .blue { fill: #2563EB; }
         .gray { stroke: #555555; stroke-width: 14; fill: none; }
       </style>
       <text x="10" y="55" class="text bold" font-size="52" fill="#2563EB">SIMVIS</text>
       <text x="10" y="105" class="text bold" font-size="52" fill="#2563EB">Dashboard</text>
       
       <g transform="translate(360, 75) scale(0.9)">
         <circle cx="0" cy="0" r="45" class="gray" />
       </g>
     </svg>`
  )}`;

  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "officer",
  });

  const [isImporting, setIsImporting] = useState(false);
  const [importNotice, setImportNotice] = useState("");

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(profileData),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Profil berhasil diperbarui!");
        setShowProfile(false);
        setProfileData({ ...profileData, password: "" });
      } else {
        toast.error(data.message || "Gagal update profil");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan saat update profil");
    }
  };

  useEffect(() => {
    if (showProfile) {
      fetch(`${API_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data)
            setProfileData({
              name: data.name,
              email: data.email,
              password: "",
            });
        });
    }
  }, [showProfile]);

  const processImportedData = async (data, fileInput) => {
    if (data.length === 0) {
      setImportNotice("File kosong");
      setIsImporting(false);
      return;
    }

    // Map fields to Task fields
    // Supports CSV headers or Excel columns: Title, Description, Location, Reward, Latitude, Longitude, Segment
    const mappedData = data.map((row) => ({
      title: row.Title || row.title || row.Judul || "Untitled Task",
      description: row.Description || row.description || row.Deskripsi || "",
      location: row.Location || row.location || row.Lokasi || "",
      reward: row.Reward || row.reward || 0,
      latitude: parseFloat(row.Latitude || row.latitude || 0),
      longitude: parseFloat(row.Longitude || row.longitude || 0),
      segment: row.Segment || row.segment || "",
    }));

    try {
      setImportNotice(`Mengupload ${mappedData.length} tasks...`);
      const res = await fetch(`${API_URL}/api/tasks/import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
        body: JSON.stringify(mappedData),
      });

      const resData = await res.json();
      if (res.ok) {
        toast.success(`Berhasil import: ${resData.count} tasks`);
        setImportNotice("");
        fetchTasks(); // Refresh list
      } else {
        setImportNotice(
          "Gagal import: " + (resData.message || "Unknown error")
        );
        toast.error("Gagal import data");
      }
    } catch (err) {
      setImportNotice("Gagal menghubungi server");
      toast.error("Gagal menghubungi server");
      console.error(err);
    } finally {
      setIsImporting(false);
      if (fileInput) fileInput.value = null; // Reset file input
    }
  };

  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImportNotice("Membaca file...");
    setIsImporting(true);

    const fileExtension = file.name.split(".").pop().toLowerCase();

    if (fileExtension === "csv") {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            setImportNotice(
              "Error saat membaca CSV: " + results.errors[0].message
            );
            toast.error("Gagal parsing CSV");
            setIsImporting(false);
            return;
          }
          processImportedData(results.data, e.target);
        },
        error: (err) => {
          setImportNotice("Gagal parsing CSV: " + err.message);
          toast.error("Gagal parsing CSV");
          setIsImporting(false);
        },
      });
    } else if (fileExtension === "xlsx" || fileExtension === "xls") {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target.result;
          const wb = XLSX.read(bstr, { type: "binary" });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws);
          processImportedData(data, e.target);
        } catch (err) {
          setImportNotice("Gagal parsing Excel: " + err.message);
          toast.error("Gagal parsing Excel");
          setIsImporting(false);
        }
      };
      reader.onerror = () => {
        setImportNotice("Gagal membaca file Excel");
        toast.error("Gagal membaca file Excel");
        setIsImporting(false);
      };
      reader.readAsBinaryString(file);
    } else {
      setImportNotice("Format file tidak didukung. Gunakan .csv atau .xlsx");
      toast.error("Format file tidak didukung");
      setIsImporting(false);
    }
  };

  const fetchUsers = () => {
    fetch(`${API_URL}/api/auth/all`, { headers: authHeader })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setUsers(data);
        } else {
          setUsers([]);
        }
      })
      .catch((err) => {
        console.error(err);
        setUsers([]);
      });
  };

  const fetchTasks = () => {
    fetch(`${API_URL}/api/tasks`, { headers: authHeader })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setTasks(data);
        else setTasks([]);
      })
      .catch((err) => console.error(err));
  };

  const fetchSegments = () => {
    fetch(`${API_URL}/api/segments`, { headers: authHeader })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setSegments(data);
        } else {
          setSegments([]);
        }
      })
      .catch(() => setSegments([]));
  };

  useEffect(() => {
    fetchUsers();
    fetchTasks();
    fetchSegments();
    const interval = setInterval(() => {
      fetchUsers();
      fetchTasks();
      fetchSegments();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // --- EXPORT FUNCTIONS ---
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Laporan Semua Tugas", 14, 20);
    const tableColumn = [
      "Judul",
      "Segment",
      "Diselesaikan Oleh",
      "Status",
      "PIC",
      "Telp PIC",
      "Prespek",
      "Catatan",
      "Bukti",
    ];
    const tableRows = [];

    filteredTasks.forEach((t) => {
      const completedBy = t.completedBy?.name || t.assignedTo?.name || "-";
      const evidence = (() => {
        const links = getEvidenceLinks(t, API_URL);
        if (links.length === 0) return "-";
        return links.map((l) => `${l.label}: ${l.url}`).join("\n");
      })();
      tableRows.push([
        t.title,
        t.segment || "-",
        completedBy,
        t.status,
        t.picName || "-",
        t.picPhone || "-",
        t.prospects ?? 0,
        t.notes || "-",
        evidence,
      ]);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 25,
      columnStyles: {
        7: { cellWidth: 55, overflow: "linebreak" },
        8: { cellWidth: 55, overflow: "linebreak" },
      },
    });
    doc.save("laporan_manager.pdf");
  };

  const exportTXT = () => {
    let content = "LAPORAN MANAGER - SEMUA TUGAS\n\n";
    filteredTasks.forEach((t) => {
      const completedBy = t.completedBy?.name || t.assignedTo?.name || "-";
      const evidence = (() => {
        const links = getEvidenceLinks(t, API_URL);
        if (links.length === 0) return "Tidak ada";
        return links.map((l) => `${l.label}: ${l.url}`).join(" | ");
      })();
      content += `Judul: ${t.title}\nSegment: ${
        t.segment || "-"
      }\nDiselesaikan Oleh: ${completedBy}\nStatus: ${t.status}\nPIC: ${
        t.picName || "-"
      }\nTelp PIC: ${t.picPhone || "-"}\nPrespek: ${
        t.prospects ?? 0
      }\nCatatan: ${t.notes || "-"}\nBukti: ${evidence}\n-------------------\n`;
    });
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "laporan_manager.txt";
    a.click();
  };

  const exportImage = async () => {
    if (reportRef.current) {
      const canvas = await html2canvas(reportRef.current);
      const imgData = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = imgData;
      a.download = "laporan_manager.png";
      a.click();
    }
  };

  const exportTaskPDF = async (t) => {
    try {
      await downloadTaskPDF(t, API_URL, {
        header: "LAPORAN TASK - MANAGER",
        fileNamePrefix: "task_manager",
        logoUrl: rightLogoFailed ? FALLBACK_RIGHT_LOGO : BRAND_RIGHT_LOGO_URL,
      });
    } catch (e) {
      console.error("Export PDF error:", e);
      toast.error("Gagal mengunduh PDF (mungkin gambar tidak dapat dimuat)");
    }
  };

  const exportTaskTXT = (t) => {
    downloadTaskTXT(t, API_URL, {
      header: "LAPORAN TASK - MANAGER",
      fileNamePrefix: "task_manager",
    });
  };

  const submitUser = (e) => {
    e.preventDefault();
    fetch(`${API_URL}/api/auth/create-officer`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader },
      body: JSON.stringify(userForm),
    }).then((res) => {
      if (res.ok) {
        toast.success("Officer berhasil ditambahkan");
        setUserForm({ name: "", email: "", password: "", role: "officer" });
        fetchUsers();
      } else {
        toast.error("Gagal menambahkan officer");
      }
    });
  };

  const submitSegment = async (e) => {
    e.preventDefault();
    const name = String(segmentName || "").trim();
    if (!name) {
      setSegmentNotice("Nama segment wajib diisi");
      toast.error("Nama segment wajib diisi");
      return;
    }
    setIsSegmentSubmitting(true);
    setSegmentNotice("Menyimpan segment...");
    try {
      const res = await fetch(`${API_URL}/api/segments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSegmentNotice(data.message || "Gagal menambah segment");
        toast.error(data.message || "Gagal menambah segment");
      } else {
        setSegmentNotice("Segment tersimpan ✓");
        toast.success("Segment berhasil ditambahkan");
        setSegmentName("");
        fetchSegments();
      }
    } catch {
      setSegmentNotice("Terjadi kesalahan jaringan");
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setIsSegmentSubmitting(false);
    }
  };

  const deleteUser = (id) => {
    fetch(`${API_URL}/api/auth/delete/${id}`, {
      method: "DELETE",
      headers: authHeader,
    }).then((res) => {
      if (res.ok) {
        toast.success("User berhasil dihapus");
        fetchUsers();
      } else {
        toast.error("Gagal menghapus user");
      }
    });
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  const filteredTasks = tasks.filter(
    (t) => String(t.status || "").toLowerCase() === taskStatusFilter
  );

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      {/* NAVBAR */}
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center gap-4 sticky top-0 z-50">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={leftLogoFailed ? FALLBACK_LEFT_LOGO : BRAND_LEFT_LOGO_URL}
            alt="Logo kiri"
            className="h-9 w-9 object-contain"
            onError={() => setLeftLogoFailed(true)}
          />
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-blue-600 truncate">
              Manager Dashboard
            </h1>
            <div className="text-xs text-gray-500 truncate">
              Monitoring & laporan semua task
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="hidden md:flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === "overview"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            📊 Analytics
          </button>
          <button
            onClick={() => setActiveTab("tasks")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === "tasks"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            📝 Tugas & Laporan
          </button>
          <button
            onClick={() => setActiveTab("officers")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === "officers"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            👥 Kelola User
          </button>
        </div>

        <div className="flex items-center gap-4">
          <img
            src={rightLogoFailed ? FALLBACK_RIGHT_LOGO : BRAND_RIGHT_LOGO_URL}
            alt="Logo kanan"
            className="h-9 object-contain"
            onError={() => setRightLogoFailed(true)}
          />
          <button
            onClick={() => setShowProfile(true)}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Edit Profil
          </button>
          <button
            onClick={handleLogout}
            className="text-red-600 hover:text-red-800 font-medium"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* PROFILE MODAL */}
      {showProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Edit Profil</h2>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nama
                </label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) =>
                    setProfileData({ ...profileData, name: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) =>
                    setProfileData({ ...profileData, email: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Password Baru (Opsional)
                </label>
                <input
                  type="password"
                  value={profileData.password}
                  onChange={(e) =>
                    setProfileData({ ...profileData, password: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                  placeholder="Kosongkan jika tidak ingin ubah"
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowProfile(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="p-8">
        {activeTab === "overview" && (
          <div className="space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                  Analytics Overview
                </h2>
                <div className="text-sm text-gray-500">
                  Data real-time dari {tasks.length} tugas
                </div>
              </div>
              <AnalyticsDashboard tasks={tasks} />
            </div>
          </div>
        )}

        {activeTab === "tasks" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Import Section - Compact */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h2 className="text-lg font-bold mb-4 text-gray-800 border-b pb-2">
                  Impor Tugas
                </h2>
                <div className="flex flex-col gap-3">
                  <label className="flex flex-col gap-1 w-full">
                    <span className="text-sm font-medium text-gray-700">
                      File Excel/CSV
                    </span>
                    <input
                      type="file"
                      accept=".csv, .xlsx, .xls"
                      onChange={handleImportFile}
                      disabled={isImporting}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100
                        cursor-pointer"
                    />
                  </label>
                  {isImporting && (
                    <span className="text-blue-600 text-xs animate-pulse">
                      Memproses data...
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h2 className="text-lg font-bold mb-4 text-gray-800 border-b pb-2">
                  Kelola Segment
                </h2>
                <form onSubmit={submitSegment} className="space-y-3">
                  <input
                    value={segmentName}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                    placeholder="Nama segment baru..."
                    onChange={(e) => setSegmentName(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={isSegmentSubmitting}
                    className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
                  >
                    {isSegmentSubmitting ? "Menyimpan..." : "Tambah Segment"}
                  </button>
                </form>
                <div className="mt-4 flex flex-wrap gap-2">
                  {segments.map((s) => (
                    <span
                      key={s._id}
                      className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700 border border-gray-200"
                    >
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Tasks Table - Wide */}
            <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4 border-b pb-4">
                <h2 className="text-xl font-bold text-gray-800">
                  Laporan Tugas
                </h2>
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={taskStatusFilter}
                    onChange={(e) => setTaskStatusFilter(e.target.value)}
                    className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="pending">Pending</option>
                    <option value="progress">Proses</option>
                    <option value="done">Selesai</option>
                  </select>
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={exportPDF}
                      className="px-3 py-1 text-xs font-medium rounded hover:bg-white hover:shadow-sm transition-all"
                      title="Export PDF"
                    >
                      PDF
                    </button>
                    <button
                      onClick={exportTXT}
                      className="px-3 py-1 text-xs font-medium rounded hover:bg-white hover:shadow-sm transition-all"
                      title="Export TXT"
                    >
                      TXT
                    </button>
                    <button
                      onClick={exportImage}
                      className="px-3 py-1 text-xs font-medium rounded hover:bg-white hover:shadow-sm transition-all"
                      title="Export Image"
                    >
                      IMG
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto" ref={reportRef}>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Judul & Segment
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status & PIC
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Metrik
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTasks.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-8 text-center text-sm text-gray-500"
                        >
                          Tidak ada data tugas untuk filter ini.
                        </td>
                      </tr>
                    ) : (
                      filteredTasks.map((t) => (
                        <tr
                          key={t._id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">
                              {t.title}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {t.segment || "Uncategorized"}
                            </div>
                            <div className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">
                              {t.location}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full mb-1 ${
                                t.status === "done"
                                  ? "bg-green-100 text-green-800"
                                  : t.status === "progress"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {t.status}
                            </span>
                            <div className="text-xs text-gray-600">
                              {t.completedBy?.name
                                ? `Oleh: ${t.completedBy.name}`
                                : t.assignedTo?.name
                                ? `Assign: ${t.assignedTo.name}`
                                : "Unassigned"}
                            </div>
                            {t.picName && (
                              <div className="text-xs text-gray-500 mt-0.5">
                                PIC: {t.picName}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-xs text-gray-600">
                              <span className="font-medium">Reward:</span>{" "}
                              {t.reward}
                            </div>
                            <div className="text-xs text-gray-600 mt-0.5">
                              <span className="font-medium">Prospek:</span>{" "}
                              {t.prospects || 0}
                            </div>
                            {t.completedAt && (
                              <div className="text-xs text-gray-400 mt-1">
                                {new Date(t.completedAt).toLocaleDateString()}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => exportTaskPDF(t)}
                                className="text-red-600 hover:text-red-800 text-xs font-medium"
                              >
                                PDF
                              </button>
                              <span className="text-gray-300">|</span>
                              <button
                                onClick={() => exportTaskTXT(t)}
                                className="text-gray-600 hover:text-gray-800 text-xs font-medium"
                              >
                                TXT
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "officers" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm h-fit">
              <h2 className="text-lg font-bold mb-4 text-gray-800 border-b pb-2">
                Tambah Officer Baru
              </h2>
              <form onSubmit={submitUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nama Lengkap
                  </label>
                  <input
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                    onChange={(e) =>
                      setUserForm({ ...userForm, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                    onChange={(e) =>
                      setUserForm({ ...userForm, email: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                    onChange={(e) =>
                      setUserForm({ ...userForm, password: e.target.value })
                    }
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 font-medium shadow-sm transition-all"
                >
                  Tambah Officer
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm">
              <h2 className="text-lg font-bold mb-4 text-gray-800 border-b pb-2">
                Daftar Semua User
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((u) => (
                      <tr key={u._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">
                            {u.name}
                          </div>
                          <div className="text-xs text-gray-500">{u.email}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              u.role === "manager"
                                ? "bg-purple-100 text-purple-800"
                                : u.role === "officer"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {u.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {u.role !== "manager" && (
                            <button
                              onClick={() => deleteUser(u._id)}
                              className="text-red-600 hover:text-red-900 text-xs font-medium bg-red-50 px-2 py-1 rounded hover:bg-red-100 transition-colors"
                            >
                              Hapus
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
