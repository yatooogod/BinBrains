// Fetch user points and update the Wallet section
const fetchPoints = async () => {
    try {
        const response = await fetch('/api/User/points', {
            method: 'GET',
            credentials: 'same-origin', // Ensures that cookies are sent with the request
        });

        if (!response.ok) {
            throw new Error('Failed to fetch points');
        }

        const data = await response.json();

        // Update the points on the Wallet section
        document.getElementById('points').textContent = `${data.points} points`;

    } catch (error) {
        console.error('Error fetching points:', error);
        document.getElementById('points').textContent = 'Error loading points';
    }
};

// Fetch notifications and update the Notification section
const fetchNotifications = async () => {
    try {
        const response = await fetch('/api/User/notifications', {
            method: 'GET',
            credentials: 'same-origin', // Ensures cookies are sent with the request
        });

        if (!response.ok) {
            throw new Error('Failed to fetch notifications');
        }

        const data = await response.json();

        // Fetch and display notifications
        const notificationsList = document.getElementById('notifications');
        if (data.notifications && data.notifications.length > 0) {
            notificationsList.innerHTML = '';
            data.notifications.forEach((notification) => {
                const listItem = document.createElement('li');
                listItem.textContent = notification.message;
                notificationsList.appendChild(listItem);
            });
        } else {
            notificationsList.innerHTML = '<li>No notifications available</li>';
        }
    } catch (error) {
        console.error('Error fetching notifications:', error);
        document.getElementById('notifications').innerHTML = '<li>Error loading notifications</li>';
    }
};


// Fetch user details for settings
const fetchUserDetails = async () => {
    try {
        const response = await fetch('/api/User/details', {
            method: 'GET',
            credentials: 'same-origin',
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user details');
        }

        const user = await response.json();

        // Populate the username field with the current username
        document.getElementById('usernameInput').value = user.username;
    } catch (error) {
        console.error('Error fetching user details:', error);
        alert('Failed to load user details.');
    }
};

// Update username
const updateUsername = async () => {
    const newUsername = document.getElementById('usernameInput').value;

    if (!newUsername) {
        alert("Username cannot be empty.");
        return;
    }

    try {
        const response = await fetch('/api/User/updateUsername', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ username: newUsername }),
        });

        if (!response.ok) {
            throw new Error('Failed to update username');
        }

        alert('Username updated successfully!');
        fetchUserDetails(); // Refresh the username field
    } catch (error) {
        console.error('Error updating username:', error);
        alert('Failed to update username.');
    }
};

// Change password
const changePassword = async () => {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!currentPassword || !newPassword || !confirmPassword) {
        alert("Please fill in all fields.");
        return;
    }

    if (newPassword !== confirmPassword) {
        alert("New password and confirmation do not match.");
        return;
    }

    try {
        const response = await fetch('/api/User/changePassword', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ currentPassword, newPassword }),
        });

        if (!response.ok) {
            throw new Error('Failed to change password');
        }

        alert('Password changed successfully!');
    } catch (error) {
        console.error('Error changing password:', error);
        alert('Failed to change password.');
    }
};

// Log out user
const logOut = async () => {
    try {
        const response = await fetch('/api/User/logout', {
            method: 'POST',
            credentials: 'same-origin',
        });

        if (!response.ok) {
            throw new Error('Failed to log out');
        }

        // Redirect to login page
        window.location.href = '/';
    } catch (error) {
        console.error('Error logging out:', error);
        alert('Failed to log out.');
    }
};

// Toggle between sections/pages
const togglePage = (pageToShow) => {
    const sections = ['walletSection', 'notificationSection', 'monitoringSection', 'settingsSection', 'rewardsSection'];
    sections.forEach((section) => {
        const element = document.getElementById(section);
        element.style.display = section === pageToShow ? 'block' : 'none';
    });

    if (pageToShow === 'monitoringSection') {
        loadMonitoringChart();
    } else if (pageToShow === 'settingsSection') {
        fetchUserDetails();
    }
};

// Function to load Chart.js on the Monitoring Page
const loadMonitoringChart = () => {
    const ctx = document.getElementById('pointsChart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Plastic', 'Paper', 'Metal', 'Non-Recyclable'], // Example categories
            datasets: [{
                data: [80, 65, 30, 49], // Example data, replace with real data from backend
                backgroundColor: ['#66cdaa', '#f9c2ff', '#a2d2ff', '#ff8a5c'],
                borderWidth: 1,
            }],
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                },
                tooltip: {
                    callbacks: {
                        label: (tooltipItem) => `${tooltipItem.label}: ${tooltipItem.raw} points`,
                    },
                },
            },
        },
    });
};

// Event listeners for bottom navigation buttons
document.getElementById('walletBtn').addEventListener('click', () => {
    togglePage('walletSection');
    fetchPoints();
});

document.getElementById('notificationBtn').addEventListener('click', () => {
    togglePage('notificationSection');
    fetchNotifications();
});

document.getElementById('monitoringBtn').addEventListener('click', () => {
    togglePage('monitoringSection');
});

document.getElementById('settingsBtn').addEventListener('click', () => {
    togglePage('settingsSection');
});

