const API_BASE = 'http://localhost:3000/api';
let charts = {
    completion: null,
    warehouse: null,
    warehouseCompletion: null,
    peakHours: null
};

// Initialize page
async function init() {
    await checkAuth();

    // Set default date range (last 30 days to tomorrow)
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 1); // Set to tomorrow to include all of today
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    // Use local date strings to avoid timezone issues with valueAsDate
    document.getElementById('endDate').value = endDate.toLocaleDateString('en-CA'); // YYYY-MM-DD format
    document.getElementById('startDate').value = startDate.toLocaleDateString('en-CA');

    await loadAllData();
}

// Check authentication
async function checkAuth() {
    try {
        const response = await fetch(`${API_BASE}/auth/check`, {
            credentials: 'include'
        });

        const data = await response.json();

        // If not authenticated, redirect to login
        if (!data.authenticated) {
            window.location.href = 'login.html';
            throw new Error('Not authenticated'); // Stop execution
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = 'login.html';
        throw error; // Stop execution
    }
}

// Load all data
async function loadAllData() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    if (!startDate || !endDate) {
        alert('Please select both start and end dates');
        return;
    }

    await Promise.all([
        loadSummary(startDate, endDate),
        loadCompletionStats(startDate, endDate),
        loadLoadingTime(startDate, endDate),
        loadWarehouseCompletion(startDate, endDate),
        loadPeakHours(startDate, endDate),
        loadSalesManagerPerformance(startDate, endDate)
    ]);
}

