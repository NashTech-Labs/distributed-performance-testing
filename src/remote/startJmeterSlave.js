require('../utility/otel');
const executeBackgroundCommand = require('../commands/executeBackgroundCommand');
const executeCommand = require('../commands/executeCommand');
const config = require('../../config/config');
const logger = require('../utility/logger');

function startJMeterSlave(ip, serverPort, port, callback) {
    logger.info(`Checking port ${serverPort} availability for slave on ${ip}...`);
    checkPortAvailability(ip, serverPort, (err) => {
        if (err) {
            logger.error(`Port check failed: ${err.message}`);
            return callback(err);
        }
        logger.info(`Starting slave on IP: ${ip}, Port: ${port}`);
        const slaveCommand = `cd ${config.jmeterDir}/bin && \
        nohup ./jmeter-server -Dserver_port=${serverPort} -Djava.rmi.server.hostname=${ip} -Dserver.rmi.localport=${port} -Dserver.rmi.port=${serverPort} > ${config.jmeterDir}/bin/jmeter-server.log 2>&1 & disown & sleep 5`;
        executeBackgroundCommand(ip, slaveCommand, (err, stdout) => {
            if (err) {
                logger.error(`Error starting slave on ${ip}:`, err);
                return callback(err);
            }
            logger.info(`Slave started successfully on ${ip}:${port}`);
            callback(null, stdout);
        });
    });
}

function checkPortAvailability(ip, port, callback) {
    const findCommand = `netstat -tuln | grep ${port}`;
    const killCommand = `lsof -ti:${port} | xargs -r kill -9`;

    // Check if the port is in use
    executeCommand(ip, findCommand, (err, stdout, stderr) => {
        logger.info("stdout : ", stdout);
        if (err) {
            logger.error("Error executing command:", err.message);
            callback(err);
            return;
        }
        if (stdout && stdout.includes(port)) {
            logger.info(`Port ${port} is in use. Attempting to free it...`);

            // Kill processes using the port
            executeCommand(ip, killCommand, (killErr) => {
                if (killErr) {
                    logger.error(`Failed to kill processes on port ${port}:`, killErr.message);
                    callback(killErr);
                    return;
                }
                logger.info(`Successfully freed port ${port}.`);
                callback(null); // Port is now available
            });
        } else {
            logger.info(`Port ${port} is available.`);
            callback(null); // Port is available
        }
    });
}

module.exports = {startJMeterSlave}