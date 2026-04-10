const db = require("../config/db");

//  Haversine Formula (distance calculation)
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius (km)

  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Add School API 
exports.addSchool = (req, res) => {
  let { name, address, latitude, longitude } = req.body;

  //  Validate string fields
  if (typeof name !== "string" || name.trim() === "") {
    return res.status(400).json({ message: "Name must be a non-empty string" });
  }

  if (typeof address !== "string" || address.trim() === "") {
    return res.status(400).json({ message: "Address must be a non-empty string" });
  }

  //  Convert to numbers
  latitude = Number(latitude);
  longitude = Number(longitude);

  //  Type validation
  if (isNaN(latitude) || isNaN(longitude)) {
    return res.status(400).json({ message: "Latitude and longitude must be numbers" });
  }

  //  Range validation
  if (latitude < -90 || latitude > 90) {
    return res.status(400).json({ message: "Latitude must be between -90 and 90" });
  }

  if (longitude < -180 || longitude > 180) {
    return res.status(400).json({ message: "Longitude must be between -180 and 180" });
  }

  //  Insert into DB
  const sql = `
    INSERT INTO schools (name, address, latitude, longitude)
    VALUES (?, ?, ?, ?)
  `;

  db.query(sql, [name.trim(), address.trim(), latitude, longitude], (err, result) => {
    if (err) {
      console.error("DB Error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    return res.status(201).json({
      message: "School added successfully",
      id: result.insertId,
    });
  });
};
//  List Schools API
exports.listSchools = (req, res) => {
  const { latitude, longitude } = req.query;

  if (!latitude || !longitude) {
    return res.status(400).json({ message: "Latitude & Longitude required" });
  }

  db.query("SELECT * FROM schools", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    // Calculate distance
    const sortedSchools = results.map((school) => {
      const distance = getDistance(
        latitude,
        longitude,
        school.latitude,
        school.longitude
      );

      return { ...school, distance };
    });

    // Sort by distance
    sortedSchools.sort((a, b) => a.distance - b.distance);

    res.json(sortedSchools);
  });
};