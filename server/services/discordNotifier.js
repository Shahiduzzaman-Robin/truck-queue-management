const https = require('https');
const path = require('path');
// Try loading from config.env (non-hidden file) to avoid permission issues
require('dotenv').config({ path: path.join(__dirname, '../../config.env') });

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const DISCORD_ENTRY_WEBHOOK_URL = process.env.DISCORD_ENTRY_WEBHOOK_URL || DISCORD_WEBHOOK_URL;
const DISCORD_COMPLETION_WEBHOOK_URL = process.env.DISCORD_COMPLETION_WEBHOOK_URL || DISCORD_WEBHOOK_URL;

/**
 * Send a Discord notification for a new truck added to the queue
 */
async function sendNewTruckNotification(truckData) {
    if (!DISCORD_ENTRY_WEBHOOK_URL) {
        console.warn('Discord Entry webhook URL not configured');
        return;
    }

    try {
        // Safety check for serial number
        const serialNum = truckData.serial_number ? String(truckData.serial_number) : 'N/A';
        const position = serialNum.includes('-') ? `#${serialNum.split('-')[1]}` : serialNum;

        // Ensure NO fields are null/undefined as Discord rejects those
        const safeValue = (val) => val ? String(val) : 'N/A';

        const embed = {
            title: '🚛 New Truck Added to Queue',
            description: `**Serial:** ${serialNum}`,
            color: 5763719, // Green (0x57F287)
            fields: [
                {
                    name: '👤 Driver Name',
                    value: safeValue(truckData.driver_name),
                    inline: true
                },
                {
                    name: '📱 Driver Phone',
                    value: safeValue(truckData.phone_number),
                    inline: true
                },
                {
                    name: '🏢 Warehouse',
                    value: safeValue(truckData.warehouse_name),
                    inline: false
                },
                {
                    name: '👔 Seller Name',
                    value: safeValue(truckData.sales_manager) === 'null' ? 'Not Assigned' : safeValue(truckData.sales_manager),
                    inline: true
                },
                {
                    name: '⏰ Entry Time',
                    value: new Date().toLocaleString('en-US', {
                        timeZone: 'Asia/Dhaka',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric',
                        hour12: true
                    }),
                    inline: true
                }
            ],
            footer: {
                text: 'Truck Queue Management System'
            },
            timestamp: new Date().toISOString()
        };

        const payload = JSON.stringify({ embeds: [embed] });
        const url = new URL(DISCORD_ENTRY_WEBHOOK_URL);

        const options = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        };

        return new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    console.log('✅ Discord notification sent: New truck added');
                    resolve();
                } else {
                    reject(new Error(`Discord webhook returned status ${res.statusCode}`));
                }
            });

            req.on('error', reject);
            req.write(payload);
            req.end();
        });

    } catch (error) {
        console.error('❌ Failed to send Discord notification:', error.message);
    }
}

/**
 * Send a Discord notification for a completed truck
 */
async function sendCompletedTruckNotification(truckData) {
    if (!DISCORD_COMPLETION_WEBHOOK_URL) {
        console.warn('Discord Completion webhook URL not configured');
        return;
    }

    try {
        // Calculate loading time
        const entryTime = new Date(truckData.time_of_entry);
        const finishTime = new Date(truckData.finished_at);
        const durationMs = finishTime - entryTime;

        function formatDuration(ms) {
            const seconds = Math.floor(ms / 1000);
            const minutes = Math.floor(seconds / 60);
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);

            const parts = [];
            if (days > 0) parts.push(`${days} day`);
            if (hours % 24 > 0) parts.push(`${hours % 24} hour`);
            if (minutes % 60 > 0) parts.push(`${minutes % 60} min`);

            return parts.length > 0 ? parts.join(' ') : '0 min';
        }

        // Safety helpers
        const safeValue = (val) => val ? String(val) : 'N/A';
        const serialNum = safeValue(truckData.serial_number);

        const embed = {
            title: '✅ Truck Loading Completed',
            description: `**Serial:** ${serialNum}`,
            color: 3447003, // Blue (0x3498DB)
            fields: [
                {
                    name: '⏱️ Total Time',
                    value: formatDuration(durationMs),
                    inline: true
                },
                {
                    name: '👤 Driver Name',
                    value: safeValue(truckData.driver_name),
                    inline: true
                },
                {
                    name: '📱 Driver Phone',
                    value: safeValue(truckData.phone_number),
                    inline: true
                },
                {
                    name: '🏢 Warehouse',
                    value: safeValue(truckData.warehouse_name),
                    inline: false
                },
                {
                    name: '📍 Destination',
                    value: safeValue(truckData.destination),
                    inline: true
                },
                {
                    name: '👔 Seller Name',
                    value: safeValue(truckData.sales_manager) === 'null' ? 'Not Assigned' : safeValue(truckData.sales_manager),
                    inline: true
                },
                {
                    name: '📥 Entry Time',
                    value: entryTime.toLocaleString('en-US', {
                        timeZone: 'Asia/Dhaka',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric',
                        hour12: true
                    }),
                    inline: true
                },
                {
                    name: '📤 Completion',
                    value: finishTime.toLocaleString('en-US', {
                        timeZone: 'Asia/Dhaka',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric',
                        hour12: true
                    }),
                    inline: true
                }
            ],
            footer: {
                text: 'Truck Queue Management System'
            },
            timestamp: new Date().toISOString()
        };

        const payload = JSON.stringify({ embeds: [embed] });
        const url = new URL(DISCORD_COMPLETION_WEBHOOK_URL);

        const options = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        };

        return new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    console.log('✅ Discord notification sent: Truck completed');
                    resolve();
                } else {
                    reject(new Error(`Discord webhook returned status ${res.statusCode}`));
                }
            });

            req.on('error', reject);
            req.write(payload);
            req.end();
        });

    } catch (error) {
        console.error('❌ Failed to send Discord notification:', error.message);
    }
}

module.exports = {
    sendNewTruckNotification,
    sendCompletedTruckNotification
};
