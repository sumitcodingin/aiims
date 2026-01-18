const supabase = require("../supabaseClient");

exports.getAdvisors = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("user_id, full_name")
      .eq("role", "Advisor");

    if (error) {
      return res.status(500).json({ error: "Failed to fetch advisors" });
    }

    res.status(200).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
