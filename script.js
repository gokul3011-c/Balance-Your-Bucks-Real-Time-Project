let budget = {
    total: 0,
    essentials: 0,
    personal: 0,
    savings: 0
};

let transactions = [];
let chart = null;

let budgetRules = {
    "50-30-20": {
        essentials: 0.5,
        personal: 0.3,
        savings: 0.2
    },
    "60-30-10": {
        essentials: 0.6,
        personal: 0.3,
        savings: 0.1
    }
};

function updateBudgetRule() {
    const selectedRule = document.getElementById('budgetRule').value;
    const percentages = document.querySelectorAll('.percentage');
    
    if (selectedRule === "50-30-20") {
        percentages[0].textContent = "50";
        percentages[1].textContent = "30";
        percentages[2].textContent = "20";
    } else {
        percentages[0].textContent = "60";
        percentages[1].textContent = "30";
        percentages[2].textContent = "10";
    }
    
    if (budget.total > 0) {
        calculateBudget();
    }
}

// Add these functions at the beginning of the file
const API_URL = 'http://localhost:3000/api';
let token = localStorage.getItem('token');

async function signIn(username, password, securityPin) {
    try {
        const response = await fetch(`${API_URL}/signin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, securityPin })
        });
        const data = await response.json();
        if (response.ok) {
            token = data.token;
            localStorage.setItem('token', token);
            window.location.href = 'main.html';
        } else {
            alert(data.error);
        }
    } catch (err) {
        console.error('Error:', err);
        alert('An error occurred during sign in');
    }
}

async function signUp(username, email, password, securityPin) {
    try {
        const response = await fetch(`${API_URL}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password, securityPin })
        });
        const data = await response.json();
        if (response.ok) {
            window.location.href = 'signin.html';
        } else {
            alert(data.error);
        }
    } catch (err) {
        console.error('Error:', err);
        alert('An error occurred during sign up');
    }
}

// Modify the existing calculateBudget function
async function calculateBudget() {
    const totalBudget = parseFloat(document.getElementById('totalBudget').value);
    const selectedRule = document.getElementById('budgetRule').value;
    
    if (isNaN(totalBudget) || totalBudget <= 0) {
        alert('Please enter a valid budget amount');
        return;
    }

    const rules = budgetRules[selectedRule];
    
    budget.total = totalBudget;
    budget.essentials = totalBudget * rules.essentials;
    budget.personal = totalBudget * rules.personal;
    budget.savings = totalBudget * rules.savings;

    updateCategoryDisplay();
}

function updateCategoryDisplay() {
    document.querySelector('#essentials .amount').textContent = `₹${budget.essentials.toFixed(2)}`;
    document.querySelector('#personal .amount').textContent = `₹${budget.personal.toFixed(2)}`;
    document.querySelector('#savings .amount').textContent = `₹${budget.savings.toFixed(2)}`;
}

function addTransaction() {
    const paymentFrom = document.getElementById('paymentFrom').value;
    const paymentTo = document.getElementById('paymentTo').value;
    const paymentDate = document.getElementById('paymentDate').value;
    const category = document.getElementById('categorySelect').value;
    const amount = document.getElementById('transactionAmount').value;
    const reason = document.getElementById('transactionReason').value;

    if (!paymentFrom || !paymentTo || !paymentDate || !amount || !reason) {
        alert('Please fill in all fields');
        return;
    }

    const transactionList = document.getElementById('transactionList');
    const transactionItem = document.createElement('div');
    transactionItem.className = 'transaction-item';

    const formattedDate = new Date(paymentDate).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    transactionItem.innerHTML = `
        <div class="transaction-details">
            <div class="transaction-header">
                <span class="transaction-date">${formattedDate}</span>
                <span class="transaction-category ${category}">${category}</span>
            </div>
            <div class="transaction-info">
                <p class="payment-details">From: ${paymentFrom} → To: ${paymentTo}</p>
                <p class="transaction-reason">${reason}</p>
            </div>
        </div>
        <div class="transaction-amount">
            <span>₹${parseFloat(amount).toLocaleString('en-IN')}</span>
            <button class="delete-transaction" onclick="deleteTransaction(this)" title="Delete Transaction">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
    `;

    transactionList.insertBefore(transactionItem, transactionList.firstChild);

    document.getElementById('paymentFrom').value = '';
    document.getElementById('paymentTo').value = '';
    document.getElementById('paymentDate').value = '';
    document.getElementById('transactionAmount').value = '';
    document.getElementById('transactionReason').value = '';

    updateCharts();
}

function deleteTransaction(button) {
    const transactionItem = button.closest('.transaction-item');
    transactionItem.style.opacity = '0';
    transactionItem.style.transform = 'translateX(100px)';
    
    // Store the transaction data before removing
    const transactionData = {
        date: transactionItem.querySelector('.transaction-date').textContent,
        amount: parseFloat(transactionItem.querySelector('.transaction-amount span').textContent.replace('₹', '').replace(/,/g, '')),
        paymentDetails: transactionItem.querySelector('.payment-details').textContent,
        category: transactionItem.querySelector('.transaction-category').textContent
    };

    setTimeout(() => {
        // Remove the transaction from DOM
        transactionItem.remove();
        
        // Force chart updates
        if (Object.values(charts).every(chart => chart === null)) {
            // Initialize charts if they don't exist
            updateCharts();
        } else {
            // Destroy existing charts and recreate them
            Object.values(charts).forEach(chart => {
                if (chart) {
                    chart.destroy();
                }
            });
            updateCharts();
        }
    }, 300);
}

let charts = {
    dateChart: null,
    paymentToChart: null,
    paymentFromChart: null,
    combinedChart: null
};

function updateCharts() {
    try {
        const transactions = Array.from(document.querySelectorAll('.transaction-item')).map(item => {
            try {
                const amountText = item.querySelector('.transaction-amount span').textContent;
                const amount = parseFloat(amountText.replace('₹', '').replace(/,/g, ''));
                const paymentDetails = item.querySelector('.payment-details').textContent;
                const [paymentFrom, paymentTo] = paymentDetails.split('→').map(str => 
                    str.replace(/From:|To:/, '').trim()
                );
                
                return {
                    date: item.querySelector('.transaction-date').textContent,
                    paymentTo: paymentTo,
                    paymentFrom: paymentFrom,
                    amount: amount,
                    category: item.querySelector('.transaction-category').textContent
                };
            } catch (error) {
                console.error('Error parsing transaction:', error);
                return null;
            }
        }).filter(t => t !== null);

        // Clear existing charts
        Object.values(charts).forEach(chart => {
            if (chart) {
                chart.destroy();
            }
        });

        // Reset charts object
        charts = {
            dateChart: null,
            paymentToChart: null,
            paymentFromChart: null,
            combinedChart: null
        };

        // Only create new charts if there are transactions
        if (transactions.length > 0) {
            createDateChart(transactions);
            createPaymentToChart(transactions);
            createPaymentFromChart(transactions);
            createCombinedChart(transactions);
        } else {
            // If no transactions, clear the canvas
            ['dateChart', 'paymentToChart', 'paymentFromChart', 'combinedChart'].forEach(chartId => {
                const canvas = document.getElementById(chartId);
                if (canvas) {
                    const ctx = canvas.getContext('2d');
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
            });
        }

    } catch (error) {
        console.error('Error updating charts:', error);
    }
}

function createDateChart(transactions) {
    const ctx = document.getElementById('dateChart');
    if (!ctx) return;
    
    if (charts.dateChart) {
        charts.dateChart.destroy();
    }
    
    charts.dateChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: transactions.map(t => t.date),
            datasets: [{
                label: 'Amount (₹)',
                data: transactions.map(t => t.amount),
                backgroundColor: '#3498db'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function createPaymentToChart(transactions) {
    const ctx = document.getElementById('paymentToChart');
    if (!ctx) return;

    if (charts.paymentToChart) {
        charts.paymentToChart.destroy();
    }

    const paymentToData = [...new Set(transactions.map(t => t.paymentTo))].map(payee => ({
        payee,
        total: transactions.filter(t => t.paymentTo === payee)
            .reduce((sum, t) => sum + t.amount, 0)
    }));

    charts.paymentToChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: paymentToData.map(d => d.payee),
            datasets: [{
                label: 'Total Amount (₹)',
                data: paymentToData.map(d => d.total),
                backgroundColor: '#2ecc71'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function createPaymentFromChart(transactions) {
    const ctx = document.getElementById('paymentFromChart');
    if (!ctx) return;

    if (charts.paymentFromChart) {
        charts.paymentFromChart.destroy();
    }

    const paymentFromData = [...new Set(transactions.map(t => t.paymentFrom))].map(payer => ({
        payer,
        total: transactions.filter(t => t.paymentFrom === payer)
            .reduce((sum, t) => sum + t.amount, 0)
    }));

    charts.paymentFromChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: paymentFromData.map(d => d.payer),
            datasets: [{
                label: 'Total Amount (₹)',
                data: paymentFromData.map(d => d.total),
                backgroundColor: '#e74c3c'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function createCombinedChart(transactions) {
    const ctx = document.getElementById('combinedChart');
    if (!ctx) return;

    if (charts.combinedChart) {
        charts.combinedChart.destroy();
    }

    const uniquePaymentFroms = [...new Set(transactions.map(t => t.paymentFrom))];
    const uniquePaymentTos = [...new Set(transactions.map(t => t.paymentTo))];

    charts.combinedChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: uniquePaymentTos,
            datasets: uniquePaymentFroms.map((from, index) => ({
                label: from,
                data: uniquePaymentTos.map(to =>
                    transactions.filter(t => t.paymentFrom === from && t.paymentTo === to)
                        .reduce((sum, t) => sum + t.amount, 0)
                ),
                backgroundColor: getRandomColor()
            }))
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { stacked: true },
                y: { stacked: true }
            }
        }
    });
}

function initializeChart() {
    const ctx = document.getElementById('expenseChart').getContext('2d');
    if (chart) {
        chart.destroy();
    }
    
    chart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Essentials', 'Personal', 'Savings'],
            datasets: [{
                data: [budget.essentials, budget.personal, budget.savings],
                backgroundColor: ['#e74c3c', '#2ecc71', '#f1c40f']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function updateChart() {
    const spentByCategory = {
        essentials: 0,
        personal: 0,
        savings: 0
    };

    transactions.forEach(transaction => {
        spentByCategory[transaction.category] += transaction.amount;
    });

    chart.data.datasets[0].data = [
        spentByCategory.essentials,
        spentByCategory.personal,
        spentByCategory.savings
    ];
    chart.update();
}

function checkBudgetLimits(category, amount) {
    const spentByCategory = transactions
        .filter(t => t.category === category)
        .reduce((total, t) => total + t.amount, 0);

    if (spentByCategory > budget[category]) {
        alert(`Warning: You've exceeded your ${category} budget!`);
    } else if (spentByCategory > budget[category] * 0.8) {
        alert(`Caution: You're approaching your ${category} budget limit!`);
    }
}

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}



document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    const hash = window.location.hash || '#budget';
    setActiveNavLink(hash);

    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
          
            navLinks.forEach(l => l.classList.remove('active'));
            
            
            this.classList.add('active');
        });
    });

    
    window.addEventListener('hashchange', function() {
        setActiveNavLink(window.location.hash);
    });
});

function setActiveNavLink(hash) {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === hash) {
            link.classList.add('active');
        }
    });
}


function updateTipDate() {
    const today = new Date();
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    const formattedDate = today.toLocaleDateString('en-US', options);
    document.querySelector('.tip-date').textContent = formattedDate;
}


document.addEventListener('DOMContentLoaded', function() {
    updateTipDate();
    const navLinks = document.querySelectorAll('.nav-link');
   
    const hash = window.location.hash || '#budget';
    setActiveNavLink(hash);

  
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
           
            navLinks.forEach(l => l.classList.remove('active'));
            
            this.classList.add('active');
        });
    });

   
    window.addEventListener('hashchange', function() {
        setActiveNavLink(window.location.hash);
    });
});


document.addEventListener('DOMContentLoaded', function() {
    const logoutLink = document.querySelector('.profile-dropdown a[href="#logout"]');
    if (logoutLink) {
        logoutLink.addEventListener('click', function(e) {
            e.preventDefault();
          
            window.location.href = 'signin.html';
        });
    }
});


function toggleEditMode() {
    const viewMode = document.getElementById('viewMode');
    const editMode = document.getElementById('editMode');
    const editBtn = document.querySelector('.edit-btn');
    const saveBtn = document.querySelector('.save-settings-btn');
    
    if (viewMode.style.display !== 'none') {
        viewMode.style.display = 'none';
        editMode.style.display = 'block';
        editBtn.innerHTML = '<i class="fas fa-times"></i> Cancel';
        saveBtn.style.display = 'block';
    } else {
        viewMode.style.display = 'block';
        editMode.style.display = 'none';
        editBtn.innerHTML = '<i class="fas fa-edit"></i> Edit';
        saveBtn.style.display = 'none';
    }
}

function saveChanges(event) {
    event.preventDefault(); 
    
    try {
      
        const fullName = document.querySelector('#editMode input[name="fullName"]').value;
        const username = document.querySelector('#editMode input[name="username"]').value;
        const email = document.querySelector('#editMode input[name="email"]').value;
        const phone = document.querySelector('#editMode input[name="phone"]').value;
        const age = document.querySelector('#editMode input[name="age"]').value;
        const gender = document.querySelector('#editMode select[name="gender"]').value;
        const address = document.querySelector('#editMode textarea[name="address"]').value;

        document.querySelector('#viewMode .info-value[data-field="fullName"]').textContent = fullName || 'Not set';
        document.querySelector('#viewMode .info-value[data-field="username"]').textContent = username || 'Not set';
        document.querySelector('#viewMode .info-value[data-field="email"]').textContent = email || 'Not set';
        document.querySelector('#viewMode .info-value[data-field="phone"]').textContent = phone || 'Not set';
        document.querySelector('#viewMode .info-value[data-field="age"]').textContent = age || 'Not set';
        document.querySelector('#viewMode .info-value[data-field="gender"]').textContent = gender || 'Not set';
        document.querySelector('#viewMode .info-value[data-field="address"]').textContent = address || 'Not set';

  
        toggleEditMode();
    } catch (error) {
        console.error('Error updating settings:', error);
        alert('There was an error saving your changes. Please try again.');
    }
}


document.addEventListener('DOMContentLoaded', function() {
    const settingsForm = document.querySelector('.settings-form');
    if (settingsForm) {
        settingsForm.addEventListener('submit', saveChanges);
    }
});

async function loadTransactions() {
    try {
        const response = await fetch(`${API_URL}/transactions`, {
            headers: { 'Authorization': token }
        });
        const transactions = await response.json();
        
        const transactionList = document.getElementById('transactionList');
        transactionList.innerHTML = '';
        
        transactions.forEach(transaction => {
            const transactionItem = document.createElement('div');
            transactionItem.className = 'transaction-item';
           
        });
    } catch (err) {
        console.error('Error loading transactions:', err);
    }
}


document.addEventListener('DOMContentLoaded', loadTransactions);