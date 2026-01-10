// API_BASE and token are provided by app.js


async function loadStats() {
    try {
        const res = await fetch(`${API_BASE}/list`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/pages/auth/login.html';
            return;
        }

        const data = await res.json();

        processData(data);
    } catch (e) {
        console.error('Error loading stats:', e);
    }
}

const typeColors = {
    'Movies': '#FF6384',
    'Series': '#36A2EB',
    'Animes': '#FFCE56',
    'Manga': '#4BC0C0',
    'Novels': '#9966FF',
    'Games': '#FF9F40'
};

function processData(data) {
    // Data structure: { movies: { plan_to_watch: [], ... }, animes: { ... } }

    const typeCounts = {};
    // Structure: { 'watching': { 'Movies': 2, 'Animes': 5 }, 'completed': { ... } }
    const statusTypeCounts = {};

    // Initialize potential statuses to ensure order/existence if needed (optional, but good for consistent X-axis)
    const allStatuses = new Set();

    Object.keys(data).forEach(type => {
        let typeSum = 0;
        const statusObj = data[type];
        const label = type.charAt(0).toUpperCase() + type.slice(1); // e.g. "Movies"

        Object.keys(statusObj).forEach(status => {
            const count = statusObj[status].length;
            typeSum += count;
            allStatuses.add(status);

            if (!statusTypeCounts[status]) statusTypeCounts[status] = {};
            if (!statusTypeCounts[status][label]) statusTypeCounts[status][label] = 0;
            statusTypeCounts[status][label] += count; // Accumulate count
        });

        typeCounts[label] = typeSum;
    });

    renderTypeChart(typeCounts);
    renderStatusChart(statusTypeCounts, Array.from(allStatuses));
}

function renderTypeChart(data) {
    const ctx = document.getElementById('typeChart').getContext('2d');

    // Generate colors based on keys to ensure consistency
    const bgColors = Object.keys(data).map(key => typeColors[key] || '#cccccc');

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(data),
            datasets: [{
                data: Object.values(data),
                backgroundColor: bgColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom', labels: { color: 'white' } }
            }
        }
    });
}

function renderStatusChart(statusTypeCounts, allStatuses) {
    const ctx = document.getElementById('statusChart').getContext('2d');

    // 1. Prepare Labels (X-Axis)
    const labels = allStatuses.map(s => s.replace(/_/g, ' ').toUpperCase());

    // 2. Prepare Datasets (one per Media Type)
    // We need to know all possible media types involved
    const allFoundTypes = new Set();
    Object.values(statusTypeCounts).forEach(typeCounts => {
        Object.keys(typeCounts).forEach(t => allFoundTypes.add(t));
    });

    const datasets = Array.from(allFoundTypes).map(type => {
        return {
            label: type,
            data: allStatuses.map(status => (statusTypeCounts[status] && statusTypeCounts[status][type]) || 0),
            backgroundColor: typeColors[type] || '#cccccc',
            // borderColor: 'rgba(0,0,0,0.1)', // optional
            // borderWidth: 1
        };
    });

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    stacked: true,
                    ticks: { color: 'white' }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    ticks: { color: 'white' }
                }
            },
            plugins: {
                legend: {
                    display: true, // Show legend so user knows which color is which type
                    labels: { color: 'white' }
                },
                title: { display: false }
            }
        }
    });
}

loadStats();