// Event listeners for settings buttons
document.getElementById('updateUsernameBtn').addEventListener('click', updateUsername);
document.getElementById('changePasswordBtn').addEventListener('click', changePassword);
document.getElementById('logoutBtn').addEventListener('click', logOut);

// Initial load: Display Wallet section and fetch points
togglePage('walletSection');
fetchPoints();

//update username
document.getElementById('updateUsernameBtn').addEventListener('click', async () => {
    const newUsername = document.getElementById('usernameInput').value.trim();
    if (!newUsername) {
        alert('Please enter a new username.');
        return;
    }

    try {
        const response = await fetch('/api/User/updateUsername', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username: newUsername }),
        });

        if (response.ok) {
            alert('Username updated successfully!');
            location.reload(); // Reload to fetch updated username
        } else {
            const error = await response.text();
            alert(`Failed to update username: ${error}`);
        }
    } catch (err) {
        console.error('Error updating username:', err);
        alert('An error occurred while updating the username.');
    }
});

//change password
document.getElementById('changePasswordBtn').addEventListener('click', async () => {
    const currentPassword = document.getElementById('currentPassword').value.trim();
    const newPassword = document.getElementById('newPassword').value.trim();

    if (!currentPassword || !newPassword) {
        alert('Please fill out both password fields.');
        return;
    }

    try {
        const response = await fetch('/api/User/changePassword', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ currentPassword, newPassword }),
        });

        if (response.ok) {
            alert('Password changed successfully!');
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
        } else {
            const error = await response.text();
            alert(`Failed to change password: ${error}`);
        }
    } catch (err) {
        console.error('Error changing password:', err);
        alert('An error occurred while changing the password.');
    }
});

// Logout Button Handler
document.getElementById('logoutBtn').addEventListener('click', () => {
    fetch('/logout', { method: 'GET' })
        .then(response => {
            if (response.ok) {
                // Redirect to the login page after successful logout
                window.location.href = '/';
            } else {
                alert('Failed to log out. Please try again.');
            }
        })
        .catch(err => console.error('Error logging out:', err));
});

// Fetch rewards and update the Rewards section
const fetchRewards = async () => {
    try {
        const response = await fetch('/api/User/rewards', {
            method: 'GET',
            credentials: 'same-origin', // Ensures cookies are sent with the request
        });

        if (!response.ok) {
            throw new Error('Failed to fetch rewards');
        }

        const data = await response.json();

        // Get the rewards list element
        const rewardsList = document.getElementById('rewardsList');

        // Clear the previous rewards list
        rewardsList.innerHTML = '';

        if (data.rewards && data.rewards.length > 0) {
            // Loop through the rewards and create reward items (not list items)
            data.rewards.forEach((reward) => {
                const rewardItem = document.createElement('div');
                rewardItem.classList.add('reward-item'); // Add the reward-item class for styling

                rewardItem.innerHTML = `
                    <h3>${reward.name}</h3>
                    <p>${reward.points} points</p>
                    <button onclick="redeemReward('${reward._id}', ${reward.points})">Redeem</button>
                `;
                rewardsList.appendChild(rewardItem);
            });
        } else {
            rewardsList.innerHTML = '<p>No rewards available.</p>';
        }
    } catch (error) {
        console.error('Error fetching rewards:', error);
        document.getElementById('rewardsList').innerHTML = '<p>Error loading rewards.</p>';
    }
};


// Event listener for the Rewards button
document.getElementById('rewardsBtn').addEventListener('click', () => {
    togglePage('rewardsSection'); // Show the Rewards section
    fetchRewards(); // Fetch rewards to display
});

const redeemReward = async (rewardId, rewardPoints) => {
    try {
        const response = await fetch('/api/User/purchase', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ rewardId }), // Send reward ID
            credentials: 'same-origin', // Include cookies for user authentication
        });

        const result = await response.json();

        if (response.ok) {
            alert(result.message); // Success message
            fetchRewards(); // Refresh rewards list to reflect updated points

            // Add a transaction notification to the Notification section
            const notificationMessage = `Your transaction of redeeming ${rewardPoints} points for the reward was successful!`;
            addNotification(notificationMessage); // Function to add notification

        } else {
            alert(result.message); // Error message
        }
    } catch (error) {
        console.error('Error redeeming reward:', error);
        alert('Error redeeming reward. Please try again later.');
    }
};

// Function to add notifications dynamically
const addNotification = (message) => {
    const notificationsList = document.getElementById('notifications');
    const listItem = document.createElement('li');
    listItem.textContent = message;
    notificationsList.appendChild(listItem);
};

// Get the success message from the query parameters
const urlParams = new URLSearchParams(window.location.search);
const successMessage = urlParams.get('successMessage');

// If a success message exists, display it
if (successMessage) {
    const successMessageElement = document.getElementById('success-message');
    successMessageElement.textContent = successMessage;
    successMessageElement.style.display = 'block';
}

// Close the success message when the button is clicked
const closeSuccessMessageBtn = document.createElement('button');
closeSuccessMessageBtn.textContent = 'Okay';
closeSuccessMessageBtn.onclick = function () {
    const successMessageElement = document.getElementById('success-message');
    successMessageElement.style.display = 'none';
};

// Append the button to the success message div
document.getElementById('success-message').appendChild(closeSuccessMessageBtn);

