
// --- App Configuration ---
const apiUrl = 'https://harshid-engravers.onrender.com/api'; // Our backend server

// --- Global Variables ---
let allLogEntries = []; // Local cache for all entries
let currentEditId = null; // To track editing
let currentUserRole = null; // 'admin' or 'user'
let currentUserId = null; // The logged-in user's ID string

// --- DOM Elements ---
const loginOverlay = document.getElementById('loginOverlay');
const loginForm = document.getElementById('loginForm');
const userIdInput = document.getElementById('userId');
const passwordInput = document.getElementById('password');
const loginError = document.getElementById('loginError');
const loginSubmitBtn = document.getElementById('loginSubmitBtn');
const mainAppContainer = document.getElementById('mainAppContainer');

// Login Tabs
/* REMOVED: signInTab and registerTab variables */
const showRegisterView = document.getElementById('showRegisterView'); // ADDED
const showSignInView = document.getElementById('showSignInView'); // ADDED

const signInView = document.getElementById('signInView');
const registerView = document.getElementById('registerView');
const registerForm = document.getElementById('registerForm');
const newRegisterUserIdInput = document.getElementById('newRegisterUserId');
const newRegisterPasswordInput = document.getElementById('newRegisterPassword');
const confirmPasswordInput = document.getElementById('confirmPassword');
const registerError = document.getElementById('registerError');
const registerSuccess = document.getElementById('registerSuccess');
const registerSubmitBtn = document.getElementById('registerSubmitBtn');

const authStatus = document.getElementById('authStatus');
const statusMessage = document.getElementById('statusMessage');

// --- Mobile Menu Elements ---
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');

const navLogEntries = document.querySelector('[data-page="logEntriesPage"]'); // Will find the first one
const navAddEntry = document.querySelector('[data-page="addEntryPage"]');
const navManageUsers = document.querySelector('[data-page="manageUsersPage"]');

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

// Tab switching
showRegisterView.addEventListener('click', () => { // UPDATED
    signInView.classList.add('hidden');
    registerView.classList.remove('hidden');
    clearLoginErrors();
});

showSignInView.addEventListener('click', () => { // UPDATED
    signInView.classList.remove('hidden');
    registerView.classList.add('hidden');
    clearLoginErrors();
});

function clearLoginErrors() {
    loginError.classList.add('hidden');
    registerError.classList.add('hidden');
    registerSuccess.classList.add('hidden');
    registerForm.reset();
    loginForm.reset();
}

// Handle Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const enteredUserId = userIdInput.value.trim();
    const enteredPassword = passwordInput.value;

    loginSubmitBtn.disabled = true;
    loginSubmitBtn.textContent = 'Signing In...';
    loginError.classList.add('hidden');

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

        // Hide login, show app
        loginOverlay.classList.add('hidden');
        mainAppContainer.classList.remove('hidden');

        // Set UI based on role
        setUIVisibilityByRole();

        // We just need to fetch the data now.
        statusMessage.classList.remove('hidden');
        authStatus.textContent = `Status: Connected as ${currentUserId} (${currentUserRole})`;
        statusMessage.classList.add('bg-green-100', 'text-green-800', 'border-green-300');
        statusMessage.classList.remove('bg-red-100', 'text-red-800', 'border-red-300');

        fetchLogEntries(); // Fetch data from MongoDB

        // Now that app is visible, show the default page
        showPage('logEntriesPage');

        // Init icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

    } catch (error) {
        // Failed login
        loginError.textContent = error.message;
        loginError.classList.remove('hidden');
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

    registerError.classList.add('hidden');
    registerSuccess.classList.add('hidden');

    if (password !== confirmPass) {
        registerError.textContent = 'Passwords do not match.';
        registerError.classList.remove('hidden');
        return;
    }

    if (!userId || !password) {
        registerError.textContent = 'User ID and Password are required.';
        registerError.classList.remove('hidden');
        return;
    }

    registerSubmitBtn.disabled = true;
    registerSubmitBtn.textContent = 'Creating Account...';

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
        registerSuccess.classList.remove('hidden');
        registerForm.reset();
        // Switch back to login tab
        setTimeout(() => {
            showSignInView.click(); // UPDATED
        }, 2000);

    } catch (error) {
        registerError.textContent = error.message;
        registerError.classList.remove('hidden');
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
            // Restore original display type (flex, block, etc.)

            if (el.id === 'manageUsersPage') {
                // Let showPage() handle this page's visibility
                return;
            }

            if (el.id === 'totalAmountDisplay') el.style.display = 'flex';
            else if (el.id === 'navManageUsers') el.style.display = 'block';
            else el.style.display = 'block';
        });
    } else { // 'user' role
        adminElements.forEach(el => el.style.display = 'none');
    }
}

