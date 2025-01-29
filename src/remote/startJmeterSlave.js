const { exec } = require('child_process');
const executeBackgroundCommand = require('../commands/executeBackgroundCommand');
const executeCommand = require('../commands/executeCommand');
const config = require('../../config/config'); 

function startJMeterSlave(ip, serverPort, port, callback) {
    console.log(`Checking port ${serverPort} availability for slave on ${ip}...`);
    checkPortAvailability(ip, serverPort, (err) => {
        if (err) {
            console.error(`Port check failed: ${err.message}`);
            return callback(err);
        }
        console.log(`Starting slave on IP: ${ip}, Port: ${port}`);
        const slaveCommand = `cd ${config.jmeterDir}/bin && \
        nohup ./jmeter-server -Dserver_port=${serverPort} -Djava.rmi.server.hostname=${ip} -Dserver.rmi.localport=${port} -Dserver.rmi.port=${serverPort} > ${config.jmeterDir}/bin/jmeter-server.log 2>&1 & disown & sleep 5`;
        executeBackgroundCommand(ip, slaveCommand, (err, stdout) => {
            if (err) {
                console.error(`Error starting slave on ${ip}:`, err);
                return callback(err);
            }
            console.log(`Slave started successfully on ${ip}:${port}`);
            callback(null, stdout);
        });
    });
}

function checkPortAvailability(ip, port, callback) {
    const findCommand = `netstat -tuln | grep ${port}`;
    const killCommand = `lsof -ti:${port} | xargs -r kill -9`;

    // Check if the port is in use
    executeCommand(ip, findCommand, (err, stdout, stderr) => {
        console.log("stdout : ", stdout);
        if (err) {
            console.error("Error executing command:", err.message);
            callback(err);
            return;
        }
        if (stdout && stdout.includes(port)) {
            console.log(`Port ${port} is in use. Attempting to free it...`);

            // Kill processes using the port
            executeCommand(ip, killCommand, (killErr) => {
                if (killErr) {
                    console.error(`Failed to kill processes on port ${port}:`, killErr.message);
                    callback(killErr);
                    return;
                }
                console.log(`Successfully freed port ${port}.`);
                callback(null); // Port is now available
            });
        } else {
            console.log(`Port ${port} is available.`);
            callback(null); // Port is available
        }
    });
}

module.exports = {startJMeterSlave}