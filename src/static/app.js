document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Reset activity select, keep placeholder
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants section with delete buttons
        let participantsHtml = "";
        if (details.participants && details.participants.length > 0) {
          participantsHtml = `<div class="participants"><h5>Participants</h5><ul>${details.participants
            .map((p) => `<li><span class="participant-email">${escapeHtml(p)}</span><button class="delete-btn" data-activity="${escapeHtml(name)}" data-email="${escapeHtml(p)}" aria-label="Remove ${escapeHtml(p)}">&times;</button></li>`) 
            .join("")}</ul></div>`;
        } else {
          participantsHtml = `<div class="participants empty"><h5>Participants</h5><p class="muted">No participants yet</p></div>`;
        }

        activityCard.innerHTML = `
          <h4>${escapeHtml(name)}</h4>
          <p>${escapeHtml(details.description)}</p>
          <p><strong>Schedule:</strong> ${escapeHtml(details.schedule)}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHtml}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
          activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Helper to escape user-provided strings before inserting into HTML
  function escapeHtml(str) {
    if (typeof str !== "string") return str;
    return str.replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "message success";
        signupForm.reset();
        // Refresh activities so the new participant appears without manual reload
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "message error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "message error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Handle unregister (delete) clicks using event delegation
  activitiesList.addEventListener("click", async (e) => {
    const btn = e.target.closest && e.target.closest('.delete-btn');
    if (!btn) return;

    const activity = btn.dataset.activity;
    const email = btn.dataset.email;

    if (!activity || !email) return;

    if (!confirm(`Unregister ${email} from ${activity}?`)) return;

    try {
      const response = await fetch(`/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = 'message success';
        // refresh list
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || 'Failed to unregister participant';
        messageDiv.className = 'message error';
      }

      messageDiv.classList.remove('hidden');
      setTimeout(() => messageDiv.classList.add('hidden'), 4000);
    } catch (err) {
      console.error('Error unregistering participant:', err);
      messageDiv.textContent = 'Failed to unregister. Please try again.';
      messageDiv.className = 'message error';
      messageDiv.classList.remove('hidden');
      setTimeout(() => messageDiv.classList.add('hidden'), 4000);
    }
  });

  // Initialize app
  fetchActivities();
});
