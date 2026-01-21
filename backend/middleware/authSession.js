const supabase = require('../supabaseClient');

module.exports = async function authSession(req, res, next) {
  try {
    const sessionId = req.headers['x-session-id'];
    const userId = req.headers['x-user-id'];

    if (!sessionId || !userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { data: user } = await supabase
      .from('users')
      .select('active_session_id')
      .eq('user_id', userId)
      .single();

    if (!user || user.active_session_id !== sessionId) {
      return res.status(401).json({ error: "Session expired" });
    }

    next(); // ✅ valid session
  } catch (err) {
    console.error("Session middleware error:", err);
    res.status(500).json({ error: "Session validation failed" });
  }
};
