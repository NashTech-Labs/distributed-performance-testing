require('../utility/otel');
const executeCommand = require('../commands/executeCommand');
const config = require('../../config/config'); 
const logger = require('../utility/logger');
const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14); // YYYYMMDDHHMMSS
const jtlFile = `${config.resultPath}/result_${timestamp}.jtl`;
const htmlReportDir = `${config.resultPath}/html_report_${timestamp}`;

//Function to run tests on slaves via master
function runTestsOnSlaves(ip, callback) {
    const threadPerSlave = calculateSlaveThreads();
    logger.info("threadPerSlave : ", threadPerSlave)
    const command = `${config.jmeterDir}/bin/jmeter -n -r -t ${config.testPlanPath} -l ${jtlFile} -GtotalThreads=${threadPerSlave} 
    -Jip=${config.masterIp} -Jlog_level.jmeter=DEBUG`;
    console.log("COMMAND : ", `${config.jmeterDir}/bin/jmeter -n -r -t ${config.testPlanPath} -l ${jtlFile} -GtotalThreads=${threadPerSlave} 
        -Jip=${config.masterIp} -Jlog_level.jmeter=DEBUG`);
    executeCommand(ip, command, callback);
}

function createHtmlReport(ip, callback) {
    const generateHtmlReportCommand = `chmod 644 ${jtlFile} && ${config.jmeterDir}/bin/jmeter -g ${jtlFile} -o ${htmlReportDir}`
    executeCommand(ip, generateHtmlReportCommand, callback);
}

function calculateSlaveThreads() {
    if (config.slaveIps) {
        logger.info('config.slaveIps ', config.slaveIps)
        const numberOfSlaves = config.slaveIps.length; // Count the array length
        logger.info(`Number of slaves: ${numberOfSlaves}`);
        const slaveThreads = (config.numberOfThreads)/numberOfSlaves;
        return slaveThreads;
    } else {
        logger.info('No SLAVE_IPS defined in .env file.');
    }
    
}

function copyJmeterSlaveLogsToMaster(ip, callback) {
    const remoteScpCommand = `cp ${config.jmeterDir}/bin/jmeter-server.log ${config.resultPath}/jmeter_${ip}.log`;
    executeCommand(ip, remoteScpCommand, (err, result) => {
        if (err) {
            console.error(`Error copying log from slave ${ip} to master ${masterIp}:`, err);
            return callback(err);
        }
        callback(null, result);
    });
}

module.exports = { runTestsOnSlaves, copyJmeterSlaveLogsToMaster, createHtmlReport }