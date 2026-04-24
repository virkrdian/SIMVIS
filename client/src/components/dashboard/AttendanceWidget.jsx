import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function AttendanceWidget({ API_URL, authHeader }) {
  const [status, setStatus] = useState("loading"); // loading, not-started, clocked-in, clocked-out
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [time, setTime] = useState(new Date());

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
        reject("Geolocation not supported");
      } else {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          (error) => {
            reject(error.message);
          }
        );
      }
    });
  };

  const handleClockIn = async () => {
    setLoading(true);
    try {
      const location = await getLocation();
      const res = await fetch(`${API_URL}/api/attendance/clock-in`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
        body: JSON.stringify({
          ...location,
          address: "Location captured", // In real app, reverse geocode here
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
      toast.error("Gagal mendapatkan lokasi: " + error);
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    setLoading(true);
    try {
      const location = await getLocation();
      const res = await fetch(`${API_URL}/api/attendance/clock-out`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
        body: JSON.stringify({
          ...location,
          address: "Location captured",
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
      toast.error("Gagal mendapatkan lokasi: " + error);
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
