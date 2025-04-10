require('../utility/otel');
const { Client } = require('ssh2');
const logger = require('../utility/logger');
const config = require('../../config/config');
const util = require('util');
const executeCommand = require('../commands/executeCommand');
const executeBackgroundCommand = require('../commands/executeBackgroundCommand');

// Function to check if InfluxDB is installed
function checkInflux(ip, callback) {
    const checkCommand = `which influx || echo "not found"`;
    executeCommand(ip, checkCommand, (err, result) => {
        if (err) {
            return callback(err);
        }
        return callback(null, result.trim() !== 'not found'); // Returns true if installed, false otherwise
    });
}

// Function to install InfluxDB if not installed
async function installInfluxDB(ip, callback) {
    try {
        /*const influxInstalled = await new Promise((resolve, reject) => {
            checkInflux(ip, (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });

        if (influxInstalled) {
            return callback(null, "InfluxDB is already installed.");
        }*/

        const installCommand = `
    # Remove old key if exists
    sudo rm -rf /etc/apt/keyrings/influxdata-archive_compat.asc /etc/apt/trusted.gpg.d/influxdata-archive_compat.gpg

    # Add InfluxDB 2.x repository
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://repos.influxdata.com/influxdata-archive_compat.key | sudo tee /etc/apt/keyrings/influxdata-archive_compat.asc > /dev/null
    sudo chmod 644 /etc/apt/keyrings/influxdata-archive_compat.asc

    # Correct way to add repository with proper signing
    echo "deb [signed-by=/etc/apt/keyrings/influxdata-archive_compat.asc] https://repos.influxdata.com/debian stable main" | sudo tee /etc/apt/sources.list.d/influxdata.list

    # Update package lists and install InfluxDB
    sudo apt-get update
    sudo apt-get install -y influxdb2 influxdb2-cli

    # Verify installed versions
    influxd version && influx version

    # Create initial admin user, org, and token
    influx setup --username ${config.influxDbUser} --password ${config.influxDbPassword} \\
    --org ${config.influxDbOrg} --bucket ${config.influxDbBucket} \\
    --token ${config.influxDbToken} --force

    # Verify initial setup and token
    influx auth list
    `;

        executeCommand(ip, installCommand, callback);
    } catch (err) {
        callback(err);
    }
}

function startInfluxDBService(ip, callback) {
    const startServiceCommand = 'nohup influxd > influxdb.log 2>&1 &';
    executeBackgroundCommand(ip, startServiceCommand, (err, stdout) => {
        if (err) {
            logger.error(`Error starting influx ${ip}:`, err);
            return callback(err);
        }
        logger.info(`Influx started successfully on ${ip}`);
        callback(null, stdout);
    });
}

function createJMeterDatabase(ip, callback) {
    const conn = new Client();
    conn.on('ready', () => {
        logger.info(`Connected to ${ip}`);

        const createDBCommand = `influx bucket create -n jmeter_results -r 0 --org ${config.influxDbOrg} --token ${config.influxDbToken}`;

        conn.exec(createDBCommand, (err, stream) => {
            if (err) {
                logger.error(`Error creating database on ${ip}:`, err);
                conn.end();
                callback(err, null);
                return;
            }

            let output = '';
            stream.on('data', (data) => {
                output += data.toString();
            });

            stream.on('close', (code, signal) => {
                if (code === 0) {
                    logger.info('Database "jmeter_results" created successfully.');
                    callback(null, 'Database created');
                } else {
                    logger.error(`Error creating database: ${output}`);
                    callback(new Error(`Error creating database: ${output}`), null);
                }
                conn.end();
            });

            stream.stderr.on('data', (data) => {
                logger.error('stderr: ' + data);
            });
        });
    }).connect({
        host: ip,
        port: 22,
        username: config.username,
        password: config.password,
    });
}

module.exports = { installInfluxDB, createJMeterDatabase, startInfluxDBService} ;
