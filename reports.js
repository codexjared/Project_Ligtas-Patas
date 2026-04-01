document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('reportForm');
    const reportsContainer = document.getElementById('reportsContainer');
    const reportsSection = document.querySelector('.reports-section h2');
    let reportCounter = 0;

    // Add "NEW" badge animation style
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeOut {
            from { opacity: 1; transform: translateY(0); }
            to { opacity: 0; transform: translateY(-10px); }
        }
        @keyframes bounceIn {
            0% { transform: scale(0.3); opacity: 0; }
            50% { transform: scale(1.05); }
            70% { transform: scale(0.9); }
            100% { transform: scale(1); opacity: 1; }
        }
        .new-report {
            animation: bounceIn 0.6s ease-out;
            border: 3px solid #3498db;
            box-shadow: 0 0 20px rgba(52, 152, 219, 0.3);
        }
        .new-badge {
            position: absolute;
            top: -10px;
            right: -10px;
            background: #e74c3c;
            color: white;
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 0.75rem;
            font-weight: 600;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
    `;
    document.head.appendChild(style);

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form values
        const name = document.getElementById('name').value.trim() || 'Anonymous';
        const barangay = document.getElementById('barangay').value;
        const status = document.getElementById('status').value;
        const message = document.getElementById('message').value.trim();

        if (!barangay || !status || !message) {
            alert('Please fill in all required fields.');
            return;
        }

        // Create report card
        const reportCard = createReportCard(name, barangay, status, message, ++reportCounter);
        
        // **POST TO TOP** - Most recent first (RECENT REPORTS)
        reportsContainer.insertBefore(reportCard, reportsContainer.firstChild);
        
        // Add "NEW" visual feedback
        setTimeout(() => {
            reportCard.classList.add('new-report');
            const newBadge = document.createElement('div');
            newBadge.className = 'new-badge';
            newBadge.textContent = 'NEW';
            reportCard.style.position = 'relative';
            reportCard.appendChild(newBadge);
            
            // Remove NEW badge after 5 seconds
            setTimeout(() => {
                newBadge.remove();
                reportCard.classList.remove('new-report');
            }, 5000);
        }, 100);

        // Show success message
        showSuccessMessage();

        // Clear form
        form.reset();

        // Scroll to TOP of recent reports
        reportsContainer.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    });

    function createReportCard(name, barangay, status, message, id) {
        const reportCard = document.createElement('div');
        reportCard.className = `report-card status-${status.toLowerCase().replace(' ', '-')}`;
        reportCard.dataset.id = id;

        const statusClass = status.toLowerCase().replace(' ', '-');
        const formattedStatus = status.replace(' ', ' ');

        const timestamp = new Date().toLocaleString('en-PH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        reportCard.innerHTML = `
            <div class="status-label">${formattedStatus}</div>
            <div class="report-header">
                <div class="report-name">${name}</div>
                <div class="report-barangay">${barangay}</div>
            </div>
            <div class="report-message">${message}</div>
            <div class="report-meta">
                <span>${timestamp}</span>
                <button class="delete-btn" onclick="deleteReport(${id})">Delete</button>
            </div>
        `;

        return reportCard;
    }

    function showSuccessMessage() {
        // Create temporary success message
        const successMsg = document.createElement('div');
        successMsg.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #27ae60;
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            font-weight: 600;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
            box-shadow: 0 10px 30px rgba(39, 174, 96, 0.4);
        `;
        successMsg.textContent = '✅ Report posted successfully!';
        document.body.appendChild(successMsg);

        // Add slideIn animation
        const animStyle = document.createElement('style');
        animStyle.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(animStyle);

        // Remove after 3 seconds
        setTimeout(() => {
            successMsg.style.animation = 'fadeOut 0.3s ease-in';
            setTimeout(() => successMsg.remove(), 300);
        }, 3000);
    }

    // Global function for delete button
    window.deleteReport = function(id) {
        const reportCard = document.querySelector(`[data-id="${id}"]`);
        if (reportCard) {
            reportCard.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => {
                reportCard.remove();
            }, 300);
        }
    };
});

const menu = document.querySelector('#mobile-menu');
const menuLinks = document.querySelector('.navbar__menu');

menu.addEventListener('click', function() {
    menu.classList.toggle('is-active');
    menuLinks.classList.toggle('active');
});