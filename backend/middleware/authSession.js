const supabase = require("../supabaseClient");

module.exports = async function authSession(req, res, next) {
  try {
    const sessionId = req.headers["x-session-id"];
    const userId = req.headers["x-user-id"];

    if (!sessionId || !userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("user_id, active_session_id, role")
      .eq("user_id", userId)
      .single();

    if (error || !user || user.active_session_id !== sessionId) {
      return res.status(401).json({ error: "Session expired" });
    }

    /* ✅ Attach user to request */
    req.user = {
      user_id: user.user_id,
      role: user.role,
    };

    next();
  } catch (err) {
    console.error("Session middleware error:", err);
    res.status(500).json({ error: "Session validation failed" });
  }
};
