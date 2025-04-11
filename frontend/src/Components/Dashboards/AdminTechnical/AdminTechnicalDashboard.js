import React, { useEffect, useState } from "react";
import axios from "axios";
import './AdminTechnicalDashboard.css'

function AdminTechnicalDashboard() {
  const [users, setUsers] = useState([]);
  const [mode, setMode] = useState("view");
  const [showUsers, setShowUsers] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilters, setRoleFilters] = useState([]);
  const [categoryFilters, setCategoryFilters] = useState([]);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "organizer",
    category: "",
  });
  const [selectedUserId, setSelectedUserId] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://localhost:5002/users");
      setUsers(res.data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const resetForm = () => {
    setFormData({ fullName: "", email: "", password: "", role: "organizer", category: "" });
    setSelectedUserId(null);
    setMode("view");
  };

  const resetFilters = () => {
    setSearchTerm("");
    setRoleFilters([]);
    setCategoryFilters([]);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const [first, ...rest] = formData.fullName.split(" ");
    const last = rest.join(" ") || "";

    try {
      await axios.post("http://localhost:5002/add-user-admin", {
        first,
        last,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        category: formData.category,
        description: "",
      });
      fetchUsers();
      resetForm();
    } catch (error) {
      console.error("Failed to add user:", error);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedUserId) return;

    const [first, ...rest] = formData.fullName.split(" ");
    const last = rest.join(" ") || "";

    try {
      await axios.put(`http://localhost:5002/users/${selectedUserId}`, {
        first,
        last,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        category: formData.category,
      });
      fetchUsers();
      resetForm();
    } catch (error) {
      console.error("Failed to update user:", error);
    }
  };

  const handleDelete = async (userId) => {
    const confirm = window.confirm("Are you sure you want to delete this user?");
    if (!confirm) return;

    try {
      await axios.delete(`http://localhost:5002/users/${userId}`);
      fetchUsers();
    } catch (error) {
      console.error("Failed to delete user:", error);
    }
  };

  const handleEditClick = (user) => {
    setSelectedUserId(user.id);
    setFormData({
      fullName: `${user.first} ${user.last}`,
      email: user.email,
      password: user.password,
      role: user.role,
      category: user.category,
    });
    setMode("edit");
  };

  const toggleSelection = (value, currentArray, setter) => {
    if (currentArray.includes(value)) {
      setter(currentArray.filter((item) => item !== value));
    } else {
      setter([...currentArray, value]);
    }
  };

  const filteredUsers = users.filter((u) => {
    const nameMatch = `${u.first} ${u.last}`.toLowerCase().includes(searchTerm.toLowerCase());
    const emailMatch = u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const roleMatch = roleFilters.length ? roleFilters.includes(u.role) : true;
    const categoryMatch = categoryFilters.length ? categoryFilters.includes(u.category) : true;
    return (nameMatch || emailMatch) && roleMatch && categoryMatch;
  });

  const allRoles = ["organizer", "attendee", "administrator", "stakeholder"];
  const allCategories = Array.from(new Set(users.map((u) => u.category)));

  return (
    <div className="admin-dashboard">
      <h2>Technical Admin - User Management</h2>

      <div className="mode-selector">
        <button onClick={() => setMode("view")}>Toggle View Users</button>
        <button onClick={() => setMode("add")}>Add User</button>
        <button onClick={() => setMode("edit")}>Modify User</button>
        <button onClick={() => setMode("delete")}>Delete User</button>
      </div>

      {(mode === "view" || mode === "edit" || mode === "delete") && showUsers && (
        <div style={{ marginBottom: "1rem" }}>
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: "8px", width: "100%", maxWidth: "300px", marginRight: "12px" }}
          />

          <div style={{ margin: "10px 0" }}>
            <strong>Filter by Role:</strong>{" "}
            {allRoles.map((role) => (
              <label key={role} style={{ marginRight: "10px" }}>
                <input
                  type="checkbox"
                  checked={roleFilters.includes(role)}
                  onChange={() => toggleSelection(role, roleFilters, setRoleFilters)}
                />
                {role}
              </label>
            ))}
          </div>

          <div style={{ margin: "10px 0" }}>
            <strong>Filter by Category:</strong>{" "}
            {allCategories.map((cat) => (
              <label key={cat} style={{ marginRight: "10px" }}>
                <input
                  type="checkbox"
                  checked={categoryFilters.includes(cat)}
                  onChange={() => toggleSelection(cat, categoryFilters, setCategoryFilters)}
                />
                {cat}
              </label>
            ))}
          </div>

          <button onClick={resetFilters} style={{ marginTop: "8px" }}>
            Reset Filters
          </button>
        </div>
      )}

      {mode === "view" && (
        <>
          <button onClick={() => setShowUsers(!showUsers)}>
            {showUsers ? "Hide Users" : "Show Users"}
          </button>
          {showUsers && (
            <table className="user-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Category</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.first} {u.last}</td>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                    <td>{u.category}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {mode === "add" && (
        <form onSubmit={handleAdd} className="user-form">
          <input type="text" name="fullName" placeholder="Full Name" value={formData.fullName} onChange={handleChange} required />
          <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
          <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
          <select name="role" value={formData.role} onChange={handleChange} required>
            <option value="organizer">Organizer</option>
            <option value="attendee">Attendee</option>
            <option value="administrator">Administrator</option>
            <option value="stakeholder">Stakeholder</option>
          </select>
          <input type="text" name="category" placeholder="Category" value={formData.category} onChange={handleChange} required />
          <button type="submit">Add User</button>
        </form>
      )}

      {mode === "edit" && (
        <>
          <p>Select a user to edit:</p>
          <table className="user-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Category</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.first} {u.last}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>{u.category}</td>
                  <td><button onClick={() => handleEditClick(u)}>Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>

          {selectedUserId && (
            <form onSubmit={handleUpdate} className="user-form">
              <input type="text" name="fullName" placeholder="Full Name" value={formData.fullName} onChange={handleChange} required />
              <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
              <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
              <select name="role" value={formData.role} onChange={handleChange} required>
                <option value="organizer">Organizer</option>
                <option value="attendee">Attendee</option>
                <option value="administrator">Administrator</option>
                <option value="stakeholder">Stakeholder</option>
              </select>
              <input type="text" name="category" placeholder="Category" value={formData.category} onChange={handleChange} required />
              <button type="submit">Update User</button>
              <button type="button" onClick={resetForm}>Cancel</button>
            </form>
          )}
        </>
      )}

      {mode === "delete" && (
        <table className="user-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Full Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Category</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.first} {u.last}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{u.category}</td>
                <td><button onClick={() => handleDelete(u.id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AdminTechnicalDashboard;
