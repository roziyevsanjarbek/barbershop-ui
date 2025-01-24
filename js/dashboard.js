class DashboardManager {
    constructor() {
        this.charts = {};
        this.refreshInterval = 300000; // 5 minutes
        this.init();
    }

    init() {
        this.initializeCharts();
        this.bindEvents();
        this.startAutoRefresh();
        this.loadInitialData();
    }

    bindEvents() {
        // Quick action buttons
        document.querySelector('.refresh-data-btn')?.addEventListener('click', () => this.refreshData());
        document.querySelector('.new-appointment-btn')?.addEventListener('click', () => this.showNewAppointmentModal());

        // Search and filter
        document.getElementById('dashboard-search')?.addEventListener('input', this.handleSearch.bind(this));
        document.querySelectorAll('.dashboard-filter').forEach(filter => {
            filter.addEventListener('change', this.handleFilter.bind(this));
        });
    }

    async loadInitialData() {
        try {
            this.showLoading();
            await Promise.all([
                this.fetchRevenueData(),
                this.fetchAppointmentsData(),
                this.fetchStaffPerformance(),
                this.fetchCustomerFeedback()
            ]);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            this.showError('Failed to load dashboard data');
        } finally {
            this.hideLoading();
        }
    }

    initializeCharts() {
        // Revenue Chart
        const revenueCtx = document.getElementById('revenueChart')?.getContext('2d');
        if (revenueCtx) {
            this.charts.revenue = new Chart(revenueCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Revenue',
                        data: [],
                        borderColor: 'rgb(59, 130, 246)',
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }

        // Appointments Chart
        const appointmentsCtx = document.getElementById('appointmentsChart')?.getContext('2d');
        if (appointmentsCtx) {
            this.charts.appointments = new Chart(appointmentsCtx, {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Appointments',
                        data: [],
                        backgroundColor: 'rgba(59, 130, 246, 0.5)'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }
    }

    startAutoRefresh() {
        setInterval(() => this.refreshData(), this.refreshInterval);
    }

    async refreshData() {
        try {
            this.showLoading();
            await this.loadInitialData();
            this.showSuccess('Dashboard data updated successfully');
        } catch (error) {
            console.error('Failed to refresh data:', error);
            this.showError('Failed to refresh dashboard data');
        } finally {
            this.hideLoading();
        }
    }

    async fetchRevenueData() {
        try {
            const response = await fetch('/api/dashboard/revenue');
            const data = await response.json();
            this.updateRevenueChart(data);
        } catch (error) {
            console.error('Failed to fetch revenue data:', error);
        }
    }

    async fetchAppointmentsData() {
        try {
            const response = await fetch('/api/dashboard/appointments');
            const data = await response.json();
            this.updateAppointmentsChart(data);
        } catch (error) {
            console.error('Failed to fetch appointments data:', error);
        }
    }

    async fetchStaffPerformance() {
        try {
            const response = await fetch('/api/dashboard/staff-performance');
            const data = await response.json();
            this.updateStaffPerformance(data);
        } catch (error) {
            console.error('Failed to fetch staff performance:', error);
        }
    }

    async fetchCustomerFeedback() {
        try {
            const response = await fetch('/api/dashboard/customer-feedback');
            const data = await response.json();
            this.updateCustomerFeedback(data);
        } catch (error) {
            console.error('Failed to fetch customer feedback:', error);
        }
    }

    updateRevenueChart(data) {
        if (this.charts.revenue) {
            this.charts.revenue.data.labels = data.labels;
            this.charts.revenue.data.datasets[0].data = data.values;
            this.charts.revenue.update();
        }
    }

    updateAppointmentsChart(data) {
        if (this.charts.appointments) {
            this.charts.appointments.data.labels = data.labels;
            this.charts.appointments.data.datasets[0].data = data.values;
            this.charts.appointments.update();
        }
    }

    updateStaffPerformance(data) {
        const container = document.querySelector('.staff-performance');
        if (container) {
            container.innerHTML = data.map(staff => `
                <div class="staff-card p-4 bg-white rounded-lg shadow">
                    <div class="flex items-center">
                        <img src="${staff.avatar}" alt="${staff.name}" class="w-10 h-10 rounded-full mr-3">
                        <div>
                            <h3 class="font-medium">${staff.name}</h3>
                            <p class="text-sm text-gray-500">${staff.role}</p>
                        </div>
                    </div>
                    <div class="mt-3">
                        <div class="flex justify-between items-center">
                            <span>Performance</span>
                            <span>${staff.performance}%</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div class="bg-blue-600 h-2 rounded-full" style="width: ${staff.performance}%"></div>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }

    updateCustomerFeedback(data) {
        const container = document.querySelector('.customer-feedback');
        if (container) {
            container.innerHTML = data.map(feedback => `
                <div class="feedback-card p-4 bg-white rounded-lg shadow">
                    <div class="flex items-center mb-2">
                        <div class="flex text-yellow-400">
                            ${'★'.repeat(feedback.rating)}${'☆'.repeat(5-feedback.rating)}
                        </div>
                        <span class="ml-2 text-sm text-gray-500">${feedback.date}</span>
                    </div>
                    <p class="text-sm">${feedback.comment}</p>
                    <p class="text-xs text-gray-500 mt-1">- ${feedback.customer}</p>
                </div>
            `).join('');
        }
    }

    handleSearch(event) {
        // Implement search functionality
        const searchTerm = event.target.value.toLowerCase();
        // Add search logic here
    }

    handleFilter(event) {
        // Implement filter functionality
        const filterValue = event.target.value;
        // Add filter logic here
    }

    showNewAppointmentModal() {
        // Implement new appointment modal
        const modal = document.getElementById('new-appointment-modal');
        if (modal) modal.classList.remove('hidden');
    }

    showLoading() {
        const loader = document.querySelector('.loading-spinner');
        if (loader) loader.classList.remove('hidden');
    }

    hideLoading() {
        const loader = document.querySelector('.loading-spinner');
        if (loader) loader.classList.add('hidden');
    }

    showError(message) {
        const alert = document.createElement('div');
        alert.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded shadow-lg';
        alert.textContent = message;
        document.body.appendChild(alert);
        setTimeout(() => alert.remove(), 3000);
    }

    showSuccess(message) {
        const alert = document.createElement('div');
        alert.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded shadow-lg';
        alert.textContent = message;
        document.body.appendChild(alert);
        setTimeout(() => alert.remove(), 3000);
    }
}

// Initialize DashboardManager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardManager = new DashboardManager();
});
