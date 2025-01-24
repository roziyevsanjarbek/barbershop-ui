class BookingManager {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 4;
        this.selectedService = null;
        this.selectedStaff = null;
        this.selectedDate = null;
        this.selectedTime = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.initDatePicker();
        this.initTimePicker();
        this.updateProgressBar();
        this.loadServices();
        this.loadStaff();
    }

    bindEvents() {
        // Navigation buttons
        document.querySelectorAll('.next-step').forEach(btn => {
            btn.addEventListener('click', () => this.nextStep());
        });

        document.querySelectorAll('.prev-step').forEach(btn => {
            btn.addEventListener('click', () => this.prevStep());
        });

        // Service selection
        document.querySelectorAll('.service-option').forEach(service => {
            service.addEventListener('click', (e) => this.selectService(e));
        });

        // Staff selection
        document.querySelectorAll('.staff-option').forEach(staff => {
            staff.addEventListener('click', (e) => this.selectStaff(e));
        });

        // Form submission
        document.getElementById('booking-form')?.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    initDatePicker() {
        const dateInput = document.getElementById('appointment-date');
        if (dateInput) {
            // Initialize date picker with business hours and availability
            flatpickr(dateInput, {
                minDate: 'today',
                disable: [
                    function(date) {
                        // Disable dates based on business hours and availability
                        return this.isDateUnavailable(date);
                    }.bind(this)
                ],
                onChange: (selectedDates) => {
                    this.selectedDate = selectedDates[0];
                    this.updateAvailableTimeSlots();
                }
            });
        }
    }

    initTimePicker() {
        this.updateAvailableTimeSlots();
    }

    async loadServices() {
        try {
            this.showLoading();
            const response = await fetch('/api/services');
            const services = await response.json();
            this.renderServices(services);
        } catch (error) {
            console.error('Failed to load services:', error);
            this.showError('Failed to load services');
        } finally {
            this.hideLoading();
        }
    }

    async loadStaff() {
        try {
            const response = await fetch('/api/staff');
            const staff = await response.json();
            this.renderStaff(staff);
        } catch (error) {
            console.error('Failed to load staff:', error);
            this.showError('Failed to load staff members');
        }
    }

    renderServices(services) {
        const container = document.querySelector('.services-list');
        if (container) {
            container.innerHTML = services.map(service => `
                <div class="service-option p-4 bg-white rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow"
                     data-service-id="${service.id}">
                    <h3 class="text-lg font-semibold">${service.name}</h3>
                    <p class="text-gray-600">${service.duration} mins</p>
                    <p class="text-blue-600 font-medium">$${service.price}</p>
                    <p class="text-sm text-gray-500 mt-2">${service.description}</p>
                </div>
            `).join('');
        }
    }

    renderStaff(staffList) {
        const container = document.querySelector('.staff-list');
        if (container) {
            container.innerHTML = staffList.map(staff => `
                <div class="staff-option p-4 bg-white rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow"
                     data-staff-id="${staff.id}">
                    <img src="${staff.avatar}" alt="${staff.name}" class="w-20 h-20 rounded-full mx-auto mb-3">
                    <h3 class="text-lg font-semibold text-center">${staff.name}</h3>
                    <p class="text-gray-600 text-center">${staff.role}</p>
                    <div class="flex justify-center mt-2">
                        ${'★'.repeat(staff.rating)}${'☆'.repeat(5-staff.rating)}
                    </div>
                </div>
            `).join('');
        }
    }

    async updateAvailableTimeSlots() {
        if (!this.selectedDate || !this.selectedService || !this.selectedStaff) return;

        try {
            const response = await fetch('/api/availability', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: this.selectedDate,
                    serviceId: this.selectedService,
                    staffId: this.selectedStaff
                })
            });

            const timeSlots = await response.json();
            this.renderTimeSlots(timeSlots);
        } catch (error) {
            console.error('Failed to load time slots:', error);
            this.showError('Failed to load available times');
        }
    }

    renderTimeSlots(timeSlots) {
        const container = document.querySelector('.time-slots');
        if (container) {
            container.innerHTML = timeSlots.map(slot => `
                <button type="button" 
                        class="time-slot-btn px-4 py-2 rounded-lg border ${slot.available ? 'hover:bg-blue-50' : 'bg-gray-100 cursor-not-allowed'}"
                        ${!slot.available ? 'disabled' : ''}
                        data-time="${slot.time}">
                    ${slot.time}
                </button>
            `).join('');

            // Bind time slot selection events
            container.querySelectorAll('.time-slot-btn:not([disabled])').forEach(btn => {
                btn.addEventListener('click', (e) => this.selectTimeSlot(e));
            });
        }
    }

    selectService(e) {
        const serviceId = e.currentTarget.dataset.serviceId;
        this.selectedService = serviceId;
        
        // Update UI to show selected service
        document.querySelectorAll('.service-option').forEach(el => {
            el.classList.remove('ring-2', 'ring-blue-500');
        });
        e.currentTarget.classList.add('ring-2', 'ring-blue-500');
        
        this.updateAvailableTimeSlots();
    }

    selectStaff(e) {
        const staffId = e.currentTarget.dataset.staffId;
        this.selectedStaff = staffId;
        
        // Update UI to show selected staff
        document.querySelectorAll('.staff-option').forEach(el => {
            el.classList.remove('ring-2', 'ring-blue-500');
        });
        e.currentTarget.classList.add('ring-2', 'ring-blue-500');
        
        this.updateAvailableTimeSlots();
    }

    selectTimeSlot(e) {
        const time = e.currentTarget.dataset.time;
        this.selectedTime = time;
        
        // Update UI to show selected time
        document.querySelectorAll('.time-slot-btn').forEach(el => {
            el.classList.remove('bg-blue-500', 'text-white');
        });
        e.currentTarget.classList.add('bg-blue-500', 'text-white');
    }

    nextStep() {
        if (this.validateCurrentStep()) {
            if (this.currentStep < this.totalSteps) {
                this.currentStep++;
                this.updateProgressBar();
                this.showCurrentStep();
            }
        }
    }

    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateProgressBar();
            this.showCurrentStep();
        }
    }

    updateProgressBar() {
        const progress = ((this.currentStep - 1) / (this.totalSteps - 1)) * 100;
        const progressBar = document.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
    }

    showCurrentStep() {
        document.querySelectorAll('.booking-step').forEach(step => {
            step.classList.add('hidden');
        });
        document.querySelector(`.booking-step-${this.currentStep}`)?.classList.remove('hidden');
    }

    validateCurrentStep() {
        switch(this.currentStep) {
            case 1:
                if (!this.selectedService) {
                    this.showError('Please select a service');
                    return false;
                }
                break;
            case 2:
                if (!this.selectedStaff) {
                    this.showError('Please select a staff member');
                    return false;
                }
                break;
            case 3:
                if (!this.selectedDate || !this.selectedTime) {
                    this.showError('Please select date and time');
                    return false;
                }
                break;
        }
        return true;
    }

    async handleSubmit(e) {
        e.preventDefault();
        if (!this.validateAllFields()) return;

        try {
            this.showLoading();
            const formData = new FormData(e.target);
            formData.append('serviceId', this.selectedService);
            formData.append('staffId', this.selectedStaff);
            formData.append('date', this.selectedDate);
            formData.append('time', this.selectedTime);

            const response = await fetch('/api/bookings', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error('Booking failed');

            const result = await response.json();
            this.showSuccess('Booking confirmed successfully!');
            window.location.href = `/booking-confirmation/${result.bookingId}`;
        } catch (error) {
            console.error('Booking submission failed:', error);
            this.showError('Failed to complete booking');
        } finally {
            this.hideLoading();
        }
    }

    validateAllFields() {
        if (!this.selectedService || !this.selectedStaff || !this.selectedDate || !this.selectedTime) {
            this.showError('Please complete all booking details');
            return false;
        }
        return true;
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
        alert.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded shadow-lg z-50';
        alert.textContent = message;
        document.body.appendChild(alert);
        setTimeout(() => alert.remove(), 3000);
    }

    showSuccess(message) {
        const alert = document.createElement('div');
        alert.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded shadow-lg z-50';
        alert.textContent = message;
        document.body.appendChild(alert);
        setTimeout(() => alert.remove(), 3000);
    }

    isDateUnavailable(date) {
        // Add logic to check if date is unavailable
        const day = date.getDay();
        // Example: disable Sundays (0) and Saturdays (6)
        return day === 0 || day === 6;
    }
}

// Initialize BookingManager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.bookingManager = new BookingManager();
});
