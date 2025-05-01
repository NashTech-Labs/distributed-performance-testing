require('../utility/otel');
const { Client } = require('ssh2');
const config = require('../../config/config'); 
const logger = require('../utility/logger'); 

function executeCommand(ip, command, callback) {
    const conn = new Client();
    conn.on('ready', () => {
        logger.info(`Connected to ${ip}`);
        // Explicitly set the PATH for non-interactive sessions
        const pathCommand = `export PATH=\$PATH:${config.jmeterDir}/bin; ${command}`;
        conn.exec(pathCommand, (err, stream) => {
            if (err) {
                logger.error(`Error executing command on ${ip}:`, err);
                if (callback && typeof callback === 'function') {
                    callback(err, null);  // Only call callback if it's a function
                }
                conn.end();
                return;
            }

            let output = '';
            let errorOutput = '';

            stream.on('data', (data) => {
                output += data;
            }).on('stderr', (data) => {
                errorOutput += data;
            }).on('close', (code, signal) => {
                logger.info(`Command executed on ${ip}: ${command}`);
                if (errorOutput) {
                    logger.error(`Error on ${ip}: ${errorOutput}`);
                }
                logger.info(output);

                // Close the connection after command execution
                conn.end();

                // Ensure callback is called after execution
                if (callback && typeof callback === 'function') {
                    callback(null, output.trim());  // Proper callback invocation
                }
            });
        });
    }).connect({
        host: ip,
        port: 22,
        username: config.username,  // Make sure to use the correct username
        password: config.password  // Use password from your environment variables
    });
}

module.exports = executeCommand;