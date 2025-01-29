const executeCommand = require('../commands/executeCommand');
const config = require('../../config/config'); 

//Function to run tests on slaves via master
function runTestsOnSlaves(ip, callback) {
    const threadPerSlave = calculateSlaveThreads();
    console.log("threadPerSlave : ", threadPerSlave)
    const command = `${config.jmeterDir}/bin/jmeter -n -r -t ${config.testPlanPath} -l ${config.resultPath} -GtotalThreads=${threadPerSlave}`;
    executeCommand(ip, command, callback);
}

function calculateSlaveThreads() {
    if (config.slaveIps) {
        console.log('config.slaveIps ', config.slaveIps)
        const numberOfSlaves = config.slaveIps.length; // Count the array length
        console.log(`Number of slaves: ${numberOfSlaves}`);
        const slaveThreads = (config.numberOfThreads)/numberOfSlaves;
        return slaveThreads;
    } else {
        console.log('No SLAVE_IPS defined in .env file.');
    }
    
}

module.exports = { runTestsOnSlaves }