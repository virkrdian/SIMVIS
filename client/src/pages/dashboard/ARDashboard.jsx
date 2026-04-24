import L from "leaflet";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import AttendanceWidget from "../../components/dashboard/AttendanceWidget";
import CompleteTaskForm from "./CompleteTaskForm";

window.L = L;

if (
  L?.Routing?.Control?.prototype &&
  !L.Routing.Control.prototype.__safeClearLinesPatched
) {
  const originalClearLines = L.Routing.Control.prototype._clearLines;
  L.Routing.Control.prototype._clearLines = function () {
    if (!this._map || typeof this._map.removeLayer !== "function") {
      if (this._line) delete this._line;
      this._alternatives = [];
      return;
    }
    return originalClearLines.call(this);
  };
  L.Routing.Control.prototype.__safeClearLinesPatched = true;
}

const createMarkerSvgDataUri = ({
  fill = "#ffffff",
  stroke = "#6b7280",
  circleFill = "#ffffff",
  circleStroke = "#6b7280",
} = {}) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41">
    <path d="M12.5 0C5.596 0 0 5.596 0 12.5C0 22.875 12.5 41 12.5 41C12.5 41 25 22.875 25 12.5C25 5.596 19.404 0 12.5 0Z" fill="${fill}" stroke="${stroke}" stroke-width="1"/>
    <circle cx="12.5" cy="12.5" r="5.5" fill="${circleFill}" stroke="${circleStroke}" stroke-width="1"/>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const PHOTO_KDMP_PENDING_NAMES = [
  "KOPERASI DESA MERAH PUTIH PADASUKA KECAMATAN KUTAWARINGIN KABUPATEN BANDUNG",
  "KOPERASI DESA MERAH PUTIH BANDASARI KECAMATAN CANGKUANG",
  "KOPERASI DESA MERAH PUTIH SANGIANG KECAMATAN RANCAEKEK",
  "KOPERASI DESA MERAH PUTIH MEKARLAKSANA KECAMATAN CIPARAY KABUPATEN BANDUNG",
  "KOPERASI DESA MERAH PUTIH PADAMUKTI KECAMATAN SOLOKANJERUK",
  "KOPERASI DESA MERAH PUTIH BUMIWANGI",
  "KOPERASI DESA MERAH PUTIH KAMASAN KECAMATAN BANJARAN",
  "KOPERASI DESA MERAH PUTIH RANCAKOLE",
  "KOPERASI DESA MERAH PUTIH BAROS KECAMATAN ARJASARI",
  "KOPERASI DESA MERAH PUTIH SUKASARI KECAMATAN PAMEUNGPEUK",
  "KOPERASI DESA MERAH PUTIH TEGAL SUMEDANG",
  "KOPERASI DESA MERAH PUTIH WARGALUYU KECAMATAN ARJASARI",
  "KOPERASI DESA MERAH PUTIH ANCOLMEKAR",
  "KOPERASI DESA MERAH PUTIH BATUKARUT KECAMATAN ARJASARI",
  "KOPERASI DESA MERAH PUTIH PASIRHUNI KECAMATAN CIMAUNG",
  "KOPERASI DESA MERAH PUTIH NAGREG KENDAN",
  "KOPERASI DESA MERAH PUTIH SUKAMULYA KECAMATAN RANCAEKEK",
  "KOPERASI DESA MERAH PUTIH PAMEUNTASAN KECAMATAN KUTAWARINGIN",
  "KOPERASI DESA MERAH PUTIH CIHANYIR KECAMATAN CIKANCUNG",
  "KOPERASI DESA MERAH PUTIH MARUYUNG",
  "KOPERASI DESA MERAH PUTIH SUKAJADI KECAMATAN SOREANG",
  "KOPERASI DESA MERAH PUTIH TARAJUSARI",
  "KOPERASI DESA MERAH PUTIH WARNASARI KECAMATAN PANGALENGAN",
  "KOPERASI DESA MERAH PUTIH CIPARAY KECAMATAN CIPARAY",
  "KOPERASI DESA MERAH PUTIH PATROLSARI",
  "KOPERASI DESA MERAH PUTIH KOPO KECAMATAN KUTAWARINGIN KABUPATEN BANDUNG",
  "KOPERASI DESA MERAH PUTIH CIPEUJEUH KECAMATAN PACET",
  "KOPERASI DESA MERAH PUTIH GAJAHMEKAR",
  "KOPERASI DESA MERAH PUTIH LANGENSARI KECAMATAN SOLOKANJERUK",
  "KOPERASI DESA MERAH PUTIH BANJARAN KECAMATAN BANJARAN KABUPATEN BANDUNG",
  "KOPERASI DESA MERAH PUTIH CIHEULANG KECAMATAN CIPARAY KABUPATEN BANDUNG",
  "KOPERASI DESA MERAH PUTIH CIKANCUNG",
  "KOPERASI DESA MERAH PUTIH GANJAR SABAR",
  "KOPERASI DESA MERAH PUTIH NAGREG",
  "KOPERASI DESA MERAH PUTIH MANDALAWANGI KECAMATAN NAGREG",
  "KOPERASI DESA MERAH PUTIH BOJONG KECAMATAN NAGREG",
  "KOPERASI DESA MERAH PUTIH MALAKASARI KECAMATAN BALEENDAH KABUPATEN BANDUNG",
  "KOPERASI DESA MERAH PUTIH MARGAMULYA KECAMATAN PANGALENGAN KABUPATEN BANDUNG",
  "KOPERASI DESA MERAH PUTIH MARGAMEKAR KECAMATAN PANGALENGAN KABUPATEN BANDUNG",
  "KOPERASI DESA MERAH PUTIH CILAME",
  "KOPERASI DESA MERAH PUTIH NANJUNG MEKAR",
  "KOPERASI DESA MERAH PUTIH CIBODAS KECAMATAN SOLOKANJERUK",
  "KOPERASI DESA MERAH PUTIH RANCAKASUMBA",
  "KOPERASI DESA MERAH PUTIH BANJARAN WETAN",
  "KOPERASI DESA MERAH PUTIH CUKANGGENTENG KECAMATAN PASIRJAMBU",
];

