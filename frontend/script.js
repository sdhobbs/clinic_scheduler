document.addEventListener('DOMContentLoaded', () => {
    const eventDateInput = document.getElementById('event-date');
    const eventTimeInput = document.getElementById('event-time');
    const eventDescInput = document.getElementById('event-desc');
    const addEventBtn = document.getElementById('add-event-btn');
    const eventsList = document.getElementById('events-list');
    const filterDateInput = document.getElementById('filter-date');

    const API_BASE_URL = 'http://localhost:3000/api'; // Backend API URL

    // Load events when the page loads
    loadEvents();

    addEventBtn.addEventListener('click', addEvent);
    filterDateInput.addEventListener('change', displayEvents); // Re-display on filter change

    async function loadEvents() {
        // This function now primarily triggers displayEvents,
        // which will fetch and then render.
        await displayEvents();
    }

    async function addEvent() {
        const date = eventDateInput.value;
        const time = eventTimeInput.value;
        const description = eventDescInput.value.trim();

        if (!date || !time || !description) {
            alert('Please fill in all fields: Date, Time, and Description.');
            return;
        }

        const newEventData = {
            date: date,
            time: time,
            description: description
        };

        try {
            const response = await fetch(`${API_BASE_URL}/events`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newEventData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            // const savedEvent = await response.json(); // The backend returns the saved event
            // console.log('Event added:', savedEvent);

            eventDateInput.value = '';
            eventTimeInput.value = '';
            eventDescInput.value = '';

            await displayEvents(); // Refresh the list from the backend
        } catch (error) {
            console.error('Error adding event:', error);
            alert(`Failed to add event: ${error.message}`);
        }
    }

    async function displayEvents() {
        const selectedFilterDate = filterDateInput.value;
        eventsList.innerHTML = ''; // Clear current list

        try {
            const response = await fetch(`${API_BASE_URL}/events`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            let events = await response.json();

            // Sort events by date and then by time
            events.sort((a, b) => {
                // Ensure IDs are not treated as numbers for sorting if they are strings
                const dateA = new Date(`${a.date}T${a.time}`);
                const dateB = new Date(`${b.date}T${b.time}`);
                return dateA - dateB;
            });
            
            const eventsToDisplay = events.filter(event => {
                if (!selectedFilterDate) return true; // If no filter date, show all
                return event.date === selectedFilterDate;
            });

            if (eventsToDisplay.length === 0) {
                const noEventsMessage = document.createElement('li');
                noEventsMessage.textContent = selectedFilterDate ? 'No events for this date.' : 'No events scheduled.';
                eventsList.appendChild(noEventsMessage);
                return;
            }

            eventsToDisplay.forEach(event => {
                const listItem = document.createElement('li');
                listItem.setAttribute('data-id', event.id); // id now comes from backend

                const detailsDiv = document.createElement('div');
                detailsDiv.classList.add('event-details');

                const eventDateSpan = document.createElement('span');
                eventDateSpan.textContent = formatDate(event.date);
                eventDateSpan.style.marginRight = '15px';
                eventDateSpan.style.fontWeight = 'normal';
                eventDateSpan.style.color = '#555';

                const eventTimeSpan = document.createElement('span');
                eventTimeSpan.classList.add('event-time');
                eventTimeSpan.textContent = formatTime(event.time);
                
                const eventDescSpan = document.createElement('span');
                eventDescSpan.classList.add('event-desc');
                eventDescSpan.textContent = event.description;

                detailsDiv.appendChild(eventDateSpan);
                detailsDiv.appendChild(eventTimeSpan);
                detailsDiv.appendChild(eventDescSpan);

                const deleteBtn = document.createElement('button');
                deleteBtn.classList.add('delete-btn');
                deleteBtn.textContent = 'Delete';
                deleteBtn.onclick = () => deleteEvent(event.id);

                listItem.appendChild(detailsDiv);
                listItem.appendChild(deleteBtn);
                eventsList.appendChild(listItem);
            });

        } catch (error) {
            console.error('Error fetching events:', error);
            eventsList.innerHTML = '<li>Error loading events. Check console.</li>';
        }
    }

    async function deleteEvent(eventId) {
        try {
            const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                 const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            // const result = await response.json(); // Backend sends a success message
            // console.log(result.message);

            await displayEvents(); // Refresh list
        } catch (error) {
            console.error('Error deleting event:', error);
            alert(`Failed to delete event: ${error.message}`);
        }
    }

    // Helper functions for formatting (same as before)
    function formatTime(timeString) {
        if (!timeString) return '';
        const [hours, minutes] = timeString.split(':');
        const h = parseInt(hours);
        const suffix = h >= 12 ? 'PM' : 'AM';
        const displayHours = h === 0 ? 12 : (h > 12 ? h - 12 : h); // Corrected 12 AM/PM logic
        return `${displayHours}:${minutes} ${suffix}`;
    }

    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString + 'T00:00:00');
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    }
});