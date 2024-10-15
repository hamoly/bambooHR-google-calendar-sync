const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const TOKEN_PATH = path.join(process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE, '.config/bamboohr/google-calendar-token.json');

class GoogleCalendar {
    constructor(calendarId) {
        this.calendarId = calendarId;
        this.auth = null;
    }

    async authenticate() {
        const credentials = require('./google-calendar-client-secret.json');
        const { client_secret, client_id, redirect_uris } = credentials.installed;
        const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

        let token;
        try {
            token = fs.readFileSync(TOKEN_PATH);
            oAuth2Client.setCredentials(JSON.parse(token));
        } catch (error) {
            token = await this.getAccessToken(oAuth2Client);
        }

        this.auth = oAuth2Client;
    }

    getAccessToken(oAuth2Client) {
        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
        });

        console.log('Authorize this app by visiting this url:', authUrl);
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        return new Promise((resolve, reject) => {
            rl.question('Enter the code from that page here: ', (code) => {
                rl.close();
                oAuth2Client.getToken(code, (err, token) => {
                    if (err) return reject(err);
                    fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
                    resolve(token);
                });
            });
        });
    }

    async updateEvent(eventId, start, end, status, summary, description) {
        const calendar = google.calendar({ version: 'v3', auth: this.auth });

        const event = {
            id: eventId,
            start: { date: start },
            end: { date: end },
            summary: summary,
            description: description,
            status: status
        };

        try {
            await calendar.events.patch({
                calendarId: this.calendarId,
                eventId: eventId,
                resource: event,
            });
        } catch (err) {
            console.log('Error updating event:', err);
            // Try inserting the event if patch fails
            await calendar.events.insert({
                calendarId: this.calendarId,
                resource: event,
            });
        }
    }
}

module.exports = GoogleCalendar;
