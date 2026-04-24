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
