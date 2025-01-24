const executeCommand = require('../commands/executeCommand');
const config = require('../../config/config'); 

//Function to run tests on slaves via master
function runTestsOnSlaves(ip, callback) {
    const command = `${config.jmeterDir}/bin/jmeter -n -r -t ${config.testPlanPath} -l ${config.resultPath}`;
    executeCommand(ip, command, callback);
}

module.exports = { runTestsOnSlaves }