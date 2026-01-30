// Admin Dashboard functionality
const API_BASE = 'http://localhost:3000/api';
let serverTimeOffset = 0;
let currentTrucks = [];
let currentUser = null;
let currentWarehouseId = null;

// Check authentication on page load
async function checkAuth() {
    try {
        const response = await fetch(`${API_BASE}/auth/check`, {
            credentials: 'include'
        });
        const data = await response.json();

        if (!data.authenticated) {
            window.location.href = 'login.html';
            return;
        }

        currentUser = data;

        // Display user info
        document.getElementById('usernameDisplay').textContent = data.username;
        if (data.role) {
            document.getElementById('userRoleDisplay').textContent = data.role === 'super_admin' ? 'Super Admin' : 'Admin';
        }

        // Handle Warehouse Logic
        if (data.role === 'super_admin') {
            await loadWarehouses();
            // Show Manage Admins Section
            const manageSection = document.getElementById('manageAdminsSection');
            if (manageSection) {
                manageSection.style.display = 'block';
                loadAdmins();
            }

            // Default to first warehouse
            const selector = document.getElementById('warehouseSelector');
            if (selector.options.length > 1) {
                currentWarehouseId = selector.options[1].value; // First actual option
                selector.value = currentWarehouseId;
            }
        } else {
            currentWarehouseId = data.warehouse_id;
        }

    } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = 'login.html';
    }
}

// Load Warehouses for Super Admin
async function loadWarehouses() {
    try {
        const response = await fetch(`${API_BASE}/warehouses`);
        const data = await response.json();

        if (data.success) {
            const container = document.getElementById('warehouseSelectorContainer');
            const selector = document.getElementById('warehouseSelector');

            container.style.display = 'block';
            selector.innerHTML = '<option value="" disabled>Select Warehouse</option>';

            data.warehouses.forEach(w => {
                const option = document.createElement('option');
                option.value = w.id;
                option.textContent = w.name;
                selector.appendChild(option);
            });

            // Add change listener
            selector.addEventListener('change', (e) => {
                currentWarehouseId = e.target.value;
                loadQueue(); // Reload queue for new warehouse
            });

            // Initialize custom dropdowns
            initCustomDropdowns();
        }
    } catch (error) {
        console.error('Error loading warehouses:', error);
    }
}

// Manage Admins Logic
async function loadAdmins() {
    const tbody = document.getElementById('adminsTableBody');
    if (!tbody) return;

    try {
        const response = await fetch(`${API_BASE}/admin`, { credentials: 'include' });
        const data = await response.json();

        if (data.success) {
            tbody.innerHTML = data.admins.map(admin => `
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 12px;">${admin.username}</td>
                    <td style="padding: 12px;"><span style="background: #eee; padding: 2px 6px; border-radius: 4px; font-size: 0.85rem;">${admin.role}</span></td>
                    <td style="padding: 12px;">${admin.role === 'super_admin' ? 'All (Super Admin)' : (admin.warehouse_name || 'None')}</td>
                    <td style="padding: 12px;">
                        <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.85rem;" onclick="openEditAdminModal('${admin.id}', '${admin.username}', '${admin.warehouse_id}')">✏️ Edit</button>
                        <button class="btn btn-danger" style="padding: 4px 8px; font-size: 0.85rem; margin-left: 5px;" onclick="deleteAdmin('${admin.id}', '${admin.username}')">🗑️ Delete</button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading admins:', error);
        tbody.innerHTML = '<tr><td colspan="4" style="padding: 12px; color: red;">Failed to load admins</td></tr>';
    }
}

// Delete Admin Logic
async function deleteAdmin(id, username) {
    if (!confirm(`Are you sure you want to delete admin "${username}"? This action cannot be undone.`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/admin/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        const data = await response.json();

        if (data.success) {
            loadAdmins(); // Refresh table
            const msg = document.getElementById('adminMessageBox');
            if (msg) {
                msg.textContent = `Admin "${username}" deleted successfully`;
                msg.className = 'success';
                msg.style.display = 'block';
                setTimeout(() => msg.style.display = 'none', 3000);
            }
        } else {
            alert(data.message || 'Failed to delete admin');
        }
    } catch (error) {
        console.error('Delete admin error:', error);
        alert('An error occurred while deleting the admin');
    }
}

// --- End of Generic Custom Dropdown System --- (Logic moved to custom-dropdown.js)


// Add Admin Modal
function openAddAdminModal() {
    // Populate warehouse dropdown if empty or needed
    const warehouseSelect = document.getElementById('newAdminWarehouse');
    if (warehouseSelect.options.length <= 1) {
        // Copy options from main selector
        const mainSelector = document.getElementById('warehouseSelector');
        warehouseSelect.innerHTML = mainSelector.innerHTML;
    }

    // Ensure initialized
    initCustomDropdowns();
    // Update options in case they changed
    updateCustomDropdownOptions(warehouseSelect);
    // Also update Role dropdown if needed
    updateCustomDropdownOptions(document.getElementById('newAdminRole'));

    document.getElementById('addAdminModal').style.display = 'flex';
}

function closeAddAdminModal() {
    document.getElementById('addAdminModal').style.display = 'none';
}

const addAdminForm = document.getElementById('addAdminForm');
if (addAdminForm) {
    addAdminForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        // Validate
        if (data.role === 'admin' && !data.warehouse_id) {
            document.getElementById('addAdminMessage').innerHTML = '<div class="alert alert-error">❌ Please select a warehouse for regular admins.</div>';
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/admin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(data)
            });
            const result = await response.json();

            if (result.success) {
                document.getElementById('addAdminMessage').innerHTML = '<div class="alert alert-success">✅ Admin created!</div>';
                loadAdmins();
                e.target.reset();
                setTimeout(() => {
                    document.getElementById('addAdminMessage').innerHTML = '';
                    closeAddAdminModal();
                }, 1000);
            } else {
                document.getElementById('addAdminMessage').innerHTML = `<div class="alert alert-error">❌ ${result.message}</div>`;
            }
        } catch (error) {
            document.getElementById('addAdminMessage').innerHTML = '<div class="alert alert-error">❌ Failed to create admin.</div>';
        }
    });
}

// Edit Admin Modal
function openEditAdminModal(id, username, warehouseId) {
    document.getElementById('edit_admin_id').value = id;
    document.getElementById('edit_admin_username').value = username;

    // Populate dropdown
    const warehouseSelect = document.getElementById('edit_admin_warehouse');
    const mainSelector = document.getElementById('warehouseSelector');
    warehouseSelect.innerHTML = mainSelector.innerHTML;

    // Set value (handle null/undefined/string 'null')
    if (warehouseId && warehouseId !== 'null' && warehouseId !== 'undefined') {
        warehouseSelect.value = warehouseId;
    } else {
        warehouseSelect.value = "";
    }

    // Initialize and Update UI
    initCustomDropdowns();
    updateCustomDropdownOptions(warehouseSelect);

    // Force trigger update for selected value
    // (The updateCustomDropdownOptions syncs trigger text, but let's be sure)
    const event = new Event('change');
    warehouseSelect.dispatchEvent(event);

    document.getElementById('editAdminModal').style.display = 'flex';
}

function closeEditAdminModal() {
    document.getElementById('editAdminModal').style.display = 'none';
}

const editAdminForm = document.getElementById('editAdminForm');
if (editAdminForm) {
    editAdminForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('edit_admin_id').value;
        const username = document.getElementById('edit_admin_username').value;
        const password = document.getElementById('edit_admin_password').value;
        const warehouse_id = document.getElementById('edit_admin_warehouse').value;

        const body = { username, warehouse_id };
        if (password) body.password = password;

        try {
            const response = await fetch(`${API_BASE}/admin/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(body)
            });
            const result = await response.json();

            if (result.success) {
                document.getElementById('editAdminMessage').innerHTML = '<div class="alert alert-success">✅ Admin updated!</div>';
                loadAdmins();
                setTimeout(() => {
                    document.getElementById('editAdminMessage').innerHTML = '';
                    closeEditAdminModal();
                }, 1000);
            } else {
                document.getElementById('editAdminMessage').innerHTML = `<div class="alert alert-error">❌ ${result.message}</div>`;
            }
        } catch (error) {
            document.getElementById('editAdminMessage').innerHTML = '<div class="alert alert-error">❌ Failed to update admin.</div>';
        }
    });
}


// Get server time and calculate offset
async function syncServerTime() {
    try {
        const clientTime = Date.now();
        const response = await fetch(`${API_BASE}/trucks/time`);
        const data = await response.json();

        if (data.success) {
            const serverTime = new Date(data.server_time).getTime();
            serverTimeOffset = serverTime - clientTime;
        }
    } catch (error) {
        console.error('Error syncing server time:', error);
    }
}

// Get current BDT time (server-synchronized)
function getCurrentBDT() {
    return new Date(Date.now() + serverTimeOffset);
}

// Format duration (ms) to human-readable string
function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
        return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    } else {
        return `${seconds}s`;
    }
}

// Format date to BDT readable format
function formatBDTTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-BD', {
        timeZone: 'Asia/Dhaka',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Update all timers
function updateTimers() {
    const now = getCurrentBDT();

    currentTrucks.forEach(truck => {
        if (truck.serial_number === 1 && truck.time_loading_started) {
            // Update loading timer
            const loadingStartTime = new Date(truck.time_loading_started);
            const elapsed = now - loadingStartTime;
            const timerElement = document.getElementById(`loading-timer-${truck.id}`);
            if (timerElement) {
                timerElement.textContent = formatDuration(elapsed);
            }
        } else if (truck.time_of_entry) {
            // Update waiting timer
            const entryTime = new Date(truck.time_of_entry);
            const elapsed = now - entryTime;
            const timerElement = document.getElementById(`waiting-timer-${truck.id}`);
            if (timerElement) {
                timerElement.textContent = formatDuration(elapsed);
            }
        }
    });
}

// Logout functionality
document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        await fetch(`${API_BASE}/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Logout error:', error);
        alert('Logout failed');
    }
});

// Add truck form
document.getElementById('addTruckForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!currentWarehouseId) {
        alert('Please select a warehouse first.');
        return;
    }

    const formData = {
        warehouse_id: currentWarehouseId,
        licence_number: document.getElementById('licence_number').value,
        driver_name: document.getElementById('driver_name').value,
        driver_phone: document.getElementById('driver_phone').value,
        sales_manager: document.getElementById('sales_manager').value,
        buyer_name: document.getElementById('buyer_name').value,
        destination: document.getElementById('destination').value
    };

    const messageBox = document.getElementById('addMessageBox');
    const addText = document.getElementById('addText');
    const addSpinner = document.getElementById('addSpinner');

    // Show loading
    addText.style.display = 'none';
    addSpinner.style.display = 'inline-block';
    messageBox.innerHTML = '';

    try {
        const response = await fetch(`${API_BASE}/trucks/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (data.success) {
            messageBox.innerHTML = `<div class="alert alert-success">✅ Truck added successfully! Serial Number: ${data.serial_number}</div>`;
            document.getElementById('addTruckForm').reset();
            loadQueue(); // Refresh queue
        } else {
            messageBox.innerHTML = `<div class="alert alert-error">❌ ${data.message}</div>`;
        }
    } catch (error) {
        console.error('Add truck error:', error);
        messageBox.innerHTML = '<div class="alert alert-error">❌ Failed to add truck. Please try again.</div>';
    } finally {
        addText.style.display = 'inline';
        addSpinner.style.display = 'none';
    }
});

// Load and display queue
async function loadQueue() {
    const queueContainer = document.getElementById('queueContainer');

    if (!currentWarehouseId) {
        queueContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">Please select a warehouse to view queue</p>';
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/trucks/queue/${currentWarehouseId}`, {
            credentials: 'include'
        });
        const data = await response.json();

        if (data.success) {
            currentTrucks = data.queue;

            // Update server time offset if provided
            if (data.server_time) {
                const serverTime = new Date(data.server_time).getTime();
                serverTimeOffset = serverTime - Date.now();
            }

            if (currentTrucks.length > 0) {
                queueContainer.innerHTML = renderQueue(currentTrucks);
                // Add finish button listeners
                document.querySelectorAll('.finish-btn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const truckId = e.target.closest('button').dataset.id;
                        await finishTruck(truckId);
                    });
                });

                // Add edit/delete listeners (Super Admin)
                document.querySelectorAll('.edit-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const truckId = e.target.dataset.id;
                        openEditModal(truckId);
                    });
                });

                document.querySelectorAll('.delete-btn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const truckId = e.target.dataset.id;
                        await deleteTruck(truckId);
                    });
                });
            } else {
                queueContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No trucks in queue</p>';
            }

        } else {
            queueContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No trucks in queue</p>';
        }
    } catch (error) {
        console.error('Load queue error:', error);
        queueContainer.innerHTML = '<p style="text-align: center; color: var(--danger-solid); padding: 2rem;">Failed to load queue</p>';
    }
}

// Render queue HTML
function renderQueue(trucks) {
    return `
        <div class="truck-grid">
            ${trucks.map(truck => {
        const isLoading = truck.serial_number === 1;
        const loadingTime = truck.time_loading_started ?
            formatDuration(getCurrentBDT() - new Date(truck.time_loading_started)) : 'N/A';
        const waitingTime = truck.time_of_entry ?
            formatDuration(getCurrentBDT() - new Date(truck.time_of_entry)) : 'N/A';

        return `
                    <div class="truck-card ${isLoading ? 'serial-1' : ''}">
                        <div class="truck-serial">Serial #${truck.serial_number}</div>
                        ${isLoading ? '<div style="color: #1a1a1a; font-weight: 600; margin-bottom: 0.5rem;">🔄 Currently Loading</div>' : '<div style="color: #666; font-weight: 500; margin-bottom: 0.5rem;">⏳ Waiting</div>'}
                        
                        ${isLoading && truck.time_loading_started ? `
                            <div style="background: #fafafa; padding: 12px; border-radius: 6px; margin-bottom: 1rem;">
                                <div style="font-size: 0.85rem; color: #666; margin-bottom: 4px;">⏱️ Loading Time</div>
                                <div id="loading-timer-${truck.id}" style="font-size: 1.3rem; font-weight: 700; color: #1a1a1a;">${loadingTime}</div>
                                <div style="font-size: 0.75rem; color: #999; margin-top: 4px;">Started: ${formatBDTTime(truck.time_loading_started)}</div>
                            </div>
                        ` : ''}
                        
                        ${!isLoading && truck.time_of_entry ? `
                            <div style="background: #fafafa; padding: 10px; border-radius: 6px; margin-bottom: 1rem;">
                                <div style="font-size: 0.8rem; color: #666; margin-bottom: 3px;">⏳ Waiting Time</div>
                                <div id="waiting-timer-${truck.id}" style="font-size: 1.1rem; font-weight: 600; color: #1a1a1a;">${waitingTime}</div>
                                <div style="font-size: 0.7rem; color: #999; margin-top: 3px;">Entry: ${formatBDTTime(truck.time_of_entry)}</div>
                            </div>
                        ` : ''}
                        
                        <div class="truck-info">
                            <div class="info-row">
                                <span class="info-label">Licence:</span>
                                <span class="info-value">${truck.licence_number}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Driver:</span>
                                <span class="info-value">${truck.driver_name}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Phone:</span>
                                <span class="info-value">${truck.driver_phone}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Buyer:</span>
                                <span class="info-value">${truck.buyer_name}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Destination:</span>
                                <span class="info-value">${truck.destination}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Sales Manager:</span>
                                <span class="info-value">${truck.sales_manager || 'N/A'}</span>
                            </div>
                        </div>
                        
                        ${isLoading ? `
                            <button class="btn btn-success finish-btn" data-id="${truck.id}" style="width: 100%; margin-top: 1rem;">
                                ✅ Mark as Finished
                            </button>
                        ` : ''}
                        
                        ${currentUser && currentUser.role === 'super_admin' ? `
                            <div style="display: flex; gap: 10px; margin-top: 10px;">
                                <button class="btn btn-secondary edit-btn" data-id="${truck.id}" style="flex: 1;">✏️ Edit</button>
                                <button class="btn btn-danger delete-btn" data-id="${truck.id}" style="flex: 1;">🗑️ Delete</button>
                            </div>
                        ` : ''}
                    </div>
                `;
    }).join('')}
        </div>
    `;
}

// Finish truck
async function finishTruck(truckId) {
    if (!confirm('Mark this truck as finished? The queue will automatically update.')) {
        return;
    }
    await performTruckAction(`${API_BASE}/trucks/finish/${truckId}`, { warehouse_id: currentWarehouseId }, '✅ Truck marked as finished! Queue updated.');
}

// Delete truck
async function deleteTruck(truckId) {
    if (!confirm('⚠️ Are you sure you want to DELETE this truck?\n\nThis will permanently remove it from the queue and shift all subsequent serial numbers down (e.g., #4 becomes #3).\n\nThis action cannot be undone.')) {
        return;
    }
    await performTruckAction(`${API_BASE}/trucks/finish/${truckId}`, null, '', 'DELETE'); // Reuse helper? No, endpoint is different.

    // Custom delete implementation
    const messageBox = document.getElementById('queueMessageBox');
    messageBox.innerHTML = '';

    try {
        const response = await fetch(`${API_BASE}/trucks/${truckId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ warehouse_id: currentWarehouseId })
        });

        const data = await response.json();

        if (data.success) {
            messageBox.innerHTML = '<div class="alert alert-success">✅ Truck deleted and queue reordered.</div>';
            loadQueue();
            setTimeout(() => { messageBox.innerHTML = ''; }, 3000);
        } else {
            messageBox.innerHTML = `<div class="alert alert-error">❌ ${data.message}</div>`;
        }
    } catch (error) {
        console.error('Delete truck error:', error);
        messageBox.innerHTML = '<div class="alert alert-error">❌ Failed to delete truck.</div>';
    }
}

// Helper for actions
async function performTruckAction(url, body, successMsg, method = 'POST') {
    const messageBox = document.getElementById('queueMessageBox');
    messageBox.innerHTML = '';

    try {
        const options = {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        };
        if (body) options.body = JSON.stringify(body);

        const response = await fetch(url, options);
        const data = await response.json();

        if (data.success) {
            messageBox.innerHTML = `<div class="alert alert-success">${successMsg}</div>`;
            loadQueue();
            setTimeout(() => { messageBox.innerHTML = ''; }, 3000);
        } else {
            messageBox.innerHTML = `<div class="alert alert-error">❌ ${data.message}</div>`;
        }
    } catch (error) {
        console.error('Action error:', error);
        messageBox.innerHTML = '<div class="alert alert-error">❌ Action failed.</div>';
    }
}


// Edit Modal Functions
function openEditModal(truckId) {
    const truck = currentTrucks.find(t => t.id == truckId);
    if (!truck) return;

    document.getElementById('edit_truck_id').value = truck.id;
    document.getElementById('edit_licence_number').value = truck.licence_number;
    document.getElementById('edit_driver_name').value = truck.driver_name;
    document.getElementById('edit_driver_phone').value = truck.driver_phone;
    document.getElementById('edit_sales_manager').value = truck.sales_manager || '';
    document.getElementById('edit_buyer_name').value = truck.buyer_name;
    document.getElementById('edit_destination').value = truck.destination;

    // Refresh custom dropdown for edit form
    initCustomDropdowns(); // Ensure elements are wrapped
    updateCustomDropdownOptions(document.getElementById('edit_sales_manager'));

    // Set custom dropdown value
    const editSalesWrapper = document.getElementById('edit_sales_manager').nextElementSibling;
    if (editSalesWrapper && editSalesWrapper.classList.contains('custom-select-wrapper')) {
        const option = editSalesWrapper.querySelector(`.custom-option[data-value="${truck.sales_manager || ''}"]`);
        if (option) {
            editSalesWrapper.querySelector('.custom-select__trigger span').textContent = option.textContent;
            editSalesWrapper.querySelectorAll('.custom-option').forEach(o => o.classList.remove('selected'));
            option.classList.add('selected');
        }
    }

    document.getElementById('editModal').style.display = 'flex';
}

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
}

// Edit Form Submit
document.getElementById('editTruckForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const truckId = document.getElementById('edit_truck_id').value;
    const formData = {
        licence_number: document.getElementById('edit_licence_number').value,
        driver_name: document.getElementById('edit_driver_name').value,
        driver_phone: document.getElementById('edit_driver_phone').value,
        sales_manager: document.getElementById('edit_sales_manager').value,
        buyer_name: document.getElementById('edit_buyer_name').value,
        destination: document.getElementById('edit_destination').value,
        warehouse_id: currentWarehouseId // Context
    };

    const messageBox = document.getElementById('editMessageBox');
    messageBox.innerHTML = '';

    try {
        const response = await fetch(`${API_BASE}/trucks/${truckId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (data.success) {
            messageBox.innerHTML = '<div class="alert alert-success">✅ Truck updated!</div>';
            setTimeout(() => {
                closeEditModal();
                loadQueue();
            }, 1000);
        } else {
            messageBox.innerHTML = `<div class="alert alert-error">❌ ${data.message}</div>`;
        }
    } catch (error) {
        console.error('Update error:', error);
        messageBox.innerHTML = '<div class="alert alert-error">❌ Failed to update truck.</div>';
    }
});

// Refresh button
document.getElementById('refreshBtn').addEventListener('click', loadQueue);

// Initialize
async function init() {
    await checkAuth();
    await syncServerTime();
    if (currentWarehouseId) {
        await loadQueue();
    }

    // Update timers every second
    setInterval(updateTimers, 1000);

    // Auto-refresh queue every 30 seconds
    setInterval(loadQueue, 30000);

    // Initialize custom dropdowns globally
    initCustomDropdowns();
}

init();
