import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function AttendanceWidget({ API_URL, authHeader }) {
  const [status, setStatus] = useState("loading"); // loading, not-started, clocked-in, clocked-out
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [time, setTime] = useState(new Date());
  const [locationError, setLocationError] = useState("");
  const [manualMode, setManualMode] = useState(false);
  const [manualLocation, setManualLocation] = useState({
    latitude: "",
    longitude: "",
    address: "",
  });

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/api/attendance/today`, {
        headers: authHeader,
      });
      const data = await res.json();
      if (data && data.status) {
        setStatus(data.status);
        setAttendanceData(data.data);
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const getLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject("Browser Anda tidak mendukung Geolocation");
      } else {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
            });
          },
          (error) => {
            let msg = "Gagal mendapatkan lokasi: ";
            switch (error.code) {
              case error.PERMISSION_DENIED:
                msg += "Izin lokasi ditolak. Silakan aktifkan GPS dan izinkan browser mengakses lokasi.";
                break;
              case error.POSITION_UNAVAILABLE:
                msg += "Informasi lokasi tidak tersedia.";
                break;
              case error.TIMEOUT:
                msg += "Waktu permintaan lokasi habis.";
                break;
              default:
                msg += error.message;
            }
            reject(msg);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        );
      }
    });
  };

  const buildHelpForDenied = () => {
    return [
      "Izin lokasi ditolak.",
      "1) Klik ikon gembok di address bar (Chrome/Edge)",
      "2) Site settings / Pengaturan situs → Location → Allow / Izinkan",
      "3) Refresh halaman, lalu coba lagi",
      "Jika di HP: aktifkan GPS dan izinkan lokasi untuk browser",
    ].join("\n");
  };

  const parseManualLocation = () => {
    const lat = Number(String(manualLocation.latitude || "").trim());
    const lon = Number(String(manualLocation.longitude || "").trim());
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return { ok: false, message: "Latitude/Longitude manual harus angka" };
    }
    const address = String(manualLocation.address || "").trim();
    return { ok: true, value: { latitude: lat, longitude: lon, address } };
  };

  const handleClockIn = async () => {
    setLoading(true);
    try {
      setLocationError("");
      const pos = await getLocation().catch((e) => {
        const msg = String(e || "Gagal mendapatkan lokasi");
        setLocationError(msg);
        if (msg.toLowerCase().includes("izin lokasi ditolak")) {
          toast.error(buildHelpForDenied());
        } else {
          toast.error(msg);
        }
        setManualMode(true);
        throw new Error(msg);
      });
      const location = {
        latitude: pos.latitude,
        longitude: pos.longitude,
        accuracy: pos.accuracy,
        address: `Lat: ${pos.latitude}, Lon: ${pos.longitude} (GPS)`,
      };

      const res = await fetch(`${API_URL}/api/attendance/clock-in`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
        body: JSON.stringify({
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          address: location.address,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Berhasil Absen Masuk!");
        fetchStatus();
      } else {
        toast.error(data.message || "Gagal absen masuk");
      }
    } catch (error) {
      if (error?.message) {
        toast.error("Error Sistem: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    setLoading(true);
    try {
      setLocationError("");
      const pos = await getLocation().catch((e) => {
        const msg = String(e || "Gagal mendapatkan lokasi");
        setLocationError(msg);
        if (msg.toLowerCase().includes("izin lokasi ditolak")) {
          toast.error(buildHelpForDenied());
        } else {
          toast.error(msg);
        }
        setManualMode(true);
        throw new Error(msg);
      });
      const location = {
        latitude: pos.latitude,
        longitude: pos.longitude,
        accuracy: pos.accuracy,
        address: `Lat: ${pos.latitude}, Lon: ${pos.longitude} (GPS)`,
      };

      const res = await fetch(`${API_URL}/api/attendance/clock-out`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
        body: JSON.stringify({
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          address: location.address,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Berhasil Absen Pulang!");
        fetchStatus();
      } else {
        toast.error(data.message || "Gagal absen pulang");
      }
    } catch (error) {
      if (error?.message) {
        toast.error("Error Sistem: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleManualClock = async (type) => {
    const parsed = parseManualLocation();
    if (!parsed.ok) {
      toast.error(parsed.message);
      return;
    }
    setLoading(true);
    try {
      const endpoint = type === "in" ? "clock-in" : "clock-out";
      const res = await fetch(`${API_URL}/api/attendance/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
        body: JSON.stringify({
          latitude: parsed.value.latitude,
          longitude: parsed.value.longitude,
          address: parsed.value.address || "Manual",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(type === "in" ? "Berhasil Absen Masuk!" : "Berhasil Absen Pulang!");
        setManualMode(false);
        fetchStatus();
      } else {
        toast.error(data.message || "Gagal menyimpan absensi");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Kehadiran Hari Ini</h2>
          <p className="text-sm text-gray-500">
            {time.toLocaleDateString("id-ID", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="text-2xl font-mono font-bold text-blue-600">
          {time.toLocaleTimeString("id-ID")}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {locationError && (
          <div className="bg-yellow-50 px-3 py-2 rounded text-xs text-yellow-800 border border-yellow-200 whitespace-pre-line">
            {locationError}
          </div>
        )}

        {manualMode && (
          <div className="bg-gray-50 p-3 rounded border border-gray-200">
            <div className="text-xs font-bold text-gray-600 mb-2">
              Input Lokasi Manual (Jika izin lokasi ditolak)
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                value={manualLocation.latitude}
                onChange={(e) =>
                  setManualLocation((v) => ({ ...v, latitude: e.target.value }))
                }
                placeholder="Latitude"
                className="border rounded px-2 py-1 text-xs"
              />
              <input
                value={manualLocation.longitude}
                onChange={(e) =>
                  setManualLocation((v) => ({ ...v, longitude: e.target.value }))
                }
                placeholder="Longitude"
                className="border rounded px-2 py-1 text-xs"
              />
            </div>
            <input
              value={manualLocation.address}
              onChange={(e) =>
                setManualLocation((v) => ({ ...v, address: e.target.value }))
              }
              placeholder="Alamat (opsional)"
              className="border rounded px-2 py-1 text-xs w-full mt-2"
            />
            <div className="flex gap-2 mt-2">
              {status === "not-started" && (
                <button
                  onClick={() => handleManualClock("in")}
                  disabled={loading}
                  className="flex-1 py-2 bg-blue-600 text-white rounded text-xs font-bold disabled:opacity-50"
                >
                  {loading ? "..." : "CLOCK IN (Manual)"}
                </button>
              )}
              {status === "clocked-in" && (
                <button
                  onClick={() => handleManualClock("out")}
                  disabled={loading}
                  className="flex-1 py-2 bg-red-600 text-white rounded text-xs font-bold disabled:opacity-50"
                >
                  {loading ? "..." : "CLOCK OUT (Manual)"}
                </button>
              )}
              <button
                onClick={() => setManualMode(false)}
                disabled={loading}
                className="py-2 px-3 bg-white border rounded text-xs text-gray-700 disabled:opacity-50"
              >
                Tutup
              </button>
            </div>
          </div>
        )}

        {status === "loading" ? (
          <div className="text-center py-4 text-gray-500">Memuat status...</div>
        ) : status === "clocked-out" ? (
          <div className="bg-green-50 p-4 rounded-lg text-center border border-green-200">
            <div className="text-green-800 font-bold text-lg mb-1">
              Sudah Absen Pulang
            </div>
            <div className="text-sm text-green-700">
              Masuk: {new Date(attendanceData?.clockIn?.time).toLocaleTimeString()} <br />
              Pulang: {new Date(attendanceData?.clockOut?.time).toLocaleTimeString()}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <div className="text-xs text-gray-500 uppercase font-bold">
                Jam Masuk
              </div>
              {status === "not-started" ? (
                <button
                  onClick={handleClockIn}
                  disabled={loading}
                  className="py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 transition shadow-lg shadow-blue-200"
                >
                  {loading ? "..." : "CLOCK IN"}
                </button>
              ) : (
                <div className="py-3 bg-gray-100 text-gray-800 rounded-lg font-bold text-center border border-gray-200">
                  {new Date(attendanceData?.clockIn?.time).toLocaleTimeString()}
                </div>
              )}
              {status === "not-started" && !manualMode && (
                <button
                  type="button"
                  onClick={() => setManualMode(true)}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  Input lokasi manual
                </button>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <div className="text-xs text-gray-500 uppercase font-bold">
                Jam Pulang
              </div>
              {status === "clocked-in" ? (
                <button
                  onClick={handleClockOut}
                  disabled={loading}
                  className="py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 disabled:opacity-50 transition shadow-lg shadow-red-200"
                >
                  {loading ? "..." : "CLOCK OUT"}
                </button>
              ) : status === "clocked-out" ? (
                <div className="py-3 bg-gray-100 text-gray-800 rounded-lg font-bold text-center border border-gray-200">
                  {new Date(attendanceData?.clockOut?.time).toLocaleTimeString()}
                </div>
              ) : (
                <div className="py-3 bg-gray-50 text-gray-400 rounded-lg font-bold text-center border border-gray-100 cursor-not-allowed">
                  --:--
                </div>
              )}
              {status === "clocked-in" && !manualMode && (
                <button
                  type="button"
                  onClick={() => setManualMode(true)}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  Input lokasi manual
                </button>
              )}
            </div>
          </div>
        )}

        {status === "clocked-in" && (
          <div className="bg-blue-50 px-3 py-2 rounded text-xs text-blue-700 text-center">
            Anda sedang bekerja. Jangan lupa Clock Out saat selesai.
          </div>
        )}
      </div>
    </div>
  );
}