const PHOTO_KDMP_DONE_NAMES = [
  "KOPERASI DESA MERAH PUTIH DRAWATI",
  "KOPERASI DESA MERAH PUTIH NEGLASARI KECAMATAN MAJALAYA",
  "KOPERASI DESA MERAH PUTIH NEGLASARI KECAMATAN BANJARAN",
  "KOPERASI DESA MERAH PUTIH RANCAMULYA KECAMATAN PAMEUNGPEUK",
  "KOPERASI DESA MERAH PUTIH PAKUTANDANG KECAMATAN CIPARAY",
  "KOPERASI DESA MERAH PUTIH PINGGIRSARI",
  "KOPERASI DESA MERAH PUTIH PADAMULYA KECAMATAN MAJALAYA",
  "KOPERASI DESA MERAH PUTIH PASIRJAMBU KECAMATAN PASIRJAMBU",
  "KOPERASI DESA MERAH PUTIH BIRU KECAMATAN MAJALAYA",
  "KOPERASI DESA MERAH PUTIH NAGRAK KECAMATAN PACET",
  "KOPERASI DESA MERAH PUTIH SUKAMAJU KECAMATAN MAJALAYA",
  "KOPERASI DESA MERAH PUTIH SOLOKANJERUK",
  "KOPERASI DESA MERAH PUTIH BOJONG KECAMATAN MAJALAYA KABUPATEN BANDUNG",
  "KOPERASI DESA MERAH PUTIH SUKAMULYA KECAMATAN KUTAWARINGIN KABUPATEN BANDUNG",
  "KOPERASI DESA MERAH PUTIH SUKAMUKTI KECAMATAN MAJALAYA",
  "KOPERASI DESA MERAH PUTIH LEBAKMUNCANG",
  "KOPERASI DESA MERAH PUTIH PANGAUBAN KECAMATAN KATAPANG",
  "KOPERASI DESA MERAH PUTIH LANGONSARI KECAMATAN PAMEUNGPEUK KABUPATEN BANDUNG",
  "KOPERASI DESA MERAH PUTIH CAMPAKAMULYA KECAMATAN CIMAUNG",
  "KOPERASI DESA MERAH PUTIH MAJAKERTA KECAMATAN MAJALAYA KABUPATEN BANDUNG",
  "KOPERASI DESA MERAH PUTIH JAGABAYA KECAMATAN CIMAUNG",
  "KOPERASI DESA MERAH PUTIH MAJALAYA KECAMATAN MAJALAYA KABUPATEN KARAWANG",
  "KOPERASI DESA MERAH PUTIH MEKARSARI KECAMATAN CIPARAY",
  "KOPERASI DESA MERAH PUTIH MALASARI KECAMATAN CIMAUNG",
  "KOPERASI DESA MERAH PUTIH BANYUSARI KECAMATAN KATAPANG KABUPATEN BANDUNG",
  "KOPERASI DESA MERAH PUTIH BOJONGEMAS KECAMATAN SOLOKANJERUK KABUPATEN BANDUNG",
];

