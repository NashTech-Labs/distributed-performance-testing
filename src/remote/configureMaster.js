const executeCommand = require('../commands/executeCommand');
const config = require('../../config/config');

function configureMaster(ip, remoteHosts, callback) {
    const configFile = `${config.jmeterDir}/bin/jmeter.properties`;
    const remoteHostsLine = `remote_hosts=${remoteHosts.join(',')}`;
    const command = `echo "${remoteHostsLine}" >> ${configFile}`;
    executeCommand(ip, command, callback);
}

module.exports = configureMaster;