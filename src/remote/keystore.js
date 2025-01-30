const executeCommand = require('../commands/executeCommand');
const config = require('../../config/config'); 


// Function to generate rmi_keystore.jks on remote server
function generateRmiKeystore(ip, callback) {
    const deleteCommand = `
        keytool -delete -alias rmi -keystore ${config.jmeterDir}/bin/rmi_keystore.jks -storepass changeit || echo "Alias 'rmi' does not exist, skipping delete.";
    `;
    const generateCommand = `
        ${deleteCommand}
        keytool -genkeypair -alias rmi -keyalg RSA -keystore ${config.jmeterDir}/bin/rmi_keystore.jks -validity 3650 \
        -storepass changeit -keypass changeit -dname "CN=${ip}, OU=JMeter, O=Apache, L=Test, S=State, C=US" && \
        echo "Keystore created successfully on ${ip}";
    `;

    executeCommand(ip, generateCommand, callback);
}

// Function to copy rmi_keystore.jks to remote hosts
function copyRmiKeystore(ip, username, callback) {
    const copyCommand = `scp -o StrictHostKeyChecking=no ${config.jmeterDir}/bin/rmi_keystore.jks ${username}@${ip}:${config.jmeterDir}/bin/`;
    executeCommand(ip, copyCommand, (err, result) => {
        if (err) {
            console.error(`Error copying keystore to ${ip}:`, err);
            return callback(err);
        }
        console.log(`Keystore copied successfully to ${ip}`);
        callback(null, result);
    });
}

module.exports = {
    generateRmiKeystore,
    copyRmiKeystore
};