const normalizePhotoText = (value) =>
  String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const PHOTO_KDMP_PENDING_NORM =
  PHOTO_KDMP_PENDING_NAMES.map(normalizePhotoText);
const PHOTO_KDMP_DONE_NORM = PHOTO_KDMP_DONE_NAMES.map(normalizePhotoText);
const PHOTO_KDMP_PENDING_SET = new Set(PHOTO_KDMP_PENDING_NORM);
const PHOTO_KDMP_DONE_SET = new Set(PHOTO_KDMP_DONE_NORM);

const matchesPhotoName = (taskNameNorm, photoNameNorm) => {
  if (!taskNameNorm || !photoNameNorm) return false;
  if (taskNameNorm === photoNameNorm) return true;
  if (taskNameNorm.includes(photoNameNorm)) return true;
  if (photoNameNorm.includes(taskNameNorm) && taskNameNorm.length >= 12)
    return true;
  return false;
};

const statusIcons = {
  done: L.icon({
    iconRetinaUrl: createMarkerSvgDataUri({
      fill: "#ffffff",
      stroke: "#9ca3af",
      circleFill: "#f3f4f6",
      circleStroke: "#9ca3af",
    }),
    iconUrl: createMarkerSvgDataUri({
      fill: "#ffffff",
      stroke: "#9ca3af",
      circleFill: "#f3f4f6",
      circleStroke: "#9ca3af",
    }),
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  }),
  pending: L.icon({
    iconRetinaUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png",
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  }),
  progress: L.icon({
    iconRetinaUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png",
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  }),
  default: L.icon({
    iconRetinaUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  }),
};

// Routing helper (garis navigasi dari posisi AR ke lokasi task)
function RoutingControl({ start, end }) {
  const map = useMap();
  const controlRef = useRef(null);

  useEffect(() => {
    // pastikan leaflet-routing-machine sudah ter-load
    if (!L.Routing || !L.Routing.control) {
      console.error("Leaflet Routing Machine tidak tersedia.");
      return;
    }

    if (!controlRef.current) {
      const control = L.Routing.control({
        waypoints: [],
        autoRoute: false,
        routeWhileDragging: false,
        fitSelectedRoutes: true,
        lineOptions: { styles: [{ color: "#1976d2", weight: 5 }] },
        addWaypoints: false,
        draggableWaypoints: false,
        show: false,
      }).addTo(map);

      controlRef.current = control;
    }

    return () => {
      const control = controlRef.current;
      if (control && control._pendingRequest && control._pendingRequest.abort) {
        try {
          control._pendingRequest.abort();
        } catch {}
        control._pendingRequest = null;
      }
      if (control) {
        control._requestCount = (control._requestCount || 0) + 1;
        try {
          map.removeControl(control);
        } catch {}
        controlRef.current = null;
      }
    };
  }, [map]);

  useEffect(() => {
    const control = controlRef.current;
    if (!control) return;

    if (control._pendingRequest && control._pendingRequest.abort) {
      try {
        control._pendingRequest.abort();
      } catch {}
      control._pendingRequest = null;
    }

    if (!start || !end) {
      try {
        control.setWaypoints([]);
      } catch {}
      return;
    }

    try {
      control.setWaypoints([
        L.latLng(start[0], start[1]),
        L.latLng(end[0], end[1]),
      ]);
      control.route();
    } catch {}
  }, [start, end]);

  return null;
}

