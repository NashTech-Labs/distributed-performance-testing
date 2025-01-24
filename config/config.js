const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') }); // Load .env from the root directory

module.exports = {
    masterIp: process.env.MASTER_IP,
    slaveIps: process.env.SLAVE_IPS.split(','),
    jmeterDir: process.env.JMETER_DIR || '/opt/jmeter',
    jmeterVersion: process.env.JMETER_VERSION,
    testPlanPath: process.env.TEST_PLAN_PATH,
    resultPath: process.env.RESULT_PATH,
    username: process.env.SSH_USERNAME,
    password: process.env.SSH_PASSWORD
};