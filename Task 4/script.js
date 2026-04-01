// Global variables
let customers = [];
let products = [];
let orders = [];

// Load data on page load
document.addEventListener('DOMContentLoaded', function() {
    loadInsights();
    loadCustomers();
    loadProducts();
    loadOrderSummary();
    loadCustomerDropdown();
});

// Switch tabs
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

// Load insights (highest order and most active customer)
async function loadInsights() {
    try {
        const [highestOrder, activeCustomer] = await Promise.all([
            fetch('/api/insights/highest-order').then(res => res.json()),
            fetch('/api/insights/most-active-customer').then(res => res.json())
        ]);
        
        const insightsHtml = `
            <div class="insight-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)">
                <h3>💰 Highest Value Order</h3>
                <div class="value">$${highestOrder.total_amount?.toFixed(2) || '0'}</div>
                <div class="detail">Order #${highestOrder.order_id || 'N/A'} • ${highestOrder.customer_name || 'Unknown'}</div>
                <div class="detail">${highestOrder.item_count || 0} items • ${new Date(highestOrder.order_date).toLocaleDateString()}</div>
            </div>
            <div class="insight-card" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)">
                <h3>⭐ Most Active Customer</h3>
                <div class="value">${activeCustomer.name || 'N/A'}</div>
                <div class="detail">${activeCustomer.order_count || 0} orders • $${activeCustomer.total_spent?.toFixed(2) || '0'} spent</div>
                <div class="detail">${activeCustomer.city || ''} • Last order: ${new Date(activeCustomer.last_order_date).toLocaleDateString()}</div>
            </div>
        `;
        
        document.getElementById('insights').innerHTML = insightsHtml;
    } catch (error) {
        console.error('Error loading insights:', error);
    }
}

// Load customers
async function loadCustomers() {
    try {
        const response = await fetch('/api/customers');
        customers = await response.json();
        
        let html = '';
        customers.forEach(customer => {
            html += `
                <tr>
                    <td>${customer.customer_id}</td>
                    <td>${customer.name}</td>
                    <td>${customer.email}</td>
                    <td>${customer.city || 'N/A'}</td>
                    <td>${customer.total_orders || 0}</td>
                    <td>$${parseFloat(customer.total_spent || 0).toFixed(2)}</td>
                    <td>${customer.last_order_date ? new Date(customer.last_order_date).toLocaleDateString() : 'Never'}</td>
                    <td><button class="view-btn" onclick="viewCustomerOrders(${customer.customer_id})">View Orders</button></td>
                </tr>
            `;
        });
        
        document.getElementById('customersTableBody').innerHTML = html;
    } catch (error) {
        console.error('Error loading customers:', error);
        document.getElementById('customersTableBody').innerHTML = '<tr><td colspan="8" class="loading">Error loading customers</td></tr>';
    }
}

// Load products
async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        products = await response.json();
        
        let html = '';
        products.forEach(product => {
            html += `
                <tr>
                    <td>${product.product_id}</td>
                    <td>${product.name}</td>
                    <td>${product.category}</td>
                    <td>$${parseFloat(product.price).toFixed(2)}</td>
                    <td>${product.stock_quantity}</td>
                    <td>${product.total_sold || 0}</td>
                    <td>$${parseFloat(product.revenue || 0).toFixed(2)}</td>
                    <td>${product.times_ordered || 0}</td>
                </tr>
            `;
        });
        
        document.getElementById('productsTableBody').innerHTML = html;
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// Load order summary
async function loadOrderSummary() {
    try {
        const response = await fetch('/api/orders/summary');
        const stats = await response.json();
        
        let html = '';
        stats.forEach(stat => {
            html += `
                <div class="stat-card">
                    <h4>${stat.status.toUpperCase()}</h4>
                    <div class="stat-value">${stat.order_count}</div>
                    <div class="stat-sub">$${parseFloat(stat.total_value || 0).toFixed(2)} total</div>
                    <div class="stat-sub">Avg: $${parseFloat(stat.average_value || 0).toFixed(2)}</div>
                </div>
            `;
        });
        
        document.getElementById('orderStats').innerHTML = html;
    } catch (error) {
        console.error('Error loading order summary:', error);
    }
}

// Load customer dropdown
async function loadCustomerDropdown() {
    try {
        const response = await fetch('/api/customers');
        const customers = await response.json();
        
        let options = '<option value="">Select a customer</option>';
        customers.forEach(customer => {
            options += `<option value="${customer.customer_id}">${customer.name} (${customer.total_orders || 0} orders)</option>`;
        });
        
        document.getElementById('customerSelect').innerHTML = options;
    } catch (error) {
        console.error('Error loading customer dropdown:', error);
    }
}

// Load customer orders
async function loadCustomerOrders() {
    const customerId = document.getElementById('customerSelect').value;
    if (!customerId) return;
    
    try {
        const response = await fetch(`/api/customers/${customerId}/orders`);
        const orders = await response.json();
        
        let html = '';
        orders.forEach(order => {
            const statusClass = `status-badge status-${order.status}`;
            html += `
                <div class="order-card" onclick="viewOrderDetails(${order.order_id})">
                    <div class="order-header">
                        <span class="order-id">Order #${order.order_id}</span>
                        <span class="${statusClass}">${order.status}</span>
                    </div>
                    <div class="order-body">
                        <div class="order-products">
                            <strong>${order.total_items} items</strong><br>
                            <small>${order.products || 'No products'}</small>
                        </div>
                        <div class="order-total">$${parseFloat(order.total_amount).toFixed(2)}</div>
                    </div>
                    <div class="order-date">${new Date(order.order_date).toLocaleString()}</div>
                </div>
            `;
        });
        
        document.getElementById('customerOrders').innerHTML = html;
    } catch (error) {
        console.error('Error loading customer orders:', error);
    }
}

// View customer orders (from customers table)
async function viewCustomerOrders(customerId) {
    document.getElementById('customerSelect').value = customerId;
    switchTab('orders');
    await loadCustomerOrders();
}

// View order details
async function viewOrderDetails(orderId) {
    try {
        const response = await fetch(`/api/orders/${orderId}`);
        const orderItems = await response.json();
        
        if (orderItems.length === 0) return;
        
        const order = orderItems[0];
        let itemsHtml = '';
        let total = 0;
        
        orderItems.forEach(item => {
            total += parseFloat(item.item_price) * item.quantity;
            itemsHtml += `
                <tr>
                    <td>${item.product_name}</td>
                    <td>${item.quantity}</td>
                    <td>$${parseFloat(item.item_price).toFixed(2)}</td>
                    <td>$${(item.quantity * item.item_price).toFixed(2)}</td>
                </tr>
            `;
        });
        
        const modalHtml = `
            <div class="order-detail-header">
                <p><strong>Order #${order.order_id}</strong> • ${new Date(order.order_date).toLocaleString()}</p>
                <p><strong>Customer:</strong> ${order.customer_name} (${order.customer_email})</p>
                <p><strong>Status:</strong> <span class="status-badge status-${order.status}">${order.status}</span></p>
            </div>
            <h4>Items</h4>
            <table>
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3" style="text-align: right"><strong>Total:</strong></td>
                        <td><strong>$${total.toFixed(2)}</strong></td>
                    </tr>
                </tfoot>
            </table>
        `;
        
        document.getElementById('orderDetails').innerHTML = modalHtml;
        document.getElementById('orderModal').style.display = 'block';
    } catch (error) {
        console.error('Error loading order details:', error);
    }
}

// Close modal
function closeModal() {
    document.getElementById('orderModal').style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('orderModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}