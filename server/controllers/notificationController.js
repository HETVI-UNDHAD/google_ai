const supabase = require('../utils/supabase');

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

    const { data, error } = await supabase.from('volunteers')
      .update({ current_latitude: Number(latitude), current_longitude: Number(longitude), last_location_update: new Date().toISOString() })
      .eq('user_id', req.user._id).select().single();

    if (error || !data) return res.status(404).json({ message: 'Volunteer profile not found' });
    res.json({ message: 'Location updated', currentLatitude: data.current_latitude, currentLongitude: data.current_longitude });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET /api/volunteer/notifications
exports.getMyNotifications = async (req, res) => {
  try {
    const { data: vol } = await supabase.from('volunteers').select('id').eq('user_id', req.user._id).single();
    if (!vol) return res.json([]);

    const { data, error } = await supabase.from('notifications')
      .select('*, requests(id, title, category, city, area, urgency, priority_score, latitude, longitude)')
      .eq('volunteer_id', vol.id).order('created_at', { ascending: false }).limit(20);

    if (error) return res.status(500).json({ message: error.message });
    res.json(data);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// PATCH /api/volunteer/notifications/read
exports.markAllRead = async (req, res) => {
  try {
    const { data: vol } = await supabase.from('volunteers').select('id').eq('user_id', req.user._id).single();
    if (!vol) return res.json({ updated: 0 });

    const { data } = await supabase.from('notifications')
      .update({ read: true }).eq('volunteer_id', vol.id).eq('read', false).select();
    res.json({ updated: data?.length || 0 });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Fire-and-forget proximity notifications
exports.triggerProximityNotifications = async (request) => {
  try {
    if (!request.latitude || !request.longitude) return;
    const { data: volunteers } = await supabase.from('volunteers').select('*')
      .eq('availability', true).not('current_latitude', 'is', null);

    const nearby = (volunteers || []).filter(v =>
      distanceKm(v.current_latitude, v.current_longitude, request.latitude, request.longitude) <= 5
    );
    if (!nearby.length) return;

    const docs = nearby.map(v => ({
      volunteer_id: v.id,
      request_id:   request.id || request._id,
      message:      `🚨 Urgent need near you: "${request.title}" (${request.category} · ${request.city})`,
      distance_km:  parseFloat(distanceKm(v.current_latitude, v.current_longitude, request.latitude, request.longitude).toFixed(2)),
      read: false,
    }));

    await supabase.from('notifications').upsert(docs, { onConflict: 'volunteer_id,request_id', ignoreDuplicates: true });
  } catch { /* non-critical */ }
};
