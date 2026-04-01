// Global variables
let users = [];
let customers = [];
let merchants = [];

// Load data on page load
document.addEventListener('DOMContentLoaded', function() {
    loadStats();
    loadUsers();
    loadTransactions();
});

// Load dashboard statistics
async function loadStats() {
    try {
        const response = await fetch('/api/stats');
        const stats = await response.json();
        
        const statsHtml = `
            <div class="stat-card">
                <h3>Total Transaction Volume</h3>
                <div class="stat-value">$${stats.total_volume.total_volume?.toFixed(2) || '0'}</div>
                <div class="stat-label">${stats.total_volume.total_transactions || 0} transactions</div>
                <div class="stat-label">Avg: $${stats.total_volume.avg_transaction?.toFixed(2) || '0'}</div>
            </div>
            <div class="stat-card">
                <h3>Customer Balance</h3>
                <div class="stat-value">$${(stats.balance_stats?.find(b => b.user_type === 'customer')?.total_balance || 0).toFixed(2)}</div>
                <div class="stat-label">${stats.balance_stats?.find(b => b.user_type === 'customer')?.user_count || 0} customers</div>
            </div>
            <div class="stat-card">
                <h3>Merchant Balance</h3>
                <div class="stat-value">$${(stats.balance_stats?.find(b => b.user_type === 'merchant')?.total_balance || 0).toFixed(2)}</div>
                <div class="stat-label">${stats.balance_stats?.find(b => b.user_type === 'merchant')?.user_count || 0} merchants</div>
            </div>
            <div class="stat-card">
                <h3>Today's Activity</h3>
                <div class="stat-value">${stats.today?.transactions || 0}</div>
                <div class="stat-label">$${stats.today?.volume?.toFixed(2) || '0'} volume</div>
                <div class="stat-label">${stats.today?.failed || 0} failed</div>
            </div>
        `;
        
        document.getElementById('stats').innerHTML = statsHtml;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load users
async function loadUsers() {
    try {
        const response = await fetch('/api/users');
        users = await response.json();
        
        customers = users.filter(u => u.user_type === 'customer');
        merchants = users.filter(u => u.user_type === 'merchant');
        
        // Update users table
        let tableHtml = '';
        users.forEach(user => {
            tableHtml += `
                <tr>
                    <td>${user.user_id}</td>
                    <td>${user.full_name}</td>
                    <td><span class="user-type type-${user.user_type}">${user.user_type}</span></td>
                    <td><strong>$${parseFloat(user.balance).toFixed(2)}</strong></td>
                    <td>${user.email}</td>
                </tr>
            `;
        });
        
        document.getElementById('usersTableBody').innerHTML = tableHtml;
        
        // Update dropdowns
        updateDropdowns();
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// Update dropdowns with users
function updateDropdowns() {
    // Sender dropdown (customers only)
    let senderOptions = '<option value="">Choose customer...</option>';
    customers.forEach(customer => {
        senderOptions += `<option value="${customer.user_id}">${customer.full_name} ($${parseFloat(customer.balance).toFixed(2)})</option>`;
    });
    document.getElementById('senderSelect').innerHTML = senderOptions;
    
    // Receiver dropdown (merchants only)
    let receiverOptions = '<option value="">Choose merchant...</option>';
    merchants.forEach(merchant => {
        receiverOptions += `<option value="${merchant.user_id}">${merchant.full_name} ($${parseFloat(merchant.balance).toFixed(2)})</option>`;
    });
    document.getElementById('receiverSelect').innerHTML = receiverOptions;
}

// Update sender balance display
function updateSenderBalance() {
    const senderId = document.getElementById('senderSelect').value;
    const customer = customers.find(c => c.user_id == senderId);
    if (customer) {
        document.getElementById('senderBalance').textContent = `Balance: $${parseFloat(customer.balance).toFixed(2)}`;
    } else {
        document.getElementById('senderBalance').textContent = 'Balance: $0.00';
    }
}

// Update receiver balance display
function updateReceiverBalance() {
    const receiverId = document.getElementById('receiverSelect').value;
    const merchant = merchants.find(m => m.user_id == receiverId);
    if (merchant) {
        document.getElementById('receiverBalance').textContent = `Balance: $${parseFloat(merchant.balance).toFixed(2)}`;
    } else {
        document.getElementById('receiverBalance').textContent = 'Balance: $0.00';
    }
}

// Process payment
async function processPayment() {
    const senderId = document.getElementById('senderSelect').value;
    const receiverId = document.getElementById('receiverSelect').value;
    const amount = document.getElementById('amount').value;
    const description = document.getElementById('description').value;
    
    // Validation
    if (!senderId || !receiverId || !amount || amount <= 0) {
        showMessage('Please fill all fields correctly', 'error');
        return;
    }
    
    // Show loading
    document.getElementById('paymentBtn').disabled = true;
    document.getElementById('paymentSpinner').style.display = 'inline';
    
    try {
        const response = await fetch('/api/payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sender_id: parseInt(senderId),
                receiver_id: parseInt(receiverId),
                amount: parseFloat(amount),
                description: description
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage(`✅ Payment successful! Transaction ID: ${result.transaction_id}`, 'success');
            
            // Update balances in UI
            updateSenderBalance();
            updateReceiverBalance();
            
            // Reload data
            loadUsers();
            loadTransactions();
            loadStats();
            
            // Clear form
            document.getElementById('amount').value = '';
            document.getElementById('description').value = '';
        } else {
            showMessage(`❌ Payment failed: ${result.message}`, 'error');
        }
    } catch (error) {
        showMessage('Error processing payment', 'error');
    } finally {
        document.getElementById('paymentBtn').disabled = false;
        document.getElementById('paymentSpinner').style.display = 'none';
    }
}

// Process refund
async function processRefund(transactionId) {
    if (!confirm('Process refund for this transaction?')) return;
    
    try {
        const response = await fetch('/api/refund', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transaction_id: transactionId })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage(`✅ Refund successful! Refund ID: ${result.refund_id}`, 'success');
            loadUsers();
            loadTransactions();
            loadStats();
        } else {
            showMessage(`❌ Refund failed: ${result.message}`, 'error');
        }
    } catch (error) {
        showMessage('Error processing refund', 'error');
    }
}

// Load recent transactions
async function loadTransactions() {
    try {
        const status = document.getElementById('statusFilter').value;
        const type = document.getElementById('typeFilter').value;
        
        let url = '/api/transactions?limit=20';
        if (status) url += `&status=${status}`;
        if (type) url += `&type=${type}`;
        
        const response = await fetch(url);
        const transactions = await response.json();
        
        let html = '';
        transactions.forEach(tx => {
            const statusClass = `status-${tx.status}`;
            const amountClass = tx.status === 'failed' ? 'failed' : '';
            
            html += `
                <div class="transaction-card ${tx.status}">
                    <div class="transaction-header">
                        <span class="transaction-id">Transaction #${tx.transaction_id}</span>
                        <span class="transaction-status ${statusClass}">${tx.status}</span>
                    </div>
                    <div class="transaction-details">
                        <div class="transaction-parties">
                            <strong>${tx.sender_name}</strong> (${tx.sender_type}) → 
                            <strong>${tx.receiver_name}</strong> (${tx.receiver_type})
                        </div>
                        <div class="transaction-amount ${amountClass}">
                            $${parseFloat(tx.amount).toFixed(2)}
                        </div>
                    </div>
                    <div class="transaction-parties">
                        <small>${tx.description || 'No description'}</small>
                    </div>
                    <div class="transaction-time">
                        ${new Date(tx.created_at).toLocaleString()}
                        ${tx.status === 'completed' && tx.transaction_type === 'payment' ? 
                            `<button onclick="processRefund(${tx.transaction_id})" class="test-btn" style="float: right;">↩️ Refund</button>` : ''}
                    </div>
                </div>
            `;
        });
        
        document.getElementById('transactionsList').innerHTML = html || '<div class="loading">No transactions found</div>';
    } catch (error) {
        console.error('Error loading transactions:', error);
    }
}

// Test scenarios
function testScenario(type) {
    if (type === 'success') {
        // Select a customer with sufficient balance
        const richCustomer = customers.find(c => c.balance > 100);
        const merchant = merchants[0];
        
        if (richCustomer && merchant) {
            document.getElementById('senderSelect').value = richCustomer.user_id;
            document.getElementById('receiverSelect').value = merchant.user_id;
            document.getElementById('amount').value = '50.00';
            document.getElementById('description').value = 'Test Payment - Should Succeed';
            updateSenderBalance();
            updateReceiverBalance();
            showMessage('Test scenario loaded: Should succeed (sufficient balance)', 'success');
        }
    } else if (type === 'insufficient') {
        // Select a customer with low balance
        const poorCustomer = customers.find(c => c.balance < 100) || customers[0];
        const merchant = merchants[0];
        
        if (poorCustomer && merchant) {
            document.getElementById('senderSelect').value = poorCustomer.user_id;
            document.getElementById('receiverSelect').value = merchant.user_id;
            document.getElementById('amount').value = '999999.00';
            document.getElementById('description').value = 'Test Payment - Should Fail (Insufficient Balance)';
            updateSenderBalance();
            updateReceiverBalance();
            showMessage('Test scenario loaded: Should fail (insufficient balance)', 'error');
        }
    } else if (type === 'invalid') {
        document.getElementById('senderSelect').value = '';
        document.getElementById('receiverSelect').value = '';
        document.getElementById('amount').value = '100.00';
        showMessage('Test scenario loaded: Should fail (invalid accounts)', 'error');
    }
}

// Show message
function showMessage(text, type) {
    const messageDiv = document.getElementById('paymentMessage');
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

// Auto-refresh every 30 seconds
setInterval(() => {
    loadStats();
    loadTransactions();
}, 30000);