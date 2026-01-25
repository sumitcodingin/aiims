const supabase = require("../supabaseClient");

// Get users by role and account status
exports.getUsers = async (req, res) => {
  try {
    const { role, account_status } = req.query;
    
    let query = supabase
      .from("users")
      .select("user_id, full_name, email, role, account_status");
    
    if (role) {
      query = query.eq("role", role);
    }
    
    if (account_status) {
      query = query.eq("account_status", account_status);
    } else {
      // Default to ACTIVE if not specified
      query = query.eq("account_status", "ACTIVE");
    }
    
    const { data, error } = await query;
    
    if (error) {
      return res.status(500).json({ error: "Failed to fetch users" });
    }
    
    res.status(200).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

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