// --- Page Navigation ---
function showPage(pageId) {
    // Explicitly set display:none to override inline styles
    document.querySelectorAll('.page-content').forEach(page => {
        page.classList.add('hidden');
        page.style.display = 'none'; // This is the fix
    });

    const pageToShow = document.getElementById(pageId);
    if (pageToShow) {
        pageToShow.classList.remove('hidden');
        // Special case for manage users page, which is a grid
        if (pageId === 'manageUsersPage') {
            pageToShow.style.display = 'grid'; // This overrides 'none'
            fetchUsersList(); // Refresh user list every time we visit
        } else {
            pageToShow.style.display = 'block'; // This overrides 'none' for other pages
        }
    }

    // Highlight active nav link
    document.querySelectorAll('.nav-link, .nav-link-mobile').forEach(link => {
        link.classList.remove('text-indigo-600', 'bg-indigo-50');
        link.classList.add('text-gray-600');

        // Special case for sign out
        if (link.dataset.action === 'signOut') {
            link.classList.add('hover:text-red-600', 'hover:bg-red-50');
            link.classList.remove('hover:text-indigo-600', 'hover:bg-indigo-50');
        }
    });

    const activeLinks = document.querySelectorAll(`[data-page="${pageId}"]`);
    activeLinks.forEach(link => {
        link.classList.add('text-indigo-600', 'bg-indigo-50');
        link.classList.remove('text-gray-600');
    });
}

// --- Event Listeners for Navigation ---

// Toggle mobile menu
mobileMenuBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
    // Re-render icons in case they were added dynamically
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});

// Listen for all page navigation clicks (desktop and mobile)
document.querySelectorAll('[data-page]').forEach(link => {
    link.addEventListener('click', () => {
        const pageId = link.dataset.page;

        if (pageId === 'addEntryPage') {
            resetForm();
        }

        showPage(pageId);
        mobileMenu.classList.add('hidden'); // Close mobile menu on click
    });
});

// Listen for all sign out clicks (desktop and mobile)
document.querySelectorAll('[data-action="signOut"]').forEach(link => {
    link.addEventListener('click', () => {
        handleSignOut();
        mobileMenu.classList.add('hidden'); // Close mobile menu on click
    });
});

// OLD Listeners - REMOVED
// navLogEntries.addEventListener('click', () => showPage('logEntriesPage'));
// navAddEntry.addEventListener('click', () => {
//     resetForm();
//     showPage('addEntryPage');
// });
// navManageUsers.addEventListener('click', () => showPage('manageUsersPage'));
cancelEditBtn.addEventListener('click', () => { // <-- THIS WAS MISSING
    resetForm();
    showPage('logEntriesPage');
});
// navSignOut.addEventListener('click', handleSignOut); // Added listener

// --- Sign Out ---
function handleSignOut() {
    // 1. Hide main app, show login
    mainAppContainer.classList.add('hidden');
    loginOverlay.classList.remove('hidden');

    // 2. Clear login form fields
    clearLoginErrors();

    // 3. Reset role
    currentUserRole = null;
    currentUserId = null;

    // 4. Clear local data
    allLogEntries = [];

    // 5. Clear UI
    logEntriesContainer.innerHTML = '';
    logEntriesContainer.classList.add('hidden'); // Hide container
    noEntriesMessage.classList.remove('hidden'); // Show "no entries"
    totalAmountEl.textContent = '₹0.00';
    usersListContainer.innerHTML = '';
    mobileMenu.classList.add('hidden'); // Ensure mobile menu is closed

    // 6. Reset status bar
    authStatus.textContent = "Signed Out.";
    statusMessage.classList.add('hidden');
    statusMessage.classList.remove('bg-green-100', 'text-green-800', 'border-green-300', 'bg-red-100', 'text-red-800', 'border-red-300');
}


// --- Form Handling ---
logForm.addEventListener('submit', handleFormSubmit);

// Add or Update Log Entry
async function handleFormSubmit(e) {
    e.preventDefault();

    if (!currentUserRole) {
        showStatus("Error: Not signed in.", 'error');
        return;
    }

    const entry = {
        partyName: partyNameInput.value,
        jobType: jobTypeInput.value,
        date: dateInput.value,
        payment: (currentUserRole === 'admin' && paymentInput.value) ? parseFloat(paymentInput.value) : 0, // Only save payment if admin
        paymentMode: paymentModeInput.value,
        jobDescription: jobDescriptionInput.value,
    };

    // For 'user' role, if they are editing, we must preserve the original payment
    if (currentUserRole === 'user' && currentEditId) {
        const originalEntry = allLogEntries.find(item => item.id === currentEditId);
        entry.payment = originalEntry ? originalEntry.payment : 0;
    }

    try {
        let url = `${apiUrl}/entry`;
        let method = 'POST';

        if (currentEditId) {
            // Update existing document
            url = `${apiUrl}/entry/${currentEditId}`;
            method = 'PUT';
        }

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(entry),
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || `Server error: ${response.statusText}`);
        }

        showStatus(currentEditId ? "Entry updated successfully!" : "Entry added successfully!", 'success');

        resetForm();
        showPage('logEntriesPage'); // Go back to log list
        fetchLogEntries(); // Manually refresh data

    } catch (error) {
        console.error("Error saving document: ", error);
        showStatus(`Error: ${error.message}`, 'error');
    }
}

// Reset form to default state
function resetForm() {
    logForm.reset();
    currentEditId = null;
    entryIdInput.value = "";
    formTitle.textContent = "Add New Entry";
    submitBtn.textContent = "Add Entry";
    cancelEditBtn.classList.add('hidden');

    // Ensure admin-only fields are visible if admin
    setUIVisibilityByRole();
}

// --- Data Fetching and Rendering (Log Entries) ---

// This is now a one-time fetch
async function fetchLogEntries() {
    try {
        const response = await fetch(`${apiUrl}/entries`);
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || `Server error: ${response.statusText}`);
        }
        const data = await response.json();

        // MongoDB uses _id, so we need to map it
        allLogEntries = data.map(doc => ({ id: doc._id, ...doc }));

        renderLogEntries(); // Render with default sort

    } catch (error) {
        console.error("Error fetching log entries: ", error);
        showStatus(`Error: ${error.message}`, 'error');
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
                (currentUserRole === 'admin' && paymentString.includes(searchTerm)) || // Only search payment if admin
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
    logEntriesContainer.innerHTML = ''; // Clear existing
    if (filteredEntries.length === 0) {
        noEntriesMessage.classList.remove('hidden');
        logEntriesContainer.classList.add('hidden');
    } else {
        noEntriesMessage.classList.add('hidden');
        logEntriesContainer.classList.remove('hidden');

        let lastDate = null;
        const showDateDividers = sortValue.startsWith('date-');

        filteredEntries.forEach(entry => {
            // Add date divider if needed
            if (showDateDividers && entry.date !== lastDate) {
                if (lastDate !== null) {
                    const hr = document.createElement('hr');
                    hr.className = 'border-t border-gray-200 md:col-span-2 lg:col-span-3 my-2';
                    logEntriesContainer.appendChild(hr);
                }
                lastDate = entry.date;
            }

            const card = createEntryCard(entry);
            logEntriesContainer.appendChild(card);
        });
    }

    // 4. Update Total (for admins)
    if (currentUserRole === 'admin') {
        const total = filteredEntries.reduce((sum, entry) => sum + (entry.payment || 0), 0);
        totalAmountEl.textContent = `₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    // 5. Update Icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Create HTML for a single entry card
function createEntryCard(entry) {
    const card = document.createElement('div');
    card.className = 'light-panel p-5 flex flex-col justify-between';

    const paymentAmount = (entry.payment || 0).toLocaleString('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2
    });

    // Format date: YYYY-MM-DD -> DD/MM/YYYY
    const dateParts = (entry.date || '---').split('-');
    const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : (entry.date || 'No Date');

    card.innerHTML = `
                <div>
                    <div class="flex justify-between items-start mb-2">
                        <h3 class="text-xl font-bold text-indigo-600">${entry.partyName || 'No Name'}</h3>
                        <span class="text-sm font-medium text-gray-600 bg-gray-100 px-2.5 py-0.5 rounded-full">${entry.paymentMode || 'N/A'}</span>
                    </div>
                    <p class="text-sm text-gray-500 mb-3">${formattedDate}</p>
                    
                    <p class="text-lg text-gray-800 mb-2">${entry.jobType || 'No Job Type'}</p>
                    
                    ${currentUserRole === 'admin' ? `
                    <p class="text-2xl font-semibold text-gray-900 mb-4">${paymentAmount}</p>
                    ` : ''}
                    
                    ${entry.jobDescription ? `
                    <p class="text-sm text-gray-600 italic bg-gray-50 p-3 rounded-md mb-4 whitespace-pre-wrap">${entry.jobDescription}</p>
                    ` : ''}
                </div>
                
                <div class="flex justify-end space-x-2 pt-4 border-t border-gray-200">
                    <button data-id="${entry.id}" class="edit-btn p-2 rounded-md hover:bg-indigo-50 transition-colors flex">
                        <i data-lucide="edit-3" class="w-5 h-5 pointer-events-none text-indigo-500 hover:text-indigo-700"></i>
                    </button>
                    <button data-id="${entry.id}" class="delete-btn p-2 rounded-md hover:bg-red-50 transition-colors flex">
                        <i data-lucide="trash-2" class="w-5 h-5 pointer-events-none text-red-500 hover:text-red-700"></i>
                    </button>
                </div>
            `;

    // Add event listeners for buttons
    card.querySelector('.edit-btn').addEventListener('click', () => handleEdit(entry));
    card.querySelector('.delete-btn').addEventListener('click', () => handleDeleteEntry(entry.id)); // Use entry.id (which is _id)

    return card;
}

// --- Edit and Delete (Log Entries) ---

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
    cancelEditBtn.classList.remove('hidden');

    showPage('addEntryPage');
}

// Delete an entry
async function handleDeleteEntry(id) {
    // No confirmation for now, as confirm() is blocked
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
        showStatus(`Error: ${error.message}`, 'error');
    } finally {
        fetchLogEntries(); // Manually refresh data
    }
}

// --- Manage Users Page Logic ---

// Add new user
addUserForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const userId = newUserIdInput.value.trim();
    const password = newUserPasswordInput.value;
    const role = newUserRoleInput.value;

    if (!userId || !password) {
        addUserError.textContent = "User ID and Password are required.";
        addUserError.classList.remove('hidden');
        return;
    }

    addUserSubmitBtn.disabled = true;
    addUserSubmitBtn.textContent = 'Adding...';
    addUserError.classList.add('hidden');

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
        fetchUsersList(); // Refresh the list

    } catch (error) {
        console.error("Error adding user:", error);
        addUserError.textContent = error.message;
        addUserError.classList.remove('hidden');
    } finally {
        addUserSubmitBtn.disabled = false;
        addUserSubmitBtn.textContent = 'Add User';
    }
});

// Fetch and display all users
async function fetchUsersList() {
    try {
        const response = await fetch(`${apiUrl}/users`);
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to fetch users');
        }

        const users = await response.json();
        renderUsersList(users);

    } catch (error) { // <-- ADDED BRACE
        console.error("Error fetching users:", error);
        showStatus(`Error: ${error.message}`, 'error');
        usersListContainer.innerHTML = `<p class="p-6 text-red-500">Could not load users.</p>`;
    } // <-- ADDED BRACE
}

// Render the list of users
function renderUsersList(users) {
    usersListContainer.innerHTML = ''; // Clear list
    if (users.length === 0) {
        usersListContainer.innerHTML = `<p class="p-6 text-gray-500">No users found.</p>`;
        return;
    }

    users.forEach(user => {
        const userEl = document.createElement('div');
        userEl.className = 'flex items-center justify-between p-4 md:p-6';

        const formattedDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB') : 'N/A';

        userEl.innerHTML = `
                    <div>
                        <p class="text-lg font-medium text-gray-900">${user.userId}</p>
                        <p class="text-sm text-gray-500">Role: <span class="font-medium ${user.role === 'admin' ? 'text-indigo-600' : 'text-gray-700'}">${user.role}</span> &bull; Created: ${formattedDate}</p>
                    </div>
                    ${user.userId !== currentUserId ? `
                    <button data-id="${user._id}" class="delete-user-btn p-2 rounded-md text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors">
                        <i data-lucide="trash-2" class="w-5 h-5 pointer-events-none"></i>
                    </button>
                    ` : `
                    <span class="text-sm text-gray-400 italic">(Current User)</span>
                    `}
                `;

        // Add delete listener if the button exists
        const deleteBtn = userEl.querySelector('.delete-user-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => handleDeleteUser(user._id));
        }

        usersListContainer.appendChild(userEl);
    });

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Delete a user
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
        showStatus(`Error: ${error.message}`, 'error');
    } finally {
        fetchUsersList(); // Refresh list
    }
}


// --- Utility ---

// Show status bar message
function showStatus(message, type = 'success') {
    authStatus.textContent = message;
    statusMessage.classList.remove('hidden');

    if (type === 'error') {
        statusMessage.classList.add('bg-red-100', 'text-red-800', 'border-red-300');
        statusMessage.classList.remove('bg-green-100', 'text-green-800', 'border-green-300');
    } else {
        statusMessage.classList.add('bg-green-100', 'text-green-800', 'border-green-300');
        statusMessage.classList.remove('bg-red-100', 'text-red-800', 'border-red-300');
    }

    // Auto-hide after 3 seconds
    setTimeout(() => {
        statusMessage.classList.add('hidden');
    }, 3000);
}

// --- Final Setup ---
// On initial load, reset form and set input colors correctly
// (This is handled by the new .form-input classes)