// atur icon default leaflet (kalau belum diatur global)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function ARDashboard() {
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const KAB_BANDUNG_CENTER = [-7.05, 107.6];
  const KAB_BANDUNG_BOUNDS = [
    [-7.3, 107.3],
    [-6.8, 107.9],
  ];
  const BRAND_LEFT_LOGO_URL =
    process.env.REACT_APP_BRAND_LEFT_LOGO_URL || "/brand-left.png";
  const BRAND_RIGHT_LOGO_URL =
    process.env.REACT_APP_BRAND_RIGHT_LOGO_URL || "/brand-right.png";

  const [tasks, setTasks] = useState([]);
  const [currentPos, setCurrentPos] = useState(null);
  const [routeTo, setRouteTo] = useState(null);
  const [filter, setFilter] = useState("all");
  const [segments, setSegments] = useState([]);
  const [segmentFilter, setSegmentFilter] = useState("all");
  const [showPerformance, setShowPerformance] = useState(false);
  const [showAttendance, setShowAttendance] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [showTaskInput, setShowTaskInput] = useState(false);
  const [taskInputTarget, setTaskInputTarget] = useState(null);
  const [taskInputPos, setTaskInputPos] = useState(null);
  const [hasArrived, setHasArrived] = useState(false);
  const [leftLogoFailed, setLeftLogoFailed] = useState(false);
  const [rightLogoFailed, setRightLogoFailed] = useState(false);

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

  const handleAddComment = async (taskId, text) => {
    try {
      const res = await fetch(`${API_URL}/api/tasks/${taskId}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        fetchTasks(); // Refresh tasks to show new comment
        toast.success("Komentar terkirim");
      } else {
        toast.error("Gagal mengirim komentar");
      }
    } catch (err) {
      console.error(err);
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
  }, [showProfile, API_URL]);

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

  const fetchTasks = () => {
    fetch(`${API_URL}/api/tasks`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => res.json())
      .then((data) => {
        // backend mengembalikan array tasks langsung
        let fetchedTasks = [];
        if (Array.isArray(data)) {
          fetchedTasks = data;
        } else if (data && Array.isArray(data.items)) {
          fetchedTasks = data.items;
        }

        // Pastikan tasks KDMP tidak terfilter oleh kondisi aneh
        console.log("Total tasks fetched:", fetchedTasks.length);
        setTasks(fetchedTasks);
      })
      .catch((err) => {
        console.error("Gagal mengambil task:", err);
        setTasks([]);
      });
  };

  const fetchSegments = () => {
    fetch(`${API_URL}/api/segments`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => res.json())
      .then((data) => {
        let segmentList = [];
        if (Array.isArray(data)) {
          segmentList = data;
        }

        // Manual injection KDMP jika belum ada di database segment (backup)
        const hasKDMP = segmentList.some((s) => s.name === "KDMP");
        if (!hasKDMP) {
          segmentList.push({ _id: "temp_kdmp", name: "KDMP" });
        }

        setSegments(segmentList);
      })
      .catch(() => setSegments([]));
  };

  useEffect(() => {
    fetchTasks();
    fetchSegments();
    const interval = setInterval(() => {
      fetchTasks();
      fetchSegments();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setCurrentPos([pos.coords.latitude, pos.coords.longitude]);
        },
        (err) => {
          console.error(err);
          if (!currentPos) setCurrentPos(KAB_BANDUNG_CENTER);
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      setCurrentPos(KAB_BANDUNG_CENTER);
    }
  }, []);

  // Distance calculation (Haversine Formula)
  const getDistance = (pos1, pos2) => {
    if (!pos1 || !pos2) return Infinity;
    const R = 6371e3; // Earth radius in meters
    const lat1 = (pos1[0] * Math.PI) / 180;
    const lat2 = (pos2[0] * Math.PI) / 180;
    const dLat = ((pos2[0] - pos1[0]) * Math.PI) / 180;
    const dLon = ((pos2[1] - pos1[1]) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // distance in meters
  };

  useEffect(() => {
    if (currentPos && routeTo) {
      const dist = getDistance(currentPos, routeTo);
      // Jika jarak kurang dari 50 meter dan belum notifikasi
      if (dist < 50 && !hasArrived) {
        setHasArrived(true);
        toast.success("Anda telah sampai di lokasi tujuan!", {
          duration: 5000,
        });
      }
      // Reset hasArrived jika menjauh (> 100m) agar bisa notif lagi kalau balik
      if (dist > 100 && hasArrived) {
        setHasArrived(false);
      }
    }
  }, [currentPos, routeTo, hasArrived]);

  const getCoords = (t) => {
    const lat = parseFloat(t.latitude);
    const lon = parseFloat(t.longitude);
    return !isNaN(lat) && !isNaN(lon) ? [lat, lon] : null;
  };

  const getMarkerIcon = (status) => {
    const normalized = String(status || "")
      .trim()
      .toLowerCase();

    if (
      normalized === "done" ||
      normalized === "selesai" ||
      normalized === "completed" ||
      normalized === "finish"
    )
      return statusIcons.done;

    if (normalized === "pending") return statusIcons.pending;

    if (
      normalized === "progress" ||
      normalized === "in progress" ||
      normalized === "in_progress" ||
      normalized === "sedang dikerjakan"
    )
      return statusIcons.progress;

    return statusIcons.default;
  };

  const getKdmpNameFromTask = (t) => {
    const raw = String(t?.description || "");
    if (/^\s*visit\s+/i.test(raw)) return raw.replace(/^\s*visit\s+/i, "");
    return raw || String(t?.title || "");
  };

  const getTaskTagLabel = (t) => {
    const raw = getKdmpNameFromTask(t);
    const cleaned = String(raw || "")
      .replace(/^KOPERASI\s+(DESA|KELURAHAN)\s+MERAH\s+PUTIH\s+/i, "")
      .replace(/\s+KECAMATAN\s+.*/i, "")
      .trim();
    const base = cleaned || raw || String(t?.location || "");
    return base.length > 28 ? `${base.slice(0, 28)}…` : base;
  };

  const getEffectiveStatus = (t) => {
    const original = String(t?.status || "")
      .trim()
      .toLowerCase();
    if (original === "done" || original === "selesai") return "done";

    const segmentUpper = String(t?.segment || "")
      .trim()
      .toUpperCase();
    const titleUpper = String(t?.title || "")
      .trim()
      .toUpperCase();
    const descNorm = normalizePhotoText(String(t?.description || ""));

    const isKdmp =
      segmentUpper === "KDMP" ||
      titleUpper === "KDMP" ||
      (descNorm.startsWith("VISIT ") && descNorm.includes("KOPERASI"));

    if (!isKdmp) return t?.status;

    const taskNameNorm = normalizePhotoText(getKdmpNameFromTask(t));

    if (PHOTO_KDMP_DONE_SET.has(taskNameNorm)) return "done";
    if (PHOTO_KDMP_PENDING_SET.has(taskNameNorm)) return "pending";

    for (const doneNorm of PHOTO_KDMP_DONE_NORM) {
      if (matchesPhotoName(taskNameNorm, doneNorm)) return "done";
    }
    for (const pendingNorm of PHOTO_KDMP_PENDING_NORM) {
      if (matchesPhotoName(taskNameNorm, pendingNorm)) return "pending";
    }

    return t?.status;
  };

  const openTaskInput = (t, pos) => {
    setTaskInputTarget(t);
    setTaskInputPos(pos || null);
    setShowTaskInput(true);
    if (pos) setRouteTo(pos);
  };

  const displayTasks = tasks.filter((t) => {
    const effectiveStatus = getEffectiveStatus(t);
    const statusOk = filter === "all" ? true : effectiveStatus === filter;
    const segmentOk =
      segmentFilter === "all"
        ? true
        : String(t.segment || "").trim() ===
            String(segmentFilter || "").trim() ||
          (String(segmentFilter || "")
            .trim()
            .toUpperCase() === "KDMP" &&
            String(t.title || "")
              .trim()
              .toUpperCase() === "KDMP");
    return statusOk && segmentOk;
  });

  const tagTasks = displayTasks
    .map((t) => ({ t, status: getEffectiveStatus(t) }))
    .filter((x) => x.status !== "done")
    .slice(0, 30);

  const getStatusPillClass = (status) => {
    if (status === "done")
      return "bg-white text-gray-700 border border-gray-300";
    if (status === "pending" || status === "progress")
      return "bg-yellow-200 text-yellow-900";
    return "bg-blue-100 text-blue-700";
  };

  const getCardClass = (status) => {
    if (status === "done") return "bg-white";
    if (status === "pending" || status === "progress") return "bg-yellow-200";
    return "bg-white";
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  const totalReward = tasks
    .filter((t) => t.status === "done")
    .reduce((sum, t) => sum + (t.reward || 0), 0);

  const totalProspects = tasks
    .filter((t) => t.status === "done")
    .reduce((sum, t) => sum + (t.prospects || 0), 0);

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
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

      {/* PERFORMANCE MODAL */}
      {showPerformance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg w-3/4 max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                Laporan Kinerja & Reward
              </h2>
              <button
                onClick={() => setShowPerformance(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕ Tutup
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-sm text-green-600">Total Reward Didapat</p>
                <p className="text-2xl font-bold text-green-700">
                  Rp {totalReward.toLocaleString()}
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-600">
                  Total Pelanggan (Prespek)
                </p>
                <p className="text-2xl font-bold text-blue-700">
                  {totalProspects} Orang
                </p>
              </div>
            </div>

            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Judul Tugas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lokasi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reward
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prespek
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PIC
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tasks
                  .filter((t) => t.status === "done")
                  .map((t) => (
                    <tr key={t._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {t.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {t.location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-bold">
                        Rp {t.reward.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-bold">
                        {t.prospects || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {t.picName || "-"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ATTENDANCE MODAL */}
      {showAttendance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
            <button
              onClick={() => setShowAttendance(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
            <AttendanceWidget
              API_URL={API_URL}
              authHeader={{
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              }}
            />
          </div>
        </div>
      )}

      {showTaskInput && taskInputTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="min-w-0">
                <div className="text-lg font-bold text-gray-900 truncate">
                  {taskInputTarget.title || "Task"}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {taskInputTarget.description || "-"}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {taskInputTarget.location || "-"}
                </div>
              </div>
              <button
                onClick={() => {
                  setShowTaskInput(false);
                  setTaskInputTarget(null);
                  setTaskInputPos(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center justify-between text-sm mb-2">
              <div className="text-gray-700">
                Reward: Rp{" "}
                {Number(taskInputTarget.reward || 0).toLocaleString()}
              </div>
              <div className="flex gap-2">
                {taskInputTarget.priority && (
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium border ${
                      taskInputTarget.priority === "high"
                        ? "bg-red-100 text-red-800 border-red-200"
                        : taskInputTarget.priority === "low"
                        ? "bg-green-100 text-green-800 border-green-200"
                        : "bg-blue-100 text-blue-800 border-blue-200"
                    }`}
                  >
                    {taskInputTarget.priority.toUpperCase()}
                  </span>
                )}
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusPillClass(
                    getEffectiveStatus(taskInputTarget)
                  )}`}
                >
                  {getEffectiveStatus(taskInputTarget) || "belum"}
                </span>
              </div>
            </div>

            {taskInputTarget.deadline && (
              <div className="text-xs text-red-600 mb-2 font-medium">
                📅 Deadline:{" "}
                {new Date(taskInputTarget.deadline).toLocaleDateString("id-ID")}
              </div>
            )}

            <div className="flex gap-2 mb-2">
              <button
                onClick={() => taskInputPos && setRouteTo(taskInputPos)}
                disabled={!taskInputPos}
                className="bg-blue-500 text-white text-xs px-3 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
              >
                Rute ke Lokasi
              </button>
              {taskInputPos ? (
                <a
                  href={`https://www.google.com/maps?q=${taskInputPos[0]},${taskInputPos[1]}`}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-white border border-gray-200 text-xs px-3 py-2 rounded hover:bg-gray-50"
                >
                  Buka di Google Maps
                </a>
              ) : null}
            </div>

            {getEffectiveStatus(taskInputTarget) !== "done" ? (
              <CompleteTaskForm
                taskId={taskInputTarget._id}
                onSuccess={() => {
                  fetchTasks();
                  setShowTaskInput(false);
                  setTaskInputTarget(null);
                  setTaskInputPos(null);
                }}
              />
            ) : (
              <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded p-3">
                Task ini sudah selesai.
              </div>
            )}

            {/* COMMENTS SECTION */}
            <div className="mt-4 border-t pt-3">
              <h4 className="text-sm font-bold text-gray-800 mb-2">
                Komentar & Diskusi
              </h4>
              <div className="space-y-2 mb-3 max-h-32 overflow-y-auto bg-gray-50 p-2 rounded">
                {taskInputTarget.comments &&
                taskInputTarget.comments.length > 0 ? (
                  taskInputTarget.comments.map((c, idx) => (
                    <div
                      key={idx}
                      className="text-xs border-b pb-1 last:border-0"
                    >
                      <span className="font-bold text-gray-700">
                        {c.userName || "User"}:{" "}
                      </span>
                      <span className="text-gray-600">{c.text}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-gray-400 italic">
                    Belum ada komentar
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="commentInput"
                  placeholder="Tulis komentar..."
                  className="flex-1 text-xs border border-gray-300 rounded px-2 py-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddComment(taskInputTarget._id, e.target.value);
                      e.target.value = "";
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const input = document.getElementById("commentInput");
                    if (input && input.value) {
                      handleAddComment(taskInputTarget._id, input.value);
                      input.value = "";
                    }
                  }}
                  className="bg-blue-600 text-white text-xs px-3 py-1 rounded hover:bg-blue-700"
                >
                  Kirim
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* SIDEBAR */}
      <aside className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={leftLogoFailed ? FALLBACK_LEFT_LOGO : BRAND_LEFT_LOGO_URL}
                alt="Logo kiri"
                className="h-9 w-9 object-contain"
                onError={() => setLeftLogoFailed(true)}
              />
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-blue-600 truncate">
                  AR Dashboard
                </h1>
                <p className="text-xs text-gray-500 truncate">Welcome, Agent</p>
              </div>
            </div>
            <img
              src={rightLogoFailed ? FALLBACK_RIGHT_LOGO : BRAND_RIGHT_LOGO_URL}
              alt="Logo kanan"
              className="h-9 object-contain"
              onError={() => setRightLogoFailed(true)}
            />
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setFilter("all")}
            className={`w-full text-left px-4 py-2 rounded-lg ${
              filter === "all"
                ? "bg-blue-50 text-blue-600 font-semibold"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Semua Tugas
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`w-full text-left px-4 py-2 rounded-lg ${
              filter === "pending"
                ? "bg-blue-50 text-blue-600 font-semibold"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Tugas Pending
          </button>
          <button
            onClick={() => setFilter("progress")}
            className={`w-full text-left px-4 py-2 rounded-lg ${
              filter === "progress"
                ? "bg-blue-50 text-blue-600 font-semibold"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Sedang Dikerjakan
          </button>
          <button
            onClick={() => setFilter("done")}
            className={`w-full text-left px-4 py-2 rounded-lg ${
              filter === "done"
                ? "bg-blue-50 text-blue-600 font-semibold"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Selesai
          </button>
          <button
            onClick={() => setShowProfile(true)}
            className="w-full text-left px-4 py-2 rounded-lg text-blue-600 hover:bg-blue-50 font-semibold border border-blue-200"
          >
            👤 Edit Profil
          </button>
          <button
            onClick={() => setShowAttendance(true)}
            className="w-full text-left px-4 py-2 rounded-lg text-green-600 hover:bg-green-50 font-semibold border border-green-200"
          >
            📅 Kehadiran (Absensi)
          </button>
          <button
            onClick={() => setShowPerformance(true)}
            className="w-full text-left px-4 py-2 rounded-lg text-purple-600 hover:bg-purple-50 font-semibold border border-purple-200"
          >
            📊 Laporan Kinerja
          </button>
        </nav>
        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col relative h-full">
        <div className="relative z-0 flex-[0_0_55%] min-h-[380px]">
          <div className="absolute top-4 left-4 z-[1000] bg-white/95 backdrop-blur border border-gray-200 shadow-sm rounded-lg px-3 py-2">
            <div className="text-xs text-gray-500 mb-1">Filter Segment</div>
            <select
              value={segmentFilter}
              onChange={(e) => setSegmentFilter(e.target.value)}
              className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white"
            >
              <option value="all">Semua Segment</option>
              {segments.map((s) => (
                <option key={s._id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <MapContainer
            center={currentPos || KAB_BANDUNG_CENTER}
            zoom={11}
            minZoom={10}
            maxBounds={KAB_BANDUNG_BOUNDS}
            maxBoundsViscosity={1.0}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {currentPos && (
              <Marker position={currentPos}>
                <Popup>Posisi Anda</Popup>
              </Marker>
            )}

            {displayTasks.map((t) => {
              const pos = getCoords(t);
              if (!pos) return null;
              const effectiveStatus = getEffectiveStatus(t);
              return (
                <Marker
                  key={t._id}
                  position={pos}
                  icon={getMarkerIcon(effectiveStatus)}
                  eventHandlers={{
                    click: () => {
                      if (effectiveStatus !== "done") openTaskInput(t, pos);
                    },
                  }}
                >
                  <Popup>
                    <div className="p-2 min-w-[200px]">
                      <h3 className="font-bold text-lg">{t.title}</h3>
                      <p className="text-gray-600 text-sm mb-2">
                        {t.description}
                      </p>
                      <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                        <span>Reward: {t.reward}</span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusPillClass(
                            effectiveStatus
                          )}`}
                        >
                          {effectiveStatus || "belum"}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        Segment: {t.segment || "-"}
                      </div>
                      <div className="space-y-2">
                        <button
                          onClick={() => setRouteTo(pos)}
                          className="w-full bg-blue-500 text-white text-xs px-2 py-1 rounded hover:bg-blue-600"
                        >
                          Rute ke Lokasi
                        </button>
                        {effectiveStatus !== "done" ? (
                          <button
                            onClick={() => openTaskInput(t, pos)}
                            className="w-full bg-green-500 text-white text-xs px-2 py-1 rounded hover:bg-green-600"
                          >
                            Isi Form
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            <RoutingControl start={currentPos} end={routeTo} />
          </MapContainer>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto">
            {tagTasks.length > 0 ? (
              <div className="mb-4">
                <div className="text-xs text-gray-500 mb-2">
                  Pilih cepat (klik untuk input)
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {tagTasks.map(({ t }) => {
                    const pos = getCoords(t);
                    return (
                      <button
                        key={t._id}
                        onClick={() => openTaskInput(t, pos)}
                        className="shrink-0 px-3 py-1 rounded-full bg-yellow-200 text-yellow-900 text-xs font-medium hover:bg-yellow-300"
                      >
                        {getTaskTagLabel(t)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {filter === "all"
                  ? "Semua Tugas"
                  : filter === "pending"
                  ? "Tugas Pending"
                  : filter === "progress"
                  ? "Sedang Dikerjakan"
                  : "Selesai"}
              </h2>
              <div className="text-sm text-gray-500">
                Total: {displayTasks.length}
              </div>
            </div>

            <div className="space-y-3">
              {displayTasks.map((t) => {
                const pos = getCoords(t);
                const lat = pos ? pos[0] : null;
                const lon = pos ? pos[1] : null;
                const effectiveStatus = getEffectiveStatus(t);
                const mapsUrl =
                  lat != null && lon != null
                    ? `https://www.google.com/maps?q=${lat},${lon}`
                    : null;

                return (
                  <div
                    key={t._id}
                    className={`${getCardClass(
                      effectiveStatus
                    )} rounded-xl shadow-sm border border-gray-200 p-4`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-lg font-semibold text-gray-900 truncate">
                          {t.title}
                        </div>
                        <div className="text-sm text-gray-700 mt-1">
                          {t.location || "-"}
                        </div>
                        {t.description ? (
                          <div className="text-sm text-gray-700 mt-2">
                            {t.description}
                          </div>
                        ) : null}
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusPillClass(
                            effectiveStatus
                          )}`}
                        >
                          {effectiveStatus || "belum"}
                        </span>
                        <div className="text-sm font-semibold text-gray-800">
                          Rp {Number(t.reward || 0).toLocaleString()}
                        </div>
                        {mapsUrl ? (
                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-700"
                          >
                            Buka Lokasi
                          </a>
                        ) : (
                          <div className="text-xs text-gray-600">
                            Lokasi tidak valid
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => pos && setRouteTo(pos)}
                        className="bg-blue-500 text-white text-xs px-3 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                        disabled={!pos}
                      >
                        Rute ke Lokasi
                      </button>
                      {effectiveStatus !== "done" ? (
                        <button
                          onClick={() => openTaskInput(t, pos)}
                          className="bg-green-600 text-white text-xs px-3 py-2 rounded hover:bg-green-700"
                        >
                          Isi Form
                        </button>
                      ) : null}
                      <div className="flex-1" />
                    </div>

                    {effectiveStatus === "done" ? null : (
                      <div className="text-xs text-gray-600 mt-3">
                        Input laporan lewat tombol "Isi Form".
                      </div>
                    )}
                  </div>
                );
              })}

              {displayTasks.length === 0 ? (
                <div className="text-center text-gray-500 text-sm py-10">
                  Tidak ada tugas untuk filter ini.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
