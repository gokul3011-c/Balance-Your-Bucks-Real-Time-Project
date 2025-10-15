const API_URL = 'http://localhost:3000/api';

// Authentication functions
async function signUp(username, email, password, securityPin) {
    try {
        const response = await fetch(`${API_URL}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password, securityPin })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        return data;
    } catch (error) {
        throw error;
    }
}

async function signIn(username, password, securityPin) {
    try {
        const response = await fetch(`${API_URL}/signin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, securityPin })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
        return data;
    } catch (error) {
        throw error;
    }
}

// Budget functions
async function setBudget(totalBudget, essentialsPercentage, personalPercentage, savingsPercentage) {
    try {
        const response = await fetch(`${API_URL}/budget`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': localStorage.getItem('token')
            },
            body: JSON.stringify({
                totalBudget,
                essentialsPercentage,
                personalPercentage,
                savingsPercentage
            })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        return data;
    } catch (error) {
        throw error;
    }
}

// Transaction functions
async function addTransaction(paymentFrom, paymentTo, amount, category, reason, transactionDate) {
    try {
        const response = await fetch(`${API_URL}/transactions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': localStorage.getItem('token')
            },
            body: JSON.stringify({
                paymentFrom,
                paymentTo,
                amount,
                category,
                reason,
                transactionDate
            })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        return data;
    } catch (error) {
        throw error;
    }
}

async function getTransactions() {
    try {
        const response = await fetch(`${API_URL}/transactions`, {
            headers: {
                'Authorization': localStorage.getItem('token')
            }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        return data;
    } catch (error) {
        throw error;
    }
}