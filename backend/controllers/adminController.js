const supabase = require('../supabaseClient');
const { sendNotificationEmail } = require('../utils/mailer');

// ============================
// 1. Get All Users
// ============================
exports.getUsers = async (req, res) => {
  const { role, status } = req.query;

  try {
    let query = supabase.from('users').select('*').order('created_at', { ascending: false });

    if (role) query = query.eq('role', role);
    if (status) query = query.eq('account_status', status);

    const { data, error } = await query;
    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error("GET USERS ERROR:", err);
    res.status(500).json({ error: "Failed to fetch users." });
  }
};

// ============================
// 2. Handle User Action (Accept/Reject/Block)
// ============================
exports.updateUserStatus = async (req, res) => {
  const { userId, action } = req.body; // action: 'APPROVE', 'REJECT', 'BLOCK'

  try {
    // 1. Fetch user to get Email
    const { data: user } = await supabase
      .from('users')
      .select('email, account_status')
      .eq('user_id', userId)
      .single();

    if (!user) return res.status(404).json({ error: "User not found" });

    let newStatus = '';
    let emailAction = '';

    // Determine Status based on Action
    if (action === 'APPROVE') {
      newStatus = 'ACTIVE';
      emailAction = 'APPROVED';
    } else if (action === 'REJECT') {
      newStatus = 'REJECTED';
      emailAction = 'REJECTED';
    } else if (action === 'BLOCK') {
      newStatus = 'BLOCKED';
      emailAction = 'BLOCKED';
    } else {
      return res.status(400).json({ error: "Invalid action" });
    }

    // 2. Update DB
    const { error } = await supabase
      .from('users')
      .update({ account_status: newStatus })
      .eq('user_id', userId);

    if (error) throw error;

    // 3. Send Email
    await sendNotificationEmail(user.email, emailAction);

    res.json({ message: `User ${action}ED successfully.` });
  } catch (err) {
    console.error("UPDATE STATUS ERROR:", err);
    res.status(500).json({ error: "Failed to update status." });
  }
};

// ============================
// 3. Delete User (Remove)
// ============================
exports.deleteUser = async (req, res) => {
  const { userId } = req.body;

  try {
    // 1. Fetch user to get email before deleting
    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('user_id', userId)
      .single();

    if (user) {
      // 2. Send 'Removed' Email
      await sendNotificationEmail(user.email, 'REMOVED');
    }

    // 3. Delete from DB
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;

    res.json({ message: "User removed and notified." });
  } catch (err) {
    console.error("DELETE USER ERROR:", err);
    res.status(500).json({ error: "Failed to delete user." });
  }
};

// ============================
// 4. Reset Enrollments
// ============================
exports.resetEnrollments = async (req, res) => {
  try {
    const { error } = await supabase
      .from('enrollments')
      .delete()
      .neq('enrollment_id', 0); // Delete all

    if (error) throw error;
    res.status(200).json({ message: "Enrollments reset successfully." });
  } catch (err) {
    res.status(500).json({ error: "Reset failed." });
  }
};