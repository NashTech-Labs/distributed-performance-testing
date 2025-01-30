const executeCommand = require('../commands/executeCommand');
const config = require('../../config/config'); 

function updateJMeterProperties(ip, callback) {
    // const updateCommand = `
    //     echo "server.rmi.ssl.keystore.file=/opt/jmeter/bin/rmi_keystore.jks" >> /opt/jmeter/bin/jmeter.properties && \
    //     echo "server.rmi.ssl.keystore.password=changeit" >> /opt/jmeter/bin/jmeter.properties && \
    //     echo "server.rmi.ssl.truststore.file=/opt/jmeter/bin/rmi_keystore.jks" >> /opt/jmeter/bin/jmeter.properties && \
    //     echo "server.rmi.ssl.truststore.password=changeit" >> /opt/jmeter/bin/jmeter.properties && \
    //     echo "java.rmi.server.hostname=${ip}" >> /opt/jmeter/bin/jmeter.properties
    // `;
    const updateCommand = `
    echo "server.rmi.ssl.disable=true" >> ${config.jmeterDir}/bin/jmeter.properties && \
    echo "java.rmi.server.hostname=${ip}" >> ${config.jmeterDir}/bin/jmeter.properties
`;
    executeCommand(ip, updateCommand, callback);
}

module.exports = { updateJMeterProperties }