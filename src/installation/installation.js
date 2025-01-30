const executeCommand = require('../commands/executeCommand');
const config = require('../../config/config'); 


// Function to check JMeter installation
function checkJMeter(ip, callback) {
    const checkCommand = `which jmeter || echo "not found"`;
    executeCommand(ip, checkCommand, (err, result) => {
        if (err) {
            callback(err);
            return;
        }
        if (result === 'not found') {
            callback(null, false); // JMeter is not installed
        } else {
            callback(null, true); // JMeter is installed
        }
    });
}

// Function to check Java installation
function checkJava(ip, callback) {
    const checkCommand = `java -version 2>&1 || echo "not found"`;
    executeCommand(ip, checkCommand, (err, result) => {
        if (err) {
            callback(err);
            return;
        }
        if (result.includes('not found')) {
            callback(null, false); // Java is not installed
        } else {
            callback(null, true); // Java is installed
        }
    });
}

// Function to install Java
function installJava(ip, callback) {
    const installCommand = `
        apt-get update && \
        apt-get install -y openjdk-11-jdk && \
        echo "JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64" >> ~/.bashrc && \
        echo "JRE_HOME=\$JAVA_HOME" >> ~/.bashrc && \
        source ~/.bashrc && \
        echo "Java installed successfully"
    `;
    executeCommand(ip, installCommand, callback);
}

// Function to install JMeter
function installJMeter(ip, jmeterVersion, callback) {
    const installCommand = `
        wget https://archive.apache.org/dist/jmeter/binaries/apache-jmeter-${jmeterVersion}.tgz -O /tmp/apache-jmeter-${jmeterVersion}.tgz && \
        tar -xvzf /tmp/apache-jmeter-${jmeterVersion}.tgz -C /opt && \
        rm /tmp/apache-jmeter-${jmeterVersion}.tgz && \
        ln -s /opt/apache-jmeter-${jmeterVersion} ${config.jmeterDir} && \
        echo "JMeter installed successfully"
    `;
    executeCommand(ip, installCommand, callback);
}

module.exports = {
    checkJMeter,
    checkJava,
    installJava,
    installJMeter
};