// --- App Configuration ---
const apiUrl = 'https://harshid-engravers.onrender.com/api'; // Our backend server

// --- Global Variables ---
let allLogEntries = []; // Local cache for all entries
let currentEditId = null; // To track editing
let currentUserRole = null; // 'admin' or 'user'
let currentUserId = null; // The logged-in user's ID string

// Bootstrap Tab instances
let loginTab = new bootstrap.Tab(document.getElementById('sign-in-tab'));
let registerTab = new bootstrap.Tab(document.getElementById('register-tab'));
let mainNavbarCollapse = new bootstrap.Collapse(document.getElementById('mainNavbar'), { toggle: false });

// --- DOM Elements ---
const loginOverlay = document.getElementById('loginOverlay');
const loginForm = document.getElementById('loginForm');
const userIdInput = document.getElementById('userId');
const passwordInput = document.getElementById('password');
const loginError = document.getElementById('loginError');
const loginSubmitBtn = document.getElementById('loginSubmitBtn');
const mainAppContainer = document.getElementById('mainAppContainer');

const registerForm = document.getElementById('registerForm');
const newRegisterUserIdInput = document.getElementById('newRegisterUserId');
const newRegisterPasswordInput = document.getElementById('newRegisterPassword');
const confirmPasswordInput = document.getElementById('confirmPassword');
const registerError = document.getElementById('registerError');
const registerSuccess = document.getElementById('registerSuccess');
const registerSubmitBtn = document.getElementById('registerSubmitBtn');

const statusMessageContainer = document.getElementById('statusMessageContainer');

const logEntriesPage = document.getElementById('logEntriesPage');
const addEntryPage = document.getElementById('addEntryPage');
const manageUsersPage = document.getElementById('manageUsersPage');

const logForm = document.getElementById('logForm');
const formTitle = document.getElementById('formTitle');
const submitBtn = document.getElementById('submitBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const entryIdInput = document.getElementById('entryId');
const partyNameInput = document.getElementById('partyName');
const jobTypeInput = document.getElementById('jobType');
const dateInput = document.getElementById('date');
const paymentInput = document.getElementById('payment');
const paymentModeInput = document.getElementById('paymentMode');
const jobDescriptionInput = document.getElementById('jobDescription');

const logEntriesContainer = document.getElementById('logEntriesContainer');
const noEntriesMessage = document.getElementById('noEntriesMessage');
const totalAmountDisplay = document.getElementById('totalAmountDisplay');
const totalAmountEl = document.getElementById('totalAmount');

const searchInput = document.getElementById('search');
const sortSelect = document.getElementById('sort');

// Manage Users Page Elements
const addUserForm = document.getElementById('addUserForm');
const newUserIdInput = document.getElementById('newUserId');
const newUserPasswordInput = document.getElementById('newUserPassword');
const newUserRoleInput = document.getElementById('newUserRole');
const addUserError = document.getElementById('addUserError');
const addUserSubmitBtn = document.getElementById('addUserSubmitBtn');
const usersListContainer = document.getElementById('usersListContainer');


// --- Login / Register Handling ---

// Clear errors when switching tabs
document.getElementById('sign-in-tab').addEventListener('shown.bs.tab', clearLoginErrors);
document.getElementById('register-tab').addEventListener('shown.bs.tab', clearLoginErrors);

function clearLoginErrors() {
    loginError.classList.add('d-none');
    registerError.classList.add('d-none');
    registerSuccess.classList.add('d-none');
    registerForm.reset();
    loginForm.reset();
}

// Handle Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const enteredUserId = userIdInput.value.trim();
    const enteredPassword = passwordInput.value;

    loginSubmitBtn.disabled = true;
    loginSubmitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Signing In...';
    loginError.classList.add('d-none');

    try {
        const response = await fetch(`${apiUrl}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: enteredUserId, password: enteredPassword })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }

        // Successful login
        currentUserRole = data.role;
        currentUserId = data.userId;

        loginOverlay.classList.add('d-none');
        mainAppContainer.classList.remove('d-none');

        setUIVisibilityByRole();

        showStatus(`Connected as ${currentUserId} (${currentUserRole})`, 'success', false);

        fetchLogEntries();

        showPage('logEntriesPage');

    } catch (error) {
        loginError.textContent = error.message;
        loginError.classList.remove('d-none');
    } finally {
        loginSubmitBtn.disabled = false;
        loginSubmitBtn.textContent = 'Sign In';
    }
});

// Handle Registration
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userId = newRegisterUserIdInput.value.trim();
    const password = newRegisterPasswordInput.value;
    const confirmPass = confirmPasswordInput.value;

    registerError.classList.add('d-none');
    registerSuccess.classList.add('d-none');

    if (password !== confirmPass) {
        registerError.textContent = 'Passwords do not match.';
        registerError.classList.remove('d-none');
        return;
    }

    if (!userId || !password) {
        registerError.textContent = 'User ID and Password are required.';
        registerError.classList.remove('d-none');
        return;
    }

    registerSubmitBtn.disabled = true;
    registerSubmitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Creating...';

    try {
        const response = await fetch(`${apiUrl}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Registration failed');
        }

        // Success!
        registerSuccess.textContent = 'Account created! Please sign in.';
        registerSuccess.classList.remove('d-none');
        registerForm.reset();

        setTimeout(() => {
            loginTab.show(); // Switch to login tab
        }, 2000);

    } catch (error) {
        registerError.textContent = error.message;
        registerError.classList.remove('d-none');
    } finally {
        registerSubmitBtn.disabled = false;
        registerSubmitBtn.textContent = 'Create Account';
    }
});


// --- Role-Based UI Control ---
function setUIVisibilityByRole() {
    const adminElements = document.querySelectorAll('.role-admin-only');

    if (currentUserRole === 'admin') {
        adminElements.forEach(el => {
            el.style.display = null; // Clear inline style to restore default
        });
    } else { // 'user' role
        adminElements.forEach(el => el.style.display = 'none');
    }
    // After roles are set, we must hide all pages except the default
    showPage('logEntriesPage');
}

// --- Page Navigation ---
function showPage(pageId) {
    document.querySelectorAll('.page-content').forEach(page => {
        page.classList.add('d-none');
    });

    const pageToShow = document.getElementById(pageId);
    if (pageToShow) {
        pageToShow.classList.remove('d-none');
    }

    if (pageId === 'manageUsersPage') {
        fetchUsersList(); // Refresh user list every time we visit
    }

    // Highlight active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active', 'fw-bold');
        if (link.dataset.page === pageId) {
            link.classList.add('active', 'fw-bold');
        }
    });
}

// --- Event Listeners for Navigation ---

// Listen for all page navigation clicks (desktop and mobile)
document.querySelectorAll('[data-page]').forEach(link => {
    link.addEventListener('click', (e) => {
        const pageId = e.currentTarget.dataset.page;

        if (pageId === 'addEntryPage') {
            resetForm();
        }

        showPage(pageId);
        mainNavbarCollapse.hide(); // Close mobile menu on click
    });
});

// Listen for all sign out clicks (desktop and mobile)
document.querySelectorAll('[data-action="signOut"]').forEach(link => {
    link.addEventListener('click', () => {
        handleSignOut();
        mainNavbarCollapse.hide(); // Close mobile menu on click
    });
});

// Cancel Edit button
cancelEditBtn.addEventListener('click', () => {
    resetForm();
    showPage('logEntriesPage');
});

// --- Sign Out ---
function handleSignOut() {
    mainAppContainer.classList.add('d-none');
    loginOverlay.classList.remove('d-none');

    clearLoginErrors();
    loginTab.show(); // Reset to login tab

    currentUserRole = null;
    currentUserId = null;
    allLogEntries = [];

    logEntriesContainer.innerHTML = '';
    noEntriesMessage.classList.remove('d-none');
    totalAmountEl.textContent = '₹0.00';
    usersListContainer.innerHTML = '';
    mainNavbarCollapse.hide();

    statusMessageContainer.innerHTML = ''; // Clear status bar
}


// --- Form Handling ---
logForm.addEventListener('submit', handleFormSubmit);

async function handleFormSubmit(e) {
    e.preventDefault();

    if (!currentUserRole) {
        showStatus("Error: Not signed in.", 'danger');
        return;
    }

    const entry = {
        partyName: partyNameInput.value,
        jobType: jobTypeInput.value,
        date: dateInput.value,
        payment: (currentUserRole === 'admin' && paymentInput.value) ? parseFloat(paymentInput.value) : 0,
        paymentMode: paymentModeInput.value,
        jobDescription: jobDescriptionInput.value,
    };

    if (currentUserRole === 'user' && currentEditId) {
        const originalEntry = allLogEntries.find(item => item.id === currentEditId);
        entry.payment = originalEntry ? originalEntry.payment : 0;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';

    try {
        let url = `${apiUrl}/entry`;
        let method = 'POST';

        if (currentEditId) {
            url = `${apiUrl}/entry/${currentEditId}`;
            method = 'PUT';
        }

        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json', },
            body: JSON.stringify(entry),
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || `Server error: ${response.statusText}`);
        }

        showStatus(currentEditId ? "Entry updated successfully!" : "Entry added successfully!", 'success');

        resetForm();
        showPage('logEntriesPage');
        fetchLogEntries();

    } catch (error) {
        console.error("Error saving document: ", error);
        showStatus(`Error: ${error.message}`, 'danger');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = currentEditId ? "Update Entry" : "Add Entry";
    }
}

// Reset form to default state
function resetForm() {
    logForm.reset();
    currentEditId = null;
    entryIdInput.value = "";
    formTitle.textContent = "Add New Entry";
    submitBtn.textContent = "Add Entry";
    cancelEditBtn.classList.add('d-none');

    if (currentUserRole === 'admin') {
        logForm.querySelectorAll('.role-admin-only').forEach(el => {
            el.style.display = null; // Restore
        });
    }
}

// --- Data Fetching and Rendering (Log Entries) ---

async function fetchLogEntries() {
    try {
        const response = await fetch(`${apiUrl}/entries`);
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || `Server error: ${response.statusText}`);
        }
        const data = await response.json();

        allLogEntries = data.map(doc => ({ id: doc._id, ...doc }));

        renderLogEntries();

    } catch (error) {
        console.error("Error fetching log entries: ", error);
        showStatus(`Error: ${error.message}`, 'danger');
    }
}

// --- Search and Sort Listeners ---
searchInput.addEventListener('input', renderLogEntries);
sortSelect.addEventListener('change', renderLogEntries);

// Render entries based on search and sort
function renderLogEntries() {
    let filteredEntries = [...allLogEntries];
    const searchTerm = searchInput.value.toLowerCase();

    // 1. Filter
    if (searchTerm) {
        filteredEntries = filteredEntries.filter(entry => {
            const paymentString = (entry.payment || '0').toString().toLowerCase();
            return (
                (entry.partyName || '').toLowerCase().includes(searchTerm) ||
                (entry.jobType || '').toLowerCase().includes(searchTerm) ||
                (currentUserRole === 'admin' && paymentString.includes(searchTerm)) ||
                (entry.date || '').toLowerCase().includes(searchTerm) ||
                (entry.jobDescription || '').toLowerCase().includes(searchTerm)
            );
        });
    }

    // 2. Sort
    const sortValue = sortSelect.value;
    switch (sortValue) {
        case 'date-desc':
            filteredEntries.sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.createdAt || '').localeCompare(a.createdAt || ''));
            break;
        case 'date-asc':
            filteredEntries.sort((a, b) => (a.date || '').localeCompare(b.date || '') || (a.createdAt || '').localeCompare(b.createdAt || ''));
            break;
        case 'name-asc':
            filteredEntries.sort((a, b) => (a.partyName || '').localeCompare(b.partyName || ''));
            break;
        case 'name-desc':
            filteredEntries.sort((a, b) => (b.partyName || '').localeCompare(a.partyName || ''));
            break;
        case 'amount-desc':
            if (currentUserRole === 'admin') {
                filteredEntries.sort((a, b) => (b.payment || 0) - (a.payment || 0));
            }
            break;
        case 'amount-asc':
            if (currentUserRole === 'admin') {
                filteredEntries.sort((a, b) => (a.payment || 0) - (b.payment || 0));
            }
            break;
    }

    // 3. Render
    logEntriesContainer.innerHTML = '';
    if (filteredEntries.length === 0) {
        noEntriesMessage.classList.remove('d-none');
    } else {
        noEntriesMessage.classList.add('d-none');

        let lastDate = null;
        const showDateDividers = sortValue.startsWith('date-');
        const colWrapper = document.createElement('div'); // Create a temporary wrapper
        colWrapper.className = 'col-12';

        filteredEntries.forEach(entry => {
            if (showDateDividers && entry.date !== lastDate) {
                if (lastDate !== null) {
                    logEntriesContainer.innerHTML += `<hr class="col-12 my-3 border-secondary-subtle">`;
                }
                lastDate = entry.date;
            }

            const card = createEntryCard(entry);
            logEntriesContainer.appendChild(card); // Append card directly to grid
        });
    }

    // 4. Update Total
    if (currentUserRole === 'admin') {
        const total = filteredEntries.reduce((sum, entry) => sum + (entry.payment || 0), 0);
        totalAmountEl.textContent = `₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
}

// Create HTML for a single entry card
function createEntryCard(entry) {
    const col = document.createElement('div');
    // col.className = 'col'; // Bootstrap grid handles this

    const card = document.createElement('div');
    card.className = 'card shadow-sm border-0 h-100';

    const paymentAmount = (entry.payment || 0).toLocaleString('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2
    });

    const dateParts = (entry.date || '---').split('-');
    const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : (entry.date || 'No Date');

    const cardBody = document.createElement('div');
    cardBody.className = 'card-body d-flex flex-column';

    cardBody.innerHTML = `
                <div class="flex-grow-1">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h3 class="h5 fw-bold text-primary mb-0">${entry.partyName || 'No Name'}</h3>
                        <span class="badge bg-light text-dark-emphasis border">${entry.paymentMode || 'N/A'}</span>
                    </div>
                    <p class="small text-muted mb-2">${formattedDate}</p>
                    
                    <h4 class="h6 text-dark fw-medium mb-3">${entry.jobType || 'No Job Type'}</h4>
                    
                    ${currentUserRole === 'admin' ? `
                    <p class="h4 fw-semibold text-dark mb-3">${paymentAmount}</p>
                    ` : ''}
                    
                    ${entry.jobDescription ? `
                    <p class="small text-muted fst-italic bg-light p-3 rounded-3 mb-3">${entry.jobDescription.replace(/\n/g, '<br>')}</p>
                    ` : ''}
                </div>
                
                <div class="card-buttons d-flex justify-content-end gap-2 pt-3 border-top mt-auto">
                    ${currentUserRole === 'admin' ? `
                    <button class="btn btn-sm btn-outline-success copy-btn" title="Copy to Clipboard">
                        <i class="bi bi-clipboard"></i> Copy
                    </button>
                    ` : ''}
                    <button class="btn btn-sm btn-outline-primary edit-btn" title="Edit">
                        <i class="bi bi-pencil-square"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-btn" title="Delete">
                        <i class="bi bi-trash"></i> Delete
                    </button>
                </div>
            `;

    // Add event listeners
    cardBody.querySelector('.edit-btn').addEventListener('click', () => handleEdit(entry));
    cardBody.querySelector('.delete-btn').addEventListener('click', () => handleDeleteEntry(entry.id));

    if (currentUserRole === 'admin') {
        const copyBtn = cardBody.querySelector('.copy-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => handleCopyToClipboard(entry));
        }
    }

    card.appendChild(cardBody);
    col.appendChild(card);
    return col;
}

// --- Edit, Copy, and Delete (Log Entries) ---

function handleCopyToClipboard(entry) {
    const dateParts = (entry.date || '---').split('-');
    const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : (entry.date || 'No Date');

    const paymentAmount = (entry.payment || 0).toLocaleString('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2
    });

    const textToCopy = [
        `Date: ${formattedDate}`,
        `Party Name: ${entry.partyName || ''}`,
        `Job Type: ${entry.jobType || ''}`,
        `Description: ${entry.jobDescription || 'N/A'}`,
        `Payment: ${paymentAmount}`,
        `Mode: ${entry.paymentMode || ''}`
    ].join('\n');

    try {
        const textArea = document.createElement("textarea");
        textArea.value = textToCopy;
        textArea.style.position = "fixed";
        textArea.style.top = "-9999px";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            showStatus('Entry copied to clipboard!', 'success');
        } catch (err) {
            console.error('Fallback copy error:', err);
            showStatus('Failed to copy text.', 'danger');
        }
        document.body.removeChild(textArea);
    } catch (err) {
        console.error('Async copy error: ', err);
        showStatus('Failed to copy text.', 'danger');
    }
}

// Populate form for editing
function handleEdit(entry) {
    currentEditId = entry.id;
    entryIdInput.value = entry.id;
    partyNameInput.value = entry.partyName;
    jobTypeInput.value = entry.jobType;
    dateInput.value = entry.date;
    jobDescriptionInput.value = entry.jobDescription;

    if (currentUserRole === 'admin') {
        paymentInput.value = entry.payment;
    }

    paymentModeInput.value = entry.paymentMode;

    formTitle.textContent = "Edit Entry";
    submitBtn.textContent = "Update Entry";
    cancelEditBtn.classList.remove('d-none');

    showPage('addEntryPage');
}

// Delete an entry
async function handleDeleteEntry(id) {
    try {
        const response = await fetch(`${apiUrl}/entry/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || `Server error: ${response.statusText}`);
        }
        showStatus("Entry deleted.", 'success');
    } catch (error) {
        console.error("Error deleting document: ", error);
        showStatus(`Error: ${error.message}`, 'danger');
    } finally {
        fetchLogEntries();
    }
}

// --- Manage Users Page Logic ---

addUserForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const userId = newUserIdInput.value.trim();
    const password = newUserPasswordInput.value;
    const role = newUserRoleInput.value;

    if (!userId || !password) {
        addUserError.textContent = "User ID and Password are required.";
        addUserError.classList.remove('d-none');
        return;
    }

    addUserSubmitBtn.disabled = true;
    addUserSubmitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Adding...';
    addUserError.classList.add('d-none');

    try {
        const response = await fetch(`${apiUrl}/user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, password, role })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to add user');
        }

        showStatus('User added successfully!', 'success');
        addUserForm.reset();
        fetchUsersList();

    } catch (error) {
        console.error("Error adding user:", error);
        addUserError.textContent = error.message;
        addUserError.classList.remove('d-none');
    } finally {
        addUserSubmitBtn.disabled = false;
        addUserSubmitBtn.textContent = 'Add User';
    }
});

async function fetchUsersList() {
    try {
        const response = await fetch(`${apiUrl}/users`);
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to fetch users');
        }

        const users = await response.json();
        renderUsersList(users);

    } catch (error) {
        console.error("Error fetching users:", error);
        showStatus(`Error: ${error.message}`, 'danger');
        usersListContainer.innerHTML = `<div class="list-group-item p-4 text-danger">Could not load users.</div>`;
    }
}

function renderUsersList(users) {
    usersListContainer.innerHTML = ''; // Clear list
    if (users.length === 0) {
        usersListContainer.innerHTML = `<div class="list-group-item p-4 text-muted">No users found.</div>`;
        return;
    }

    users.forEach(user => {
        const userEl = document.createElement('div');
        userEl.className = 'list-group-item list-group-item-action d-flex align-items-center justify-content-between p-3';

        const formattedDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB') : 'N/A';

        userEl.innerHTML = `
                    <div>
                        <p class="fs-6 fw-medium text-dark mb-0">${user.userId}</p>
                        <p class="small text-muted mb-0">
                            Role: <span class="fw-medium ${user.role === 'admin' ? 'text-primary' : 'text-dark'}">${user.role}</span> &bull; Created: ${formattedDate}
                        </p>
                    </div>
                    ${user.userId !== currentUserId ? `
                    <button data-id="${user._id}" class="btn btn-sm btn-outline-danger delete-user-btn" title="Delete User">
                        <i class="bi bi-trash"></i>
                    </button>
                    ` : `
                    <span class="badge bg-light text-dark-emphasis border">(Current User)</span>
                    `}
                `;

        const deleteBtn = userEl.querySelector('.delete-user-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent parent click
                handleDeleteUser(user._id);
            });
        }

        usersListContainer.appendChild(userEl);
    });
}

async function handleDeleteUser(id) {
    try {
        const response = await fetch(`${apiUrl}/user/${id}`, {
            method: 'DELETE',
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `Server error: ${response.statusText}`);
        }

        showStatus(data.message || "User deleted.", 'success');

    } catch (error) {
        console.error("Error deleting user: ", error);
        showStatus(`Error: ${error.message}`, 'danger');
    } finally {
        fetchUsersList(); // Refresh list
    }
}


// --- Utility ---

// Show status bar message
function showStatus(message, type = 'success', autoHide = true) {
    const alertType = type === 'success' ? 'alert-success' : 'alert-danger';
    const alert = document.createElement('div');
    alert.className = `alert ${alertType} alert-dismissible fade show m-0 border-0`;
    alert.role = 'alert';

    alert.innerHTML = `
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            `;

    statusMessageContainer.innerHTML = ''; // Clear old alerts
    statusMessageContainer.appendChild(alert);

    if (autoHide) {
        setTimeout(() => {
            const alertInstance = bootstrap.Alert.getOrCreateInstance(alert);
            if (alertInstance) {
                alertInstance.close();
            }
        }, 3000);
    }
}