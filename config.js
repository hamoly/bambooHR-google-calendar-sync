require('dotenv').config();
const fs = require('fs');
const path = require('path');

class Config {
    constructor() {
        this.configDir = path.join(process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE, '.config/bamboohr');
        this.configFile = path.join(this.configDir, 'google-calendar-sync.json');
        this.bamboo = null;
        this.gcal = null;

        this.loadConfig();
    }

    loadConfig() {
        if (!fs.existsSync(this.configFile)) {
            this.promptConfig();
        } else {
            const config = JSON.parse(fs.readFileSync(this.configFile));
            this.bamboo = config.bamboo;
            this.gcal = config.gcal;
        }
    }

    promptConfig() {
        this.bamboo = {
            company: process.env.BAMBOO_COMPANY,
            token: process.env.BAMBOO_TOKEN,
            employee_id: process.env.BAMBOO_EMPLOYEE_ID,
        };
        this.gcal = {
            calendar_id: process.env.GCAL_CALENDAR_ID,
        };

        if (!fs.existsSync(this.configDir)) {
            fs.mkdirSync(this.configDir, { recursive: true });
        }

        fs.writeFileSync(this.configFile, JSON.stringify({ bamboo: this.bamboo, gcal: this.gcal }));
    }

    getConfig() {
        return { bamboo: this.bamboo, gcal: this.gcal };
    }
}

module.exports = Config;
