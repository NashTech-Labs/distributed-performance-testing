const { Client } = require('ssh2');
const config = require('../../config/config'); 

function executeBackgroundCommand(ip, command, callback) {
    const conn = new Client();

    conn.on('ready', () => {
        console.log(`Connected to ${ip}`);

        // Run the command on the remote server in the background
        const pathCommand = `export PATH=\$PATH:${config.jmeterDir}/bin; ${command}`;
        conn.exec(pathCommand, (err, stream) => {
            if (err) {
                console.error(`Error executing command on ${ip}:`, err);
                conn.end(); // Explicitly close the connection
                callback(err, null);
                return;
            }

            // Don't wait for the command to finish; close SSH immediately
            stream.on('close', () => {
                console.log(`Command sent to ${ip}. Closing SSH connection.`);
            });

            console.log(`Command sent to ${ip}. Waiting for 5 seconds before closing SSH connection.`);
            setTimeout(() => {
                conn.end(); // Close the SSH connection after the delay
                console.log(`SSH connection to ${ip} closed.`);
                callback(null, 'Background process started after delay.');
            }, 5000); // 5-second delay

            // Explicitly ignore data from the stream to prevent blocking
            stream.on('data', () => {});
            stream.stderr.on('data', () => {});
        });
    }).connect({
        host: ip,
        port: 22,
        username: config.username,
        password: config.password,
    });
}

module.exports = executeBackgroundCommand;