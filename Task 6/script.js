// Load data on page load
document.addEventListener('DOMContentLoaded', function() {
    loadStats();
    loadDailyActivity();
    loadEmployeeActivity();
    loadSalesPerformance();
    loadInventoryChanges();
    loadUserSummary();
    loadRawLogs();
});

// Load statistics
async function loadStats() {
    try {
        const response = await fetch('/api/stats');
        const stats = await response.json();
        
        const statsHtml = `
            <div class="stat-card">
                <h3>Total Log Entries</h3>
                <div class="stat-value">${stats.total_logs}</div>
            </div>
            <div class="stat-card">
                <h3>Today's Logs</h3>
                <div class="stat-value">${stats.logs_today}</div>
            </div>
            <div class="stat-card">
                <h3>Operations</h3>
                <div class="stat-value">
                    ${stats.operations?.map(op => `${op.operation_type}: ${op.count}`).join('<br>') || 'N/A'}
                </div>
            </div>
            <div class="stat-card">
                <h3>Tables Tracked</h3>
                <div class="stat-value">${stats.tables?.length || 0}</div>
            </div>
        `;
        
        document.getElementById('stats').innerHTML = statsHtml;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Switch tabs
function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

// Load daily activity view
async function loadDailyActivity() {
    try {
        const response = await fetch('/api/views/daily-activity?days=7');
        const data = await response.json();
        
        let html = '';
        data.forEach(row => {
            html += `
                <tr>
                    <td>${new Date(row.activity_date).toLocaleDateString()}</td>
                    <td>${row.table_name}</td>
                    <td><span class="operation-badge op-${row.operation_type.toLowerCase()}">${row.operation_type}</span></td>
                    <td>${row.operation_count}</td>
                    <td>${row.unique_records_affected}</td>
                    <td>${row.users_involved || 'N/A'}</td>
                </tr>
            `;
        });
        
        document.getElementById('dailyTableBody').innerHTML = html || '<tr><td colspan="6" class="loading">No data found</td></tr>';
    } catch (error) {
        console.error('Error loading daily activity:', error);
    }
}

// Load employee activity view
async function loadEmployeeActivity() {
    try {
        const response = await fetch('/api/views/employee-activity');
        const data = await response.json();
        
        let html = '';
        data.forEach(row => {
            html += `
                <tr>
                    <td>${new Date(row.changed_at).toLocaleString()}</td>
                    <td>${row.table_name}</td>
                    <td><span class="operation-badge op-${row.operation_type.toLowerCase()}">${row.operation_type}</span></td>
                    <td>${row.record_description || `ID: ${row.record_id}`}</td>
                    <td>${row.changed_by || 'system'}</td>
                    <td>
                        <span class="json-data" onclick='showJSON(${JSON.stringify(row.old_data)}, ${JSON.stringify(row.new_data)})'>
                            View Data
                        </span>
                    </td>
                </tr>
            `;
        });
        
        document.getElementById('employeeTableBody').innerHTML = html || '<tr><td colspan="6" class="loading">No data found</td></tr>';
    } catch (error) {
        console.error('Error loading employee activity:', error);
    }
}

// Load sales performance view
async function loadSalesPerformance() {
    try {
        const response = await fetch('/api/views/sales-performance');
        const data = await response.json();
        
        let html = '';
        data.forEach(row => {
            if (!row.sale_date) return;
            html += `
                <tr ${!row.product_category ? 'style="background: #f8f9fa; font-weight: bold;"' : ''}>
                    <td>${new Date(row.sale_date).toLocaleDateString()}</td>
                    <td>${row.payment_method || 'ALL'}</td>
                    <td>${row.product_category || 'ALL CATEGORIES'}</td>
                    <td>${row.total_transactions}</td>
                    <td>${row.active_employees}</td>
                    <td>$${parseFloat(row.total_revenue || 0).toFixed(2)}</td>
                    <td>$${parseFloat(row.average_transaction_value || 0).toFixed(2)}</td>
                    <td>${row.total_items_sold || 0}</td>
                </tr>
            `;
        });
        
        document.getElementById('salesTableBody').innerHTML = html || '<tr><td colspan="8" class="loading">No data found</td></tr>';
    } catch (error) {
        console.error('Error loading sales performance:', error);
    }
}

// Load inventory changes view
async function loadInventoryChanges() {
    try {
        const response = await fetch('/api/views/inventory-changes');
        const data = await response.json();
        
        let html = '';
        data.forEach(row => {
            const changeClass = row.quantity_change < 0 ? 'negative' : 'positive';
            html += `
                <tr>
                    <td>${new Date(row.change_time).toLocaleString()}</td>
                    <td>${row.product_name || 'Unknown'}</td>
                    <td>${row.product_code || 'N/A'}</td>
                    <td>${row.old_quantity || '0'}</td>
                    <td>${row.new_quantity || '0'}</td>
                    <td style="color: ${row.quantity_change < 0 ? '#e74c3c' : '#27ae60'}">
                        ${row.quantity_change > 0 ? '+' : ''}${row.quantity_change}
                    </td>
                    <td>${row.old_price ? '$' + parseFloat(row.old_price).toFixed(2) : '-'}</td>
                    <td>${row.new_price ? '$' + parseFloat(row.new_price).toFixed(2) : '-'}</td>
                </tr>
            `;
        });
        
        document.getElementById('inventoryTableBody').innerHTML = html || '<tr><td colspan="8" class="loading">No data found</td></tr>';
    } catch (error) {
        console.error('Error loading inventory changes:', error);
    }
}

// Load user summary view
async function loadUserSummary() {
    try {
        const response = await fetch('/api/views/user-activity');
        const data = await response.json();
        
        let html = '';
        data.forEach(row => {
            html += `
                <tr>
                    <td><strong>${row.username || 'system'}</strong></td>
                    <td>${row.total_actions}</td>
                    <td><span class="operation-badge op-insert">${row.inserts || 0}</span></td>
                    <td><span class="operation-badge op-update">${row.updates || 0}</span></td>
                    <td><span class="operation-badge op-delete">${row.deletes || 0}</span></td>
                    <td>${new Date(row.first_action_date).toLocaleDateString()}</td>
                    <td>${new Date(row.last_action_date).toLocaleDateString()}</td>
                    <td>${row.active_days}</td>
                    <td>${row.tables_accessed}</td>
                </tr>
            `;
        });
        
        document.getElementById('usersTableBody').innerHTML = html || '<tr><td colspan="9" class="loading">No data found</td></tr>';
    } catch (error) {
        console.error('Error loading user summary:', error);
    }
}

// Load raw audit logs
async function loadRawLogs() {
    try {
        const table = document.getElementById('tableFilter').value;
        const operation = document.getElementById('operationFilter').value;
        
        let url = '/api/audit-logs?limit=100';
        if (table) url += `&table=${table}`;
        if (operation) url += `&operation=${operation}`;
        
        const response = await fetch(url);
        const logs = await response.json();
        
        let html = '';
        logs.forEach(log => {
            html += `
                <tr>
                    <td>${log.log_id}</td>
                    <td>${log.table_name}</td>
                    <td><span class="operation-badge op-${log.operation_type.toLowerCase()}">${log.operation_type}</span></td>
                    <td>${log.record_id}</td>
                    <td>${new Date(log.changed_at).toLocaleString()}</td>
                    <td>${log.changed_by || 'system'}</td>
                    <td><span class="json-data" onclick='showJSON(${log.old_data || 'null'}, null)'>${log.old_data ? 'View' : '-'}</span></td>
                    <td><span class="json-data" onclick='showJSON(null, ${log.new_data || 'null'})'>${log.new_data ? 'View' : '-'}</span></td>
                </tr>
            `;
        });
        
        document.getElementById('rawLogsBody').innerHTML = html || '<tr><td colspan="8" class="loading">No logs found</td></tr>';
    } catch (error) {
        console.error('Error loading raw logs:', error);
    }
}

// Test insert trigger
async function testInsert() {
    const table = confirm('Insert test employee or product? Click OK for employee, Cancel for product');
    
    try {
        const response = await fetch('/api/test/insert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ table: table ? 'employee' : 'product' })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert(`✅ ${result.message}\nID: ${result.id}\nCheck the audit log to see the trigger in action!`);
            loadRawLogs();
            loadStats();
            loadDailyActivity();
        }
    } catch (error) {
        alert('Error testing insert');
    }
}

// Show JSON data in alert (simplified)
function showJSON(oldData, newData) {
    let message = '';
    if (oldData) {
        message += '📝 OLD DATA:\n' + JSON.stringify(JSON.parse(oldData), null, 2) + '\n\n';
    }
    if (newData) {
        message += '✨ NEW DATA:\n' + JSON.stringify(JSON.parse(newData), null, 2);
    }
    alert(message);
}

// Auto-refresh every 30 seconds
setInterval(() => {
    if (document.getElementById('daily-tab').classList.contains('active')) {
        loadDailyActivity();
    } else if (document.getElementById('employee-tab').classList.contains('active')) {
        loadEmployeeActivity();
    } else if (document.getElementById('sales-tab').classList.contains('active')) {
        loadSalesPerformance();
    } else if (document.getElementById('inventory-tab').classList.contains('active')) {
        loadInventoryChanges();
    } else if (document.getElementById('users-tab').classList.contains('active')) {
        loadUserSummary();
    } else if (document.getElementById('raw-tab').classList.contains('active')) {
        loadRawLogs();
    }
    loadStats();
}, 30000);