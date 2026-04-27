const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

exports.geocodeAddress = async (address) => {
  if (!address) return null;
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    address
  )}&addressdetails=1&limit=1`;
  const res = await fetch(url, { headers: { "User-Agent": "SIMVIS/1.0" } });
  const data = await res.json();
  if (!data || !data[0]) return null;
  return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
};

exports.reverseGeocode = async (latitude, longitude) => {
  const lat = Number(latitude);
  const lon = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
    lat
  )}&lon=${encodeURIComponent(lon)}`;
  const res = await fetch(url, { headers: { "User-Agent": "SIMVIS/1.0" } });
  const data = await res.json().catch(() => null);
  const name = String(data?.display_name || "").trim();
  return name || null;
};
