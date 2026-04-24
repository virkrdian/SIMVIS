import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "jspdf-autotable";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Papa from "papaparse";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import {
  downloadTaskPDF,
  downloadTaskTXT,
  getEvidenceLinks,
} from "../../utils/taskExport";
import AnalyticsDashboard from "./AnalyticsDashboard";

// Fix Icon Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Komponen untuk update posisi map
function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 13);
    }
  }, [center, map]);
  return null;
}

export default function OfficerDashboard() {
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const BRAND_LEFT_LOGO_URL =
    process.env.REACT_APP_BRAND_LEFT_LOGO_URL || "/brand-left.png";
  const BRAND_RIGHT_LOGO_URL =
    process.env.REACT_APP_BRAND_RIGHT_LOGO_URL || "/brand-right.png";
  const KAB_BANDUNG_CENTER = [-7.05, 107.6];
  const KAB_BANDUNG_BOUNDS = [
    [-7.35, 107.25],
    [-6.75, 107.95],
  ];
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mapCenter, setMapCenter] = useState(KAB_BANDUNG_CENTER);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitNotice, setSubmitNotice] = useState("");
  const [segments, setSegments] = useState([]);
  const [segmentName, setSegmentName] = useState("");
  const [segmentNotice, setSegmentNotice] = useState("");
  const [isSegmentSubmitting, setIsSegmentSubmitting] = useState(false);
  const [taskStatusFilter, setTaskStatusFilter] = useState("pending");
  const [leftLogoFailed, setLeftLogoFailed] = useState(false);
  const [rightLogoFailed, setRightLogoFailed] = useState(false);
  const [assignedToTouched, setAssignedToTouched] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [activeTab, setActiveTab] = useState("overview"); // 'overview', 'tasks', 'agents'
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

  const tableRef = useRef(null); // Ref untuk export image
  const searchAbortRef = useRef(null);
  const searchSeqRef = useRef(0);

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

  const handleImportCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImportNotice("Membaca file...");
    setIsImporting(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        if (results.errors.length > 0) {
          setImportNotice(
            "Error saat membaca CSV: " + results.errors[0].message
          );
          setIsImporting(false);
          return;
        }

        const data = results.data;
        if (data.length === 0) {
          setImportNotice("File CSV kosong");
          setIsImporting(false);
          return;
        }

        // Map CSV fields to Task fields
        const mappedData = data.map((row) => ({
          title: row.Title || row.title || row.Judul || "Untitled Task",
          description:
            row.Description || row.description || row.Deskripsi || "",
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
          e.target.value = null; // Reset file input
        }
      },
      error: (err) => {
        setImportNotice("Gagal parsing CSV: " + err.message);
        toast.error("Gagal parsing CSV");
        setIsImporting(false);
      },
    });
  };

  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    location: "",
    reward: "",
    latitude: "",
    longitude: "",
    segment: "",
    assignedTo: "",
    deadline: "",
    priority: "medium",
  });

  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "ar",
  });

  const fetchTasks = () => {
    fetch(`${API_URL}/api/tasks`, {
      headers: authHeader,
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setTasks(data);
        } else {
          console.error("Data tasks bukan array:", data);
          setTasks([]);
        }
      })
      .catch((err) => {
        console.error(err);
        setTasks([]);
      });
  };

  const handleSearchLocation = async (query) => {
    setTaskForm((prev) => ({ ...prev, location: query }));
    if (query.length < 3) {
      if (searchAbortRef.current) {
        try {
          searchAbortRef.current.abort();
        } catch {}
      }
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      if (searchAbortRef.current) {
        try {
          searchAbortRef.current.abort();
        } catch {}
      }
      const controller = new AbortController();
      searchAbortRef.current = controller;
      const seq = ++searchSeqRef.current;

      const viewbox = [
        KAB_BANDUNG_BOUNDS[0][1],
        KAB_BANDUNG_BOUNDS[1][0],
        KAB_BANDUNG_BOUNDS[1][1],
        KAB_BANDUNG_BOUNDS[0][0],
      ].join(",");
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=10&countrycodes=id&viewbox=${encodeURIComponent(
          viewbox
        )}&bounded=1&q=${encodeURIComponent(query)}`,
        { signal: controller.signal }
      );
      const data = await res.json();
      if (seq !== searchSeqRef.current) return;

      const withinBounds = (lat, lon) => {
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false;
        return (
          lat >= KAB_BANDUNG_BOUNDS[0][0] &&
          lat <= KAB_BANDUNG_BOUNDS[1][0] &&
          lon >= KAB_BANDUNG_BOUNDS[0][1] &&
          lon <= KAB_BANDUNG_BOUNDS[1][1]
        );
      };

      const arr = Array.isArray(data) ? data : [];
      const filtered = arr.filter((p) => {
        const lat = parseFloat(p?.lat);
        const lon = parseFloat(p?.lon);
        if (withinBounds(lat, lon)) return true;
        const display = String(p?.display_name || "").toLowerCase();
        const county = String(p?.address?.county || "").toLowerCase();
        const stateDistrict = String(
          p?.address?.state_district || ""
        ).toLowerCase();
        return (
          county.includes("bandung") ||
          stateDistrict.includes("bandung") ||
          display.includes("kabupaten bandung")
        );
      });

      setSearchResults(filtered.length > 0 ? filtered : arr);
    } catch (err) {
      if (err?.name !== "AbortError") console.error("Search error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const selectLocation = (place) => {
    const lat = parseFloat(place.lat);
    const lon = parseFloat(place.lon);
    const normalize = (s) =>
      String(s || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");

    const findUserIdByName = (fullName) => {
      const target = normalize(fullName);
      const u = users.find((x) => normalize(x?.name) === target);
      return u?._id || "";
    };

    const locationText = normalize(place.display_name);
    const includesAny = (keywords) =>
      keywords.some((k) => locationText.includes(normalize(k)));

    const soehKeywords = ["soreang", "ciwidey", "rancabali"];
    const drajatKeywords = ["banjaran", "ciparay"];
    const santiKeywords = ["rancaekek", "majalaya", "pacet"];

    let recommendedAssigneeId = "";
    if (includesAny(soehKeywords)) {
      recommendedAssigneeId = findUserIdByName("Soleh Abdullah");
    } else if (includesAny(drajatKeywords)) {
      recommendedAssigneeId = findUserIdByName("Drajat Permana");
    } else if (includesAny(santiKeywords) || locationText) {
      recommendedAssigneeId = findUserIdByName("Santi Januarti");
    }

    setTaskForm((prev) => ({
      ...prev,
      location: place.display_name,
      latitude: lat,
      longitude: lon,
      assignedTo: assignedToTouched
        ? prev.assignedTo
        : recommendedAssigneeId || prev.assignedTo,
    }));
    setMapCenter([lat, lon]); // Pindahkan map ke lokasi terpilih
    setSearchResults([]);
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
    fetchTasks();
    fetchUsers();
    fetchSegments();
    const interval = setInterval(() => {
      fetchTasks();
      fetchUsers();
      fetchSegments();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const submitTask = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitNotice("Menyimpan tugas...");
    const payload = {
      title: taskForm.title,
      description: taskForm.description,
      location: taskForm.location,
      reward: parseFloat(taskForm.reward) || 0,
      latitude: parseFloat(taskForm.latitude),
      longitude: parseFloat(taskForm.longitude),
      segment: String(taskForm.segment || "").trim(),
      deadline: taskForm.deadline || undefined,
      priority: taskForm.priority,
    };
    if (taskForm.assignedTo) payload.assignedTo = taskForm.assignedTo;
    try {
      const res = await fetch(`${API_URL}/api/tasks/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitNotice(
          data.message ? `Gagal: ${data.message}` : "Gagal menyimpan tugas"
        );
        toast.error(data.message || "Gagal menyimpan tugas");
      } else {
        setSubmitNotice("Terkirim ✓ Tugas tersimpan dan tersinkron");
        toast.success("Tugas berhasil disimpan");
        setTaskForm({
          title: "",
          description: "",
          location: "",
          reward: "",
          latitude: "",
          longitude: "",
          segment: "",
          assignedTo: "",
          deadline: "",
          priority: "medium",
        });
        setAssignedToTouched(false);
        fetchTasks();
      }
    } catch (err) {
      setSubmitNotice("Terjadi kesalahan jaringan");
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setIsSubmitting(false);
    }
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

  const submitUser = (e) => {
    e.preventDefault();
    fetch(`${API_URL}/api/auth/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader },
      body: JSON.stringify(userForm),
    }).then((res) => {
      if (res.ok) {
        toast.success("User berhasil ditambahkan");
        setUserForm({ name: "", email: "", password: "", role: "ar" });
        fetchUsers();
      } else {
        toast.error("Gagal menambahkan user");
      }
    });
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  // --- EXPORT FUNCTIONS ---
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Laporan Tugas - Officer", 14, 20);
    const tableColumn = ["Judul", "Lokasi", "Reward", "Status", "Bukti"];
    const tableRows = [];

    filteredTasks.forEach((t) => {
      const links = getEvidenceLinks(t, API_URL);
      const evidence =
        links.length > 0
          ? links.map((l) => `${l.label}: ${l.url}`).join("\n")
          : "-";
      const taskData = [t.title, t.location, t.reward, t.status, evidence];
      tableRows.push(taskData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 25,
      columnStyles: {
        4: { cellWidth: 40, overflow: "linebreak" },
      },
    });
    doc.save("laporan_tugas.pdf");
  };

  const exportTXT = () => {
    let content = "LAPORAN TUGAS\n\n";
    filteredTasks.forEach((t) => {
      const links = getEvidenceLinks(t, API_URL);
      const evidence =
        links.length > 0
          ? links.map((l) => `${l.label}: ${l.url}`).join(" | ")
          : "-";
      content += `Judul: ${t.title}\nLokasi: ${t.location}\nReward: ${t.reward}\nStatus: ${t.status}\nBukti: ${evidence}\n-------------------\n`;
    });
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "laporan_tugas.txt";
    a.click();
  };

  const exportImage = async () => {
    if (tableRef.current) {
      const canvas = await html2canvas(tableRef.current);
      const imgData = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = imgData;
      a.download = "laporan_tugas.png";
      a.click();
    }
  };

  const exportTaskPDF = async (t) => {
    try {
      await downloadTaskPDF(t, API_URL, {
        header: "LAPORAN TASK - OFFICER",
        fileNamePrefix: "task_officer",
        logoUrl: rightLogoFailed ? FALLBACK_RIGHT_LOGO : BRAND_RIGHT_LOGO_URL,
      });
    } catch (e) {
      console.error("Export PDF error:", e);
      alert("Gagal mengunduh PDF (mungkin gambar tidak dapat dimuat)");
    }
  };

  const exportTaskTXT = (t) => {
    downloadTaskTXT(t, API_URL, {
      header: "LAPORAN TASK - OFFICER",
      fileNamePrefix: "task_officer",
    });
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
              Officer Dashboard
            </h1>
            <div className="text-xs text-gray-500 truncate">
              Buat task & kelola agent
            </div>
          </div>
        </div>

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
            onClick={() => setActiveTab("agents")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === "agents"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            👥 Kelola Agent
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* LEFT COLUMN: TASK MANAGEMENT */}
            <div className="space-y-8">
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">
                  Buat Tugas Baru
                </h2>
                <form onSubmit={submitTask} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Judul Tugas
                    </label>
                    <input
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                      placeholder="Contoh: Kunjungan Client X"
                      onChange={(e) =>
                        setTaskForm({ ...taskForm, title: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Deskripsi
                    </label>
                    <textarea
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                      placeholder="Detail tugas..."
                      onChange={(e) =>
                        setTaskForm({
                          ...taskForm,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Lokasi (Cari & Pilih)
                      </label>
                      <div className="relative">
                        <input
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                          value={taskForm.location}
                          placeholder="Ketik nama tempat..."
                          onChange={(e) => handleSearchLocation(e.target.value)}
                          autoComplete="off"
                        />
                        {isSearching && (
                          <div className="absolute right-2 top-3 text-xs text-gray-400">
                            Searching...
                          </div>
                        )}
                        {searchResults.length > 0 && (
                          <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1">
                            {searchResults.map((place) => (
                              <li
                                key={place.place_id}
                                onClick={() => selectLocation(place)}
                                className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b last:border-b-0"
                              >
                                <p className="font-semibold text-gray-800">
                                  {place.display_name.split(",")[0]}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {place.display_name}
                                </p>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Reward
                      </label>
                      <input
                        type="number"
                        required
                        value={taskForm.reward}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                        onChange={(e) =>
                          setTaskForm({ ...taskForm, reward: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Deadline
                      </label>
                      <input
                        type="date"
                        value={taskForm.deadline}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                        onChange={(e) =>
                          setTaskForm({ ...taskForm, deadline: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Prioritas
                      </label>
                      <select
                        value={taskForm.priority}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border bg-white"
                        onChange={(e) =>
                          setTaskForm({ ...taskForm, priority: e.target.value })
                        }
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Segment
                    </label>
                    <select
                      value={taskForm.segment}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border bg-white"
                      onChange={(e) =>
                        setTaskForm({ ...taskForm, segment: e.target.value })
                      }
                    >
                      <option value="">Pilih segment</option>
                      {segments.map((s) => (
                        <option key={s._id} value={s.name}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Tugaskan ke AR/SA
                    </label>
                    <select
                      value={taskForm.assignedTo}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border bg-white"
                      onChange={(e) => {
                        setAssignedToTouched(true);
                        setTaskForm({
                          ...taskForm,
                          assignedTo: e.target.value,
                        });
                      }}
                    >
                      <option value="">Belum ditugaskan</option>
                      {users
                        .filter((u) => u.role === "ar" || u.role === "sales")
                        .map((u) => (
                          <option key={u._id} value={u._id}>
                            {u.name} ({u.role})
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Latitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        required
                        value={taskForm.latitude}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                        onChange={(e) =>
                          setTaskForm({ ...taskForm, latitude: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Longitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        required
                        value={taskForm.longitude}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                        onChange={(e) =>
                          setTaskForm({
                            ...taskForm,
                            longitude: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-2 px-4 rounded-md font-medium ${
                      isSubmitting
                        ? "bg-blue-300 text-white cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {isSubmitting ? "Menyimpan..." : "Simpan Tugas"}
                  </button>
                  {submitNotice && (
                    <div className="text-sm mt-2 text-gray-600">
                      {submitNotice}
                    </div>
                  )}
                </form>

                {/* MAP PREVIEW */}
                <div className="mt-6 h-64 w-full rounded-lg overflow-hidden shadow-inner border border-gray-200">
                  <MapContainer
                    center={mapCenter}
                    zoom={13}
                    minZoom={10}
                    maxBounds={KAB_BANDUNG_BOUNDS}
                    maxBoundsViscosity={1.0}
                    style={{ height: "100%", width: "100%" }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapUpdater center={mapCenter} />
                    <Marker position={mapCenter}>
                      <Popup>{taskForm.location || "Lokasi Terpilih"}</Popup>
                    </Marker>
                  </MapContainer>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                  <h2 className="text-xl font-bold text-gray-800">
                    Daftar Tugas
                  </h2>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-gray-500">Filtered</div>
                      <select
                        value={taskStatusFilter}
                        onChange={(e) => setTaskStatusFilter(e.target.value)}
                        className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white"
                      >
                        <option value="pending">Pending</option>
                        <option value="progress">Sedang dikerjakan</option>
                        <option value="done">Selesai</option>
                      </select>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={exportPDF}
                        className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                      >
                        PDF
                      </button>
                      <button
                        onClick={exportTXT}
                        className="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                      >
                        TXT
                      </button>
                      <button
                        onClick={exportImage}
                        className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                      >
                        IMG
                      </button>
                    </div>
                  </div>
                </div>
                <div
                  className="max-h-96 overflow-y-auto space-y-3"
                  ref={tableRef}
                >
                  {filteredTasks.map((t) => (
                    <div
                      key={t._id}
                      className="p-4 border rounded-lg hover:bg-gray-50 transition"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-gray-800">{t.title}</h4>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {t.description}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            t.status === "done"
                              ? "bg-green-100 text-green-700"
                              : t.status === "progress"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {t.status}
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-gray-500 flex gap-4">
                        <span>📍 {t.location}</span>
                        <span>💰 {t.reward}</span>
                        <span>🏷️ {t.segment || "-"}</span>
                        <span>👤 {t.assignedTo?.name || "-"}</span>
                      </div>
                      {t.status === "done" ? (
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
                          <div>
                            <span className="font-medium text-gray-700">
                              Diselesaikan:
                            </span>{" "}
                            {t.completedBy?.name || t.assignedTo?.name || "-"}
                            {t.completedAt
                              ? ` (${new Date(t.completedAt).toLocaleString()})`
                              : ""}
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">
                              PIC:
                            </span>{" "}
                            {t.picName || "-"}{" "}
                            <span className="text-gray-500">
                              {t.picPhone ? `(${t.picPhone})` : ""}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">
                              Prospek:
                            </span>{" "}
                            {t.prospects ?? 0}
                          </div>
                          <div className="sm:col-span-2">
                            <span className="font-medium text-gray-700">
                              Catatan:
                            </span>{" "}
                            {t.notes || "-"}
                          </div>
                          <div className="sm:col-span-2">
                            <span className="font-medium text-gray-700">
                              Bukti:
                            </span>{" "}
                            {getEvidenceLinks(t, API_URL).length > 0 ? (
                              <span className="inline-flex flex-wrap gap-2">
                                {getEvidenceLinks(t, API_URL).map((l) => (
                                  <a
                                    key={l.label}
                                    href={l.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-600 hover:underline"
                                  >
                                    {l.label}
                                  </a>
                                ))}
                              </span>
                            ) : (
                              "-"
                            )}
                          </div>
                        </div>
                      ) : null}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          onClick={() => exportTaskPDF(t)}
                          className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                        >
                          Export PDF
                        </button>
                        <button
                          onClick={() => exportTaskTXT(t)}
                          className="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                        >
                          Export TXT
                        </button>
                      </div>
                    </div>
                  ))}
                  {filteredTasks.length === 0 ? (
                    <div className="text-center text-gray-500 text-sm py-8">
                      Tidak ada tugas untuk filter ini.
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "agents" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* RIGHT COLUMN: AGENT MANAGEMENT */}
            <div className="space-y-8 lg:col-span-2">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Import CSV */}
                <div className="bg-white p-6 rounded-xl shadow-sm">
                  <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">
                    Impor Tugas dari CSV
                  </h2>
                  <div className="text-sm text-gray-600 mb-4">
                    <p>
                      Pastikan format kolom dalam file CSV Anda sesuai dengan
                      urutan berikut:{" "}
                      <b>
                        Title, Description, Segment, Location, Latitude,
                        Longitude, Reward
                      </b>
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleImportCSV}
                      disabled={isImporting}
                      className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100
                  disabled:opacity-50 cursor-pointer"
                    />

                    {isImporting && (
                      <span className="text-blue-600 font-medium text-xs">
                        Sedang memproses...
                      </span>
                    )}

                    {importNotice && (
                      <div
                        className={`p-2 text-xs rounded ${
                          importNotice.includes("Gagal") ||
                          importNotice.includes("Error")
                            ? "bg-red-50 text-red-700"
                            : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        {importNotice}
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm">
                  <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">
                    Kelola Segment
                  </h2>
                  <form onSubmit={submitSegment} className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Nama Segment
                      </label>
                      <input
                        value={segmentName}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                        placeholder="Contoh: Sekolah"
                        onChange={(e) => setSegmentName(e.target.value)}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSegmentSubmitting}
                      className={`w-full py-2 px-4 rounded-md font-medium ${
                        isSegmentSubmitting
                          ? "bg-blue-300 text-white cursor-not-allowed"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {isSegmentSubmitting ? "Menyimpan..." : "Tambah Segment"}
                    </button>
                    {segmentNotice ? (
                      <div className="text-sm text-gray-600">
                        {segmentNotice}
                      </div>
                    ) : null}
                  </form>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm">
                  <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">
                    Tambah User (AR/SA/Officer)
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
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Password
                        </label>
                        <input
                          type="password"
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                          onChange={(e) =>
                            setUserForm({
                              ...userForm,
                              password: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Role
                        </label>
                        <select
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                          value={userForm.role}
                          onChange={(e) =>
                            setUserForm({ ...userForm, role: e.target.value })
                          }
                        >
                          <option value="ar">AR</option>
                          <option value="sales">SA</option>
                          <option value="officer">Officer</option>
                        </select>
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 font-medium"
                    >
                      Tambah User
                    </button>
                  </form>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm">
                  <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">
                    Daftar Agent
                  </h2>
                  <div className="max-h-96 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Nama
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Role
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users
                          .filter((u) => u.role === "ar" || u.role === "sales")
                          .map((u) => (
                            <tr key={u._id}>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {u.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {u.email}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                  {u.role}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
