require('../utility/otel');
const executeCommand = require('../commands/executeCommand');
const config = require('../../config/config'); 
const logger = require('../utility/logger');

//Function to run tests on slaves via master
function runTestsOnSlaves(ip, callback) {
    const threadPerSlave = calculateSlaveThreads();
    logger.info("threadPerSlave : ", threadPerSlave)
    const command = `${config.jmeterDir}/bin/jmeter -n -r -t ${config.testPlanPath} -l ${config.resultPath} -GtotalThreads=${threadPerSlave} 
    -Jip=${config.masterIp} -Jbucket=${config.influxDbBucket} -Jtoken=${config.influxDbToken} -Jlog_level.jmeter=DEBUG`;
    console.log("COMMAND : ", `${config.jmeterDir}/bin/jmeter -n -r -t ${config.testPlanPath} -l ${config.resultPath} -GtotalThreads=${threadPerSlave} 
        -Jip=${config.masterIp} -Jbucket=${config.influxDbBucket} -Jtoken=${config.influxDbToken} -Jlog_level.jmeter=DEBUG`);
    executeCommand(ip, command, callback);
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

module.exports = { runTestsOnSlaves }