// Load summary stats
async function loadSummary(startDate, endDate) {
    try {
        const response = await fetch(`${API_BASE}/analytics/summary?startDate=${startDate}&endDate=${endDate}`, {
            credentials: 'include'
        });
        const data = await response.json();

        if (data.success) {
            const summary = data.summary;
            document.getElementById('statsGrid').innerHTML = `
                <div class="stat-card">
                    <h3>Total Trucks</h3>
                    <div class="value">${summary.totalTrucks}</div>
                    <div class="subtitle">Completed in period</div>
                </div>
                <div class="stat-card">
                    <h3>Avg Loading Time</h3>
                    <div class="value">${Math.round(summary.avgLoadingTime)} min</div>
                    <div class="subtitle">Per truck</div>
                </div>
                <div class="stat-card">
                    <h3>Busiest Hour</h3>
                    <div class="value">${summary.busiestHour !== null ? formatHour(summary.busiestHour) : 'N/A'}</div>
                    <div class="subtitle">${summary.busiestHourCount} trucks</div>
                </div>
                <div class="stat-card">
                    <h3>Top Sales Manager</h3>
                    <div class="value" style="font-size: 1.4rem;">${summary.topSalesManager}</div>
                    <div class="subtitle">${summary.topSalesManagerCount} trucks</div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Load summary error:', error);
    }
}

// Load completion stats chart
async function loadCompletionStats(startDate, endDate) {
    try {
        const response = await fetch(`${API_BASE}/analytics/stats?startDate=${startDate}&endDate=${endDate}&period=daily`, {
            credentials: 'include'
        });
        const data = await response.json();

        if (data.success) {
            const ctx = document.getElementById('completionChart');

            if (charts.completion) {
                charts.completion.destroy();
            }

            charts.completion = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.data.map(d => d.period),
                    datasets: [{
                        label: 'Trucks Completed',
                        data: data.data.map(d => d.total_trucks),
                        borderColor: '#1a1a1a',
                        backgroundColor: 'rgba(26, 26, 26, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            }
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error('Load completion stats error:', error);
    }
}

// Load loading time by warehouse
async function loadLoadingTime(startDate, endDate) {
    try {
        const response = await fetch(`${API_BASE}/analytics/loading-time?startDate=${startDate}&endDate=${endDate}`, {
            credentials: 'include'
        });
        const data = await response.json();

        if (data.success) {
            const ctx = document.getElementById('warehouseChart');

            if (charts.warehouse) {
                charts.warehouse.destroy();
            }

            charts.warehouse = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: data.data.map(d => d.warehouse_name),
                    datasets: [{
                        label: 'Avg Loading Time (min)',
                        data: data.data.map(d => Math.round(d.avg_loading_time || 0)),
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.7)',
                            'rgba(54, 162, 235, 0.7)',
                            'rgba(255, 206, 86, 0.7)',
                            'rgba(75, 192, 192, 0.7)'
                        ],
                        borderColor: [
                            'rgba(255, 99, 132, 1)',
                            'rgba(54, 162, 235, 1)',
                            'rgba(255, 206, 86, 1)',
                            'rgba(75, 192, 192, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error('Load loading time error:', error);
    }
}

// Load peak hours
async function loadPeakHours(startDate, endDate) {
    try {
        const response = await fetch(`${API_BASE}/analytics/peak-hours?startDate=${startDate}&endDate=${endDate}`, {
            credentials: 'include'
        });
        const data = await response.json();

        if (data.success) {
            const ctx = document.getElementById('peakHoursChart');

            if (charts.peakHours) {
                charts.peakHours.destroy();
            }

            charts.peakHours = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: data.data.map(d => formatHour(d.hour)),
                    datasets: [{
                        label: 'Number of Trucks',
                        data: data.data.map(d => d.truck_count),
                        backgroundColor: 'rgba(75, 192, 192, 0.7)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            }
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error('Load peak hours error:', error);
    }
}

// Load warehouse completion counts
async function loadWarehouseCompletion(startDate, endDate) {
    try {
        const response = await fetch(`${API_BASE}/analytics/loading-time?startDate=${startDate}&endDate=${endDate}`, {
            credentials: 'include'
        });
        const data = await response.json();

        if (data.success) {
            const ctx = document.getElementById('warehouseCompletionChart');

            if (charts.warehouseCompletion) {
                charts.warehouseCompletion.destroy();
            }

            charts.warehouseCompletion = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: data.data.map(d => d.warehouse_name),
                    datasets: [{
                        label: 'Trucks Completed',
                        data: data.data.map(d => d.total_trucks),
                        backgroundColor: [
                            'rgba(54, 162, 235, 0.7)',
                            'rgba(255, 99, 132, 0.7)',
                            'rgba(255, 206, 86, 0.7)',
                            'rgba(75, 192, 192, 0.7)'
                        ],
                        borderColor: [
                            'rgba(54, 162, 235, 1)',
                            'rgba(255, 99, 132, 1)',
                            'rgba(255, 206, 86, 1)',
                            'rgba(75, 192, 192, 1)'
                        ],
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            }
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error('Load warehouse completion error:', error);
    }
}

// Load sales manager performance
async function loadSalesManagerPerformance(startDate, endDate) {
    try {
        const response = await fetch(`${API_BASE}/analytics/sales-managers?startDate=${startDate}&endDate=${endDate}`, {
            credentials: 'include'
        });
        const data = await response.json();

        if (data.success) {
            const tbody = document.querySelector('#salesManagerTable tbody');

            if (data.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">No data available</td></tr>';
                return;
            }

            tbody.innerHTML = data.data.map(row => `
                <tr>
                    <td><strong>${row.sales_manager}</strong></td>
                    <td>${row.total_trucks}</td>
                    <td>${Math.round(row.avg_total_time || 0)} min</td>
                    <td>${Math.round(row.avg_loading_time || 0)} min</td>
                    <td>${Math.round(row.min_total_time || 0)} min</td>
                    <td>${Math.round(row.max_total_time || 0)} min</td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Load sales manager performance error:', error);
    }
}

// Utility functions
function formatHour(hour) {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
    return `${displayHour}:00 ${period}`;
}


// Export to Excel
async function exportToExcel() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    try {
        // Fetch all data again
        const [summary, stats, loading, peaks, managers] = await Promise.all([
            fetch(`${API_BASE}/analytics/summary?startDate=${startDate}&endDate=${endDate}`, { credentials: 'include' }).then(r => r.json()),
            fetch(`${API_BASE}/analytics/stats?startDate=${startDate}&endDate=${endDate}`, { credentials: 'include' }).then(r => r.json()),
            fetch(`${API_BASE}/analytics/loading-time?startDate=${startDate}&endDate=${endDate}`, { credentials: 'include' }).then(r => r.json()),
            fetch(`${API_BASE}/analytics/peak-hours?startDate=${startDate}&endDate=${endDate}`, { credentials: 'include' }).then(r => r.json()),
            fetch(`${API_BASE}/analytics/sales-managers?startDate=${startDate}&endDate=${endDate}`, { credentials: 'include' }).then(r => r.json())
        ]);

        // Create a new workbook
        const wb = XLSX.utils.book_new();

        // Summary Sheet
        const summaryData = [
            ['Truck Queue Analytics Report'],
            [`Period: ${startDate} to ${endDate}`],
            [],
            ['Summary Statistics'],
            ['Metric', 'Value'],
            ['Total Trucks', summary.summary.totalTrucks],
            ['Avg Loading Time (min)', Math.round(summary.summary.avgLoadingTime)],
            ['Busiest Hour', formatHour(summary.summary.busiestHour || 0)],
            ['Top Sales Manager', summary.summary.topSalesManager]
        ];
        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

        // Completion Stats Sheet
        if (stats.success && stats.data.length > 0) {
            const statsData = [
                ['Daily Completion Statistics'],
                [],
                ['Date', 'Total Trucks', 'Avg Total Time (min)', 'Avg Loading Time (min)'],
                ...stats.data.map(row => [
                    row.period,
                    row.total_trucks,
                    Math.round(row.avg_total_time || 0),
                    Math.round(row.avg_loading_time || 0)
                ])
            ];
            const statsSheet = XLSX.utils.aoa_to_sheet(statsData);
            XLSX.utils.book_append_sheet(wb, statsSheet, 'Daily Stats');
        }

        // Warehouse Performance Sheet
        if (loading.success && loading.data.length > 0) {
            const warehouseData = [
                ['Warehouse Performance'],
                [],
                ['Warehouse', 'Total Trucks', 'Avg Loading Time (min)', 'Min Time (min)', 'Max Time (min)'],
                ...loading.data.map(row => [
                    row.warehouse_name,
                    row.total_trucks,
                    Math.round(row.avg_loading_time || 0),
                    Math.round(row.min_loading_time || 0),
                    Math.round(row.max_loading_time || 0)
                ])
            ];
            const warehouseSheet = XLSX.utils.aoa_to_sheet(warehouseData);
            XLSX.utils.book_append_sheet(wb, warehouseSheet, 'Warehouses');
        }

        // Peak Hours Sheet
        if (peaks.success && peaks.data.length > 0) {
            const peaksData = [
                ['Peak Hours Distribution'],
                [],
                ['Hour', 'Truck Count'],
                ...peaks.data.map(row => [
                    formatHour(row.hour),
                    row.truck_count
                ])
            ];
            const peaksSheet = XLSX.utils.aoa_to_sheet(peaksData);
            XLSX.utils.book_append_sheet(wb, peaksSheet, 'Peak Hours');
        }

        // Sales Manager Performance Sheet
        if (managers.success && managers.data.length > 0) {
            const managersData = [
                ['Sales Manager Performance'],
                [],
                ['Sales Manager', 'Total Trucks', 'Avg Total Time (min)', 'Avg Loading Time (min)', 'Min Time (min)', 'Max Time (min)'],
                ...managers.data.map(row => [
                    row.sales_manager,
                    row.total_trucks,
                    Math.round(row.avg_total_time || 0),
                    Math.round(row.avg_loading_time || 0),
                    Math.round(row.min_total_time || 0),
                    Math.round(row.max_total_time || 0)
                ])
            ];
            const managersSheet = XLSX.utils.aoa_to_sheet(managersData);
            XLSX.utils.book_append_sheet(wb, managersSheet, 'Sales Managers');
        }

        // Download the Excel file
        XLSX.writeFile(wb, `truck-queue-report-${startDate}-to-${endDate}.xlsx`);

    } catch (error) {
        console.error('Export error:', error);
        alert('Failed to export data');
    }
}

// Initialize on page load
init();
