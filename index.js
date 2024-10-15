const axios = require('axios');
const GoogleCalendar = require('./googleCalendarClient');
const Config = require('./config');

class CalendarSync {
    constructor() {
        this.config = new Config().getConfig();
        this.gcalClient = new GoogleCalendar(this.config.gcal.calendar_id);
    }

    async sync() {
        await this.gcalClient.authenticate();
        const timeOffRequests = await this.getTimeOffRequests();

        console.log(`Updating/Creating ${timeOffRequests.length} items`);
        for (const booking of timeOffRequests) {
            const eventId = `emp${booking.employeeId}id${booking.id}`;
            const start = booking.start;
            const end = new Date(new Date(booking.end).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Add an extra day

            const summary = `Time Booked off: ${booking.status}`;
            const description = `Type: ${booking.type}\nNotes: ${booking.notes}`;
            await this.gcalClient.updateEvent(eventId, start, end, booking.status, summary, description);
        }
    }

    async getTimeOffRequests() {
        const start = new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0];
        const end = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0];

        const url = `https://api.bamboohr.com/api/gateway.php/${this.config.bamboo.company}/v1/time_off/requests`;
        const response = await axios.get(url, {
            params: { start, end, employeeId: this.config.bamboo.employee_id },
            headers: { Authorization: `Bearer ${this.config.bamboo.token}` },
        });

        return response.data.requests;
    }
}

(async () => {
    const calendarSync = new CalendarSync();
    await calendarSync.sync();
    console.log('Done');
})();
