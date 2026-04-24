const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
exports.getRoute = async (start, end) => {
  const key = process.env.GEOAPIFY_API_KEY;
  const url = `https://api.geoapify.com/v1/routing?waypoints=${start[0]},${start[1]}|${end[0]},${end[1]}&mode=drive&apiKey=${key}`;
  const res = await fetch(url);
  const data = await res.json();
  return data; // berisi instruksi belok, jarak, durasi
};
