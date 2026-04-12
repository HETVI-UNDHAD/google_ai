const Volunteer    = require('../models/Volunteer');
const Notification = require('../models/Notification');

function distanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  const R    = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a    =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// POST /api/volunteer/location
exports.updateLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    if (!latitude || !longitude)
      return res.status(400).json({ message: 'latitude and longitude are required' });

    const volunteer = await Volunteer.findOneAndUpdate(
      { userId: req.user._id },
      { currentLatitude: Number(latitude), currentLongitude: Number(longitude), lastLocationUpdate: new Date() },
      { new: true }
    );

    if (!volunteer)
      return res.status(404).json({ message: 'Volunteer profile not found. Please register first.' });

    res.json({ message: 'Location updated', currentLatitude: volunteer.currentLatitude, currentLongitude: volunteer.currentLongitude });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/volunteer/notifications
exports.getMyNotifications = async (req, res) => {
  try {
    const volunteer = await Volunteer.findOne({ userId: req.user._id });
    if (!volunteer) return res.json([]);

    const notifications = await Notification.find({ volunteerId: volunteer._id })
      .populate('requestId', 'title category city area urgency priorityScore latitude longitude')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/volunteer/notifications/read
exports.markAllRead = async (req, res) => {
  try {
    const volunteer = await Volunteer.findOne({ userId: req.user._id });
    if (!volunteer) return res.json({ updated: 0 });

    const result = await Notification.updateMany(
      { volunteerId: volunteer._id, read: false },
      { read: true }
    );
    res.json({ updated: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Called by requestController after a new request is saved — fire and forget
exports.triggerProximityNotifications = async (request) => {
  try {
    if (!request.latitude || !request.longitude) return;

    const RADIUS_KM  = 5;
    const volunteers = await Volunteer.find({
      availability:    true,
      currentLatitude:  { $ne: null },
      currentLongitude: { $ne: null },
    });

    const nearby = volunteers.filter((v) =>
      distanceKm(v.currentLatitude, v.currentLongitude, request.latitude, request.longitude) <= RADIUS_KM
    );

    if (!nearby.length) return;

    const docs = nearby.map((v) => ({
      volunteerId: v._id,
      requestId:   request._id,
      message:     `🚨 Urgent need near your location: "${request.title}" (${request.category} · ${request.city})`,
      distanceKm:  parseFloat(
        distanceKm(v.currentLatitude, v.currentLongitude, request.latitude, request.longitude).toFixed(2)
      ),
      read: false,
    }));

    await Notification.insertMany(docs, { ordered: false }).catch(() => {});
  } catch { /* non-critical */ }
};
