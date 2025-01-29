const { NodeSDK } = require('@opentelemetry/sdk-node');
const { ConsoleSpanExporter } = require('@opentelemetry/sdk-trace-node');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');
const { ExpressInstrumentation } = require('@opentelemetry/instrumentation-express');

const sdk = new NodeSDK({
    resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: 'distributed-performance-testing',
    }),
    traceExporter: new ConsoleSpanExporter(), // Use OTLP exporter in production
    instrumentations: [
        new HttpInstrumentation(),
        new ExpressInstrumentation(),
    ],
});

// Properly start the SDK
sdk.start();

// Graceful shutdown on exit
process.on('SIGTERM', async () => {
    await sdk.shutdown();
    console.log('OpenTelemetry shut down gracefully');
    process.exit(0);
});

module.exports = sdk;
