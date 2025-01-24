const { Client } = require('ssh2');
const config = require('../../config/config'); 

function executeCommand(ip, command, callback) {
    const conn = new Client();
    conn.on('ready', () => {
        console.log(`Connected to ${ip}`);
        // Explicitly set the PATH for non-interactive sessions
        const pathCommand = `export PATH=\$PATH:${config.jmeterDir}/bin; ${command}`;
        conn.exec(pathCommand, (err, stream) => {
            if (err) {
                console.error(`Error executing command on ${ip}:`, err);
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
                console.log(`Command executed on ${ip}: ${command}`);
                if (errorOutput) {
                    console.error(`Error on ${ip}: ${errorOutput}`);
                }
                console.log(output);

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
        username: 'root',  // Make sure to use the correct username
        password: process.env.SSH_PASSWORD  // Use password from your environment variables
    });
}

module.exports = executeCommand;