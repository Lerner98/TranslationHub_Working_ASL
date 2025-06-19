const Admin = require('../models/Admin');
const { generateToken } = require('../middleware/auth');
const { logDBError } = require('../middleware/log');

/**
 * Creates a new admin.
 */
exports.createAdmin = async (req, res) => {
  try {
    const { name, email, password, roles, permissions } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const admin = new Admin({
      name,
      email,
      password,
      roles: roles || [],
      permissions: permissions || { canViewReports: false, canDeleteAdmins: false }
    });
    await admin.save();

    const adminData = admin.toObject();
    delete adminData.password;
    res.status(201).json({ success: true, message: 'Admin created successfully', admin: adminData });
  } catch (error) {
    logDBError(error, { func: 'createAdmin', body: req.body });
    res.status(500).json({ success: false, message: 'Error creating admin', error: error.message });
  }
};

/**
 * Retrieves an admin by ID.
 */
exports.getAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id).select('-password');
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });
    res.status(200).json({ success: true, admin });
  } catch (error) {
    logDBError(error, { func: 'getAdmin', id: req.params.id });
    res.status(500).json({ success: false, message: 'Error fetching admin', error: error.message });
  }
};

/**
 * Retrieves all admins.
 */
exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().select('-password');
    res.status(200).json({ success: true, admins });
  } catch (error) {
    logDBError(error, { func: 'getAllAdmins' });
    res.status(500).json({ success: false, message: 'Error fetching admins', error: error.message });
  }
};

/**
 * Updates an admin by ID.
 */
exports.updateAdmin = async (req, res) => {
  try {
    const { name, email, password, roles, permissions } = req.body;
    const admin = await Admin.findById(req.params.id);
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });

    if (name) admin.name = name;
    if (email) admin.email = email;
    if (password) admin.password = password;
    if (roles) admin.roles = roles;
    if (permissions) admin.permissions = permissions;

    await admin.save();

    res.status(200).json({
      success: true,
      message: 'Admin updated successfully',
      admin: admin.toObject({
        getters: true,
        versionKey: false,
        transform: (doc, ret) => {
          delete ret.password;
          return ret;
        }
      })
    });
  } catch (error) {
    logDBError(error, { func: 'updateAdmin', id: req.params.id, body: req.body });
    res.status(500).json({ success: false, message: 'Error updating admin', error: error.message });
  }
};

/**
 * Deletes an admin by ID.
 */
exports.deleteAdmin = async (req, res) => {
  try {
    const admin = await Admin.findByIdAndDelete(req.params.id);
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });

    res.status(200).json({ success: true, message: 'Admin deleted successfully' });
  } catch (error) {
    logDBError(error, { func: 'deleteAdmin', id: req.params.id });
    res.status(500).json({ success: false, message: 'Error deleting admin', error: error.message });
  }
};

/**
 * Logs in an admin and returns a JWT token.
 */
exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });

    if (admin.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(admin._id.toString());
    const adminData = admin.toObject({
      getters: true,
      versionKey: false,
      transform: (doc, ret) => {
        delete ret.password;
        return ret;
      }
    });
    res.status(200).json({ success: true, message: 'Login successful', admin: adminData, token });
  } catch (error) {
    logDBError(error, { func: 'loginAdmin', body: req.body });
    res.status(500).json({ success: false, message: 'Error logging in', error: error.message });
  }
};