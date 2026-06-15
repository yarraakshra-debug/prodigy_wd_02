/**
 * EmpSphere - Core Application Script
 * Handles Admin Authentication, localStorage CRUD, Form Validation, and UI updates.
 */

// --- Constants & Database Init ---
const MOCK_EMPLOYEES = [
  { id: "emp_1", name: "Alice Vance", role: "Software Engineer", salary: 125000 },
  { id: "emp_2", name: "Bob Miller", role: "Product Manager", salary: 130000 },
  { id: "emp_3", name: "Charlie Rose", role: "UX Designer", salary: 95000 },
  { id: "emp_4", name: "Diana Prince", role: "QA Engineer", salary: 88000 },
  { id: "emp_5", name: "Evan Wright", role: "HR Manager", salary: 92000 }
];

const DB_KEY = "empsphere_employees";
const SESSION_KEY = "empsphere_session";

// Fetch employees list from localStorage or initialize with mock data
function getEmployees() {
  const data = localStorage.getItem(DB_KEY);
  if (!data) {
    localStorage.setItem(DB_KEY, JSON.stringify(MOCK_EMPLOYEES));
    return MOCK_EMPLOYEES;
  }
  return JSON.parse(data);
}

// Save employees list to localStorage
function saveEmployees(employees) {
  localStorage.setItem(DB_KEY, JSON.stringify(employees));
}

// --- Toast Notification System ---
function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `notification-toast toast-${type}`;
  
  const iconName = type === "success" ? "check-circle" : "alert-triangle";
  toast.innerHTML = `
    <i data-lucide="${iconName}"></i>
    <span>${message}</span>
  `;
  
  container.appendChild(toast);
  lucide.createIcons();

  // Automatic fadeout & cleanup
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(20px)";
    toast.style.transition = "all 0.4s ease";
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

// --- Authentication Engine ---
const ADMIN_USER = "admin@company.com";
const ADMIN_PASS = "admin123";

function checkSession() {
  const activeSession = sessionStorage.getItem(SESSION_KEY);
  const authView = document.getElementById("auth-view");
  const dashboardView = document.getElementById("dashboard-view");
  
  if (activeSession) {
    authView.classList.add("hidden");
    dashboardView.classList.remove("hidden");
    document.getElementById("admin-display-name").textContent = activeSession;
    
    // Build initial letters for profile avatar
    const initial = activeSession.charAt(0).toUpperCase();
    document.getElementById("admin-avatar").textContent = initial;
    
    // Initialize Dashboard data
    renderDashboard();
  } else {
    authView.classList.remove("hidden");
    dashboardView.classList.add("hidden");
  }
}

// Handle Admin Login Form
document.getElementById("login-form").addEventListener("submit", function (e) {
  e.preventDefault();
  
  const emailInput = document.getElementById("login-email");
  const passwordInput = document.getElementById("login-password");
  
  const emailError = document.getElementById("login-email-error");
  const passwordError = document.getElementById("login-password-error");
  
  // Reset previous error messages
  emailError.textContent = "";
  passwordError.textContent = "";
  
  let isValid = true;
  
  // Validate Email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailInput.value.trim()) {
    emailError.textContent = "Email address is required.";
    isValid = false;
  } else if (!emailRegex.test(emailInput.value.trim())) {
    emailError.textContent = "Please enter a valid email format.";
    isValid = false;
  }
  
  // Validate Password
  if (!passwordInput.value) {
    passwordError.textContent = "Password is required.";
    isValid = false;
  }
  
  if (!isValid) return;
  
  // Authenticate Admin Credentials
  if (emailInput.value.trim().toLowerCase() === ADMIN_USER && passwordInput.value === ADMIN_PASS) {
    sessionStorage.setItem(SESSION_KEY, emailInput.value.trim());
    showToast("Successfully authenticated as Administrator.", "success");
    
    // Reset inputs
    emailInput.value = "";
    passwordInput.value = "";
    
    checkSession();
  } else {
    showToast("Invalid credentials. Try admin@company.com / admin123", "error");
    passwordError.textContent = "Incorrect password or administrator email.";
  }
});

// Handle Admin Logout
document.getElementById("logout-btn").addEventListener("click", function () {
  sessionStorage.removeItem(SESSION_KEY);
  showToast("Logged out successfully.", "success");
  
  // Reset any active form state
  resetForm();
  
  checkSession();
});

// --- Validation System for CRUD Form ---
function validateEmployeeForm(name, role, salary) {
  const nameError = document.getElementById("emp-name-error");
  const roleError = document.getElementById("emp-role-error");
  const salaryError = document.getElementById("emp-salary-error");
  
  nameError.textContent = "";
  roleError.textContent = "";
  salaryError.textContent = "";
  
  let isValid = true;
  
  // Validate Name
  const cleanName = name.trim();
  if (!cleanName) {
    nameError.textContent = "Employee name is required.";
    isValid = false;
  } else if (cleanName.length < 2) {
    nameError.textContent = "Name must be at least 2 characters long.";
    isValid = false;
  } else if (/^\d+$/.test(cleanName)) {
    nameError.textContent = "Name cannot consist solely of numbers.";
    isValid = false;
  }
  
  // Validate Role
  if (!role) {
    roleError.textContent = "Please select an employee role.";
    isValid = false;
  }
  
  // Validate Salary
  const salNum = Number(salary);
  if (!salary || isNaN(salNum)) {
    salaryError.textContent = "Annual salary is required and must be a valid number.";
    isValid = false;
  } else if (salNum < 1000) {
    salaryError.textContent = "Salary must be at least $1,000 USD.";
    isValid = false;
  } else if (salNum > 10000000) {
    salaryError.textContent = "Salary cannot exceed $10,000,000 USD.";
    isValid = false;
  }
  
  return isValid;
}

// --- CRUD Implementation ---

// Add or Edit Submission
document.getElementById("employee-form").addEventListener("submit", function (e) {
  e.preventDefault();
  
  const id = document.getElementById("employee-id").value;
  const name = document.getElementById("emp-name").value;
  const role = document.getElementById("emp-role").value;
  const salary = document.getElementById("emp-salary").value;
  
  // Run Validation
  if (!validateEmployeeForm(name, role, salary)) return;
  
  const employees = getEmployees();
  
  if (id) {
    // UPDATE MODE
    const index = employees.findIndex(emp => emp.id === id);
    if (index !== -1) {
      employees[index] = { id, name: name.trim(), role, salary: Number(salary) };
      saveEmployees(employees);
      showToast(`Employee "${name.trim()}" record updated.`, "success");
    } else {
      showToast("Employee record not found.", "error");
    }
  } else {
    // CREATE MODE
    const newId = "emp_" + Date.now();
    const newEmployee = { id: newId, name: name.trim(), role, salary: Number(salary) };
    employees.push(newEmployee);
    saveEmployees(employees);
    showToast(`Successfully registered employee "${name.trim()}".`, "success");
  }
  
  resetForm();
  renderDashboard();
});

// Edit Button Trigger
function editEmployee(id) {
  const employees = getEmployees();
  const employee = employees.find(emp => emp.id === id);
  
  if (!employee) {
    showToast("Employee record not found.", "error");
    return;
  }
  
  // Populate form inputs
  document.getElementById("employee-id").value = employee.id;
  document.getElementById("emp-name").value = employee.name;
  document.getElementById("emp-role").value = employee.role;
  document.getElementById("emp-salary").value = employee.salary;
  
  // Update UI headings & buttons
  document.getElementById("form-title").innerHTML = `<i data-lucide="edit-3"></i> <span>Edit Employee</span>`;
  document.getElementById("submit-btn").innerHTML = `<i data-lucide="save"></i> <span>Update Employee</span>`;
  document.getElementById("cancel-btn").classList.remove("hidden");
  
  // Scroll form into view for responsive screens
  document.getElementById("employee-form").scrollIntoView({ behavior: 'smooth' });
  
  lucide.createIcons();
}

// Cancel Editing Flow
document.getElementById("cancel-btn").addEventListener("click", resetForm);

function resetForm() {
  document.getElementById("employee-id").value = "";
  document.getElementById("employee-form").reset();
  
  // Clear any validation errors
  document.getElementById("emp-name-error").textContent = "";
  document.getElementById("emp-role-error").textContent = "";
  document.getElementById("emp-salary-error").textContent = "";
  
  // Reset form layout headings
  document.getElementById("form-title").innerHTML = `<i data-lucide="user-plus"></i> <span>Add New Employee</span>`;
  document.getElementById("submit-btn").innerHTML = `<i data-lucide="plus"></i> <span>Add Employee</span>`;
  document.getElementById("cancel-btn").classList.add("hidden");
  
  lucide.createIcons();
}

// Delete Employee Flow
function deleteEmployee(id) {
  const employees = getEmployees();
  const employee = employees.find(emp => emp.id === id);
  
  if (!employee) {
    showToast("Employee record not found.", "error");
    return;
  }
  
  const confirmed = confirm(`Are you sure you want to permanently delete the employee record for ${employee.name}?`);
  if (!confirmed) return;
  
  const updatedEmployees = employees.filter(emp => emp.id !== id);
  saveEmployees(updatedEmployees);
  showToast(`Successfully deleted employee record for "${employee.name}".`, "success");
  
  // If the employee being edited is deleted, reset the edit form
  if (document.getElementById("employee-id").value === id) {
    resetForm();
  }
  
  renderDashboard();
}

// --- Search Filter Logic ---
document.getElementById("search-input").addEventListener("input", function (e) {
  const searchTerm = e.target.value.toLowerCase().trim();
  renderTable(searchTerm);
});

// --- Render & Metrics Dashboard System ---
function renderDashboard() {
  const employees = getEmployees();
  
  // Calculate Metrics
  const totalCount = employees.length;
  
  let totalSalary = 0;
  const roleFreq = {};
  
  employees.forEach(emp => {
    totalSalary += emp.salary;
    roleFreq[emp.role] = (roleFreq[emp.role] || 0) + 1;
  });
  
  const avgSalary = totalCount > 0 ? Math.round(totalSalary / totalCount) : 0;
  
  // Determine Top Role
  let topRole = "N/A";
  let maxFreq = 0;
  for (const role in roleFreq) {
    if (roleFreq[role] > maxFreq) {
      maxFreq = roleFreq[role];
      topRole = role;
    }
  }
  
  // Render metrics elements
  document.getElementById("metric-total").textContent = totalCount;
  document.getElementById("metric-avg-salary").textContent = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(avgSalary);
  document.getElementById("metric-top-role").textContent = topRole;
  
  // Render the Employee Table list
  renderTable();
}

function renderTable(searchTerm = "") {
  const employees = getEmployees();
  const tbody = document.getElementById("employees-tbody");
  tbody.innerHTML = "";
  
  const filtered = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm)
  );
  
  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4">
          <div class="empty-state">
            <div class="empty-icon"><i data-lucide="folder-open"></i></div>
            <p>${searchTerm ? 'No employees matches your search criteria.' : 'The registry is currently empty. Add records above.'}</p>
          </div>
        </td>
      </tr>
    `;
    lucide.createIcons();
    return;
  }
  
  filtered.forEach(emp => {
    const row = document.createElement("tr");
    row.className = "fade-in";
    
    // Get initials for profile placeholder
    const initials = emp.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
    
    row.innerHTML = `
      <td>
        <div class="emp-name-cell">
          <div class="emp-avatar">${initials}</div>
          <div>
            <strong>${escapeHTML(emp.name)}</strong>
            <span class="emp-id-sub">${emp.id}</span>
          </div>
        </div>
      </td>
      <td>
        <span class="badge badge-role">${escapeHTML(emp.role)}</span>
      </td>
      <td>
        ${new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0
        }).format(emp.salary)}
      </td>
      <td>
        <div class="action-buttons">
          <button class="btn-action btn-edit-action" title="Edit Employee" onclick="editEmployee('${emp.id}')">
            <i data-lucide="edit-2"></i>
          </button>
          <button class="btn-action btn-delete-action" title="Delete Employee" onclick="deleteEmployee('${emp.id}')">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(row);
  });
  
  lucide.createIcons();
}

// Helper to escape HTML and prevent XSS injections
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

// --- App Load Event ---
document.addEventListener("DOMContentLoaded", () => {
  // Check active session & initialize pages
  checkSession();
  
  // Run Lucide setup
  lucide.createIcons();
});
