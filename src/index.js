const config = require('../config/config');
const installation = require('./installation/installation');
const updateJMeterProperties = require('./remote/updateJmeterProperties');
const startJMeterSlave = require('./remote/startJmeterSlave');
const configureMaster = require('./remote/configureMaster');
const runTestsOnSlaves = require('./remote/runTestsOnSlaves') ;

async function run() {
    try {
        console.log('Checking Java installation on master...');
        const masterJavaInstalled = await new Promise((resolve, reject) => {
            installation.checkJava(config.masterIp, (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });
        if (!masterJavaInstalled) {
            console.log('Installing Java on master...');
            await new Promise((resolve, reject) => {
                installation.installJava(config.masterIp, (err) => {
                    if (err) return reject(err);
                    console.log('Java installed on master.');
                    resolve();
                });
            });
        } else {
            console.log('Java is already installed on master.');
        }

        console.log('Checking JMeter installation on master...');
        const masterInstalled = await new Promise((resolve, reject) => {
            installation.checkJMeter(config.masterIp, (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });

        if (!masterInstalled) {
            console.log('Installing JMeter on master...');
            await new Promise((resolve, reject) => {
                installation.installJMeter(config.masterIp, config.jmeterVersion, (err) => {
                    if (err) return reject(err);
                    console.log('JMeter installed on master.');
                    resolve();
                });
            });
        } else {
            console.log('JMeter is already installed on master.');
        }

        console.log('Checking Java installation on slaves...');
        for (const slaveIp of config.slaveIps) {
            const slaveJavaInstalled = await new Promise((resolve, reject) => {
                installation.checkJava(slaveIp, (err, result) => {
                    if (err) return reject(err);
                    resolve(result);
                });
            });

            if (!slaveJavaInstalled) {
                console.log(`Installing Java on slave: ${slaveIp}...`);
                await new Promise((resolve, reject) => {
                    installation.installJava(slaveIp, (err) => {
                        if (err) return reject(err);
                        console.log(`Java installed on slave: ${slaveIp}.`);
                        resolve();
                    });
                });
            } else {
                console.log(`Java is already installed on slave: ${slaveIp}.`);
            }
        }

        console.log('Checking JMeter installation on slaves...');
        for (const slaveIp of config.slaveIps) {
            const installed = await new Promise((resolve, reject) => {
                installation.checkJMeter(slaveIp, (err, result) => {
                    if (err) return reject(err);
                    resolve(result);
                });
            });

            if (!installed) {
                console.log(`Installing JMeter on slave: ${slaveIp}...`);
                await new Promise((resolve, reject) => {
                    installation.installJMeter(slaveIp, config.jmeterVersion, (err) => {
                        if (err) return reject(err);
                        console.log(`JMeter installed on slave: ${slaveIp}.`);
                        resolve();
                    });
                });
            } else {
                console.log(`JMeter is already installed on slave: ${slaveIp}.`);
            }
        }

        console.log('Configuring master with slave IPs...');
        await new Promise((resolve, reject) => {
            configureMaster(config.masterIp, config.slaveIps, (err) => {
                if (err) return reject(err);
                console.log('Master configured with slave IPs.');
                resolve();
            });
        });

        // Update jmeter.properties on master and slaves
        console.log('Updating jmeter.properties on master...');
        await new Promise((resolve, reject) => {
            updateJMeterProperties.updateJMeterProperties(config.masterIp, (err) => {
                if (err) return reject(err);
                console.log('jmeter.properties updated on master.');
                resolve();
            });
        });

        for (const slaveIp of config.slaveIps) {
            console.log(`Updating jmeter.properties on slave: ${slaveIp}...`);
            await new Promise((resolve, reject) => {
                updateJMeterProperties.updateJMeterProperties(slaveIp, (err) => {
                    if (err) return reject(err);
                    console.log(`jmeter.properties updated on slave: ${slaveIp}.`);
                    resolve();
                });
            });
        }

        console.log('Starting JMeter slaves...');
        const slavePorts = [4001, 4002];
        const serverPorts = [1099, 1100];
        for (let index = 0; index < config.slaveIps.length; index++) {
            console.log("slaveIps[index]: ", config.slaveIps[index]);
            const slavePort = slavePorts[index];
            const serverPort = serverPorts[index];
            console.log(`Processing slave ${index + 1} of ${config.slaveIps.length}`);
            await new Promise((resolve, reject) => {
                startJMeterSlave.startJMeterSlave(config.slaveIps[index], serverPort, slavePort, (err) => {
                    if (err) return reject(err);
                    resolve();
                });
            });
        }

        console.log('Running tests on slaves via master...');
        await new Promise((resolve, reject) => {
            runTestsOnSlaves.runTestsOnSlaves(config.masterIp, (err) => {
                if (err) return reject(err);
                console.log('Tests started on slaves via master.');
                resolve();
            });
        });

        console.log('Execution completed successfully!');
    } catch (error) {
        console.error('Error during execution:', error);
    }
}

run();