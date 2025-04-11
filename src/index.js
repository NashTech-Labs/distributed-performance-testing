require('./utility/otel'); // Initialize OpenTelemetry
const config = require('../config/config');
const installation = require('./installation/installation');
const updateJMeterProperties = require('./remote/updateJmeterProperties');
const startJMeterSlave = require('./remote/startJmeterSlave');
const configureMaster = require('./remote/configureMaster');
const runTestsOnSlaves = require('./remote/runTestsOnSlaves') ;
const logger = require('./utility/logger');
const installInfluxDB = require('./installation/influxDatabaseInstallation');

async function run() {
    try {
        logger.info('Checking Java installation on master...');
        const masterJavaInstalled = await new Promise((resolve, reject) => {
            installation.checkJava(config.masterIp, (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });
        if (!masterJavaInstalled) {
            logger.info('Installing Java on master...');
            await new Promise((resolve, reject) => {
                installation.installJava(config.masterIp, (err) => {
                    if (err) return reject(err);
                    resolve();
                });
            });
        } else {
            logger.info('Java is already installed on master.');
        }

        logger.info('Checking JMeter installation on master...');
        const masterInstalled = await new Promise((resolve, reject) => {
            installation.checkJMeter(config.masterIp, (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });

        if (!masterInstalled) {
            logger.info('Installing JMeter on master...');
            await new Promise((resolve, reject) => {
                installation.installJMeter(config.masterIp, config.jmeterVersion, (err) => {
                    if (err) return reject(err);
                    logger.info('JMeter installed on master.');
                    resolve();
                });
            });
        } else {
            logger.info('JMeter is already installed on master.');
        }

        /*logger.info('InfluxDB installation on master...');
        await new Promise((resolve, reject) => {
            installInfluxDB.installInfluxDB(config.masterIp, (err, result) => {
                if (err) {
                    console.error('Error:', err);
                    return reject(err); // reject on error
                } else {
                    console.log('Result:', result);
                    resolve(); // resolve when successful
                }
            });
        });

        logger.info('InfluxDB starting on master...');
        await new Promise((resolve, reject) => {
            installInfluxDB.startInfluxDBService(config.masterIp, (err, result) => {
                if (err) {
                    console.error('Error:', err);
                    return reject(err); // reject on error
                } else {
                    console.log('Result:', result);
                    resolve(); // resolve when successful
                }
            });
        });*/

        /*await new Promise((resolve, reject) => {
            installInfluxDB.createJMeterDatabase(config.masterIp, (err, result) => {
                if (err) {
                    console.error('Error:', err);
                    return reject(err); // reject on error
                } else {
                    console.log('Result:', result);
                    resolve(); // resolve when successful
                }
            });
        });*/

        logger.info('Checking Java installation on slaves...');
        for (const slaveIp of config.slaveIps) {
            const slaveJavaInstalled = await new Promise((resolve, reject) => {
                installation.checkJava(slaveIp, (err, result) => {
                    if (err) return reject(err);
                    resolve(result);
                });
            });

            if (!slaveJavaInstalled) {
                logger.info(`Installing Java on slave: ${slaveIp}...`);
                await new Promise((resolve, reject) => {
                    installation.installJava(slaveIp, (err) => {
                        if (err) return reject(err);
                        resolve();
                    });
                });
            } else {
                logger.info(`Java is already installed on slave: ${slaveIp}.`);
            }
        }

        logger.info('Checking JMeter installation on slaves...');
        for (const slaveIp of config.slaveIps) {
            const installed = await new Promise((resolve, reject) => {
                installation.checkJMeter(slaveIp, (err, result) => {
                    if (err) return reject(err);
                    resolve(result);
                });
            });

            if (!installed) {
                logger.info(`Installing JMeter on slave: ${slaveIp}...`);
                await new Promise((resolve, reject) => {
                    installation.installJMeter(slaveIp, config.jmeterVersion, (err) => {
                        if (err) return reject(err);
                        resolve();
                    });
                });
            } else {
                logger.info(`JMeter is already installed on slave: ${slaveIp}.`);
            }
        }

        logger.info('Configuring master with slave IPs...');
        await new Promise((resolve, reject) => {
            configureMaster(config.masterIp, config.slaveIps, (err) => {
                if (err) return reject(err);
                logger.info('Master configured with slave IPs.');
                resolve();
            });
        });

        // Update jmeter.properties on master and slaves
        logger.info('Updating jmeter.properties on master...');
        await new Promise((resolve, reject) => {
            updateJMeterProperties.updateJMeterProperties(config.masterIp, (err) => {
                if (err) return reject(err);
                logger.info('jmeter.properties updated on master.');
                resolve();
            });
        });

        for (const slaveIp of config.slaveIps) {
            logger.info(`Updating jmeter.properties on slave: ${slaveIp}...`);
            await new Promise((resolve, reject) => {
                updateJMeterProperties.updateJMeterProperties(slaveIp, (err) => {
                    if (err) return reject(err);
                    logger.info(`jmeter.properties updated on slave: ${slaveIp}.`);
                    resolve();
                });
            });
        }

        logger.info('Starting JMeter slaves...');
        const slavePorts = [4001];
        const serverPorts = [1099];
        for (let index = 0; index < config.slaveIps.length; index++) {
            logger.info("slaveIps[index]: ", config.slaveIps[index]);
            const slavePort = slavePorts[0];
            const serverPort = serverPorts[0];
            logger.info(`Processing slave ${index + 1} of ${config.slaveIps.length}`);
            await new Promise((resolve, reject) => {
                startJMeterSlave.startJMeterSlave(config.slaveIps[index], serverPort, slavePort, (err) => {
                    if (err) return reject(err);
                    resolve();
                });
            });
        }

        logger.info('Running tests on slaves via master...');
        await new Promise((resolve, reject) => {
            runTestsOnSlaves.runTestsOnSlaves(config.masterIp, (err) => {
                if (err) return reject(err);
                logger.info('Tests started on slaves via master.');
                resolve();
            });
        });

        logger.info('Creating HTML report...');
        await new Promise((resolve, reject) => {
            runTestsOnSlaves.createHtmlReport(config.masterIp, (err) => {
                if (err) return reject(err);
                resolve();
            });
        });

        logger.info('Copy jmeter reports...');
        for (let index = 0; index < config.slaveIps.length; index++) {

            await new Promise((resolve, reject) => {
                runTestsOnSlaves.copyJmeterSlaveLogsToMaster(config.slaveIps[index], (err) => {
                    if (err) return reject(err);
                    resolve();
                });
            });
        }
        logger.info('Execution completed');
    } catch (error) {
        console.error('Error during execution:', error);
    }
}

run();