import { NodeSDK } from '@opentelemetry/sdk-node';
import { Resource } from '@opentelemetry/resources';
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import pino from 'pino';

const SERVICE_NAME = process.env.SERVICE_NAME || 'order-service';
const SERVICE_VERSION = process.env.SERVICE_VERSION || '1.0.0';

export function initializeTracing() {
  const bootstrapLogger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport:
      process.env.NODE_ENV !== 'production'
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:dd-mm-yyyy HH:MM:ss',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
  });
  const resource = new Resource({
    [ATTR_SERVICE_NAME]: SERVICE_NAME,
    [ATTR_SERVICE_VERSION]: SERVICE_VERSION,
  });
  const isProduction = process.env.NODE_ENV === 'production';
  const jaegerEndpoint =
    process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces';
  const traceExporter =
    isProduction && process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT
      ? new OTLPTraceExporter({
          url: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT,
          headers: process.env.OTEL_EXPORTER_OTLP_HEADERS
            ? JSON.parse(process.env.OTEL_EXPORTER_OTLP_HEADERS)
            : {},
        })
      : new JaegerExporter({ endpoint: jaegerEndpoint });
  const sdk = new NodeSDK({
    resource,
    traceExporter,
    instrumentations: [
      new HttpInstrumentation({
        ignoreIncomingRequestHook: (req: any) => {
          const url = req.url || '';
          return (
            url.includes('/favicon.ico') ||
            url.includes('/health') ||
            url.includes('/metrics')
          );
        },
      }),
      new ExpressInstrumentation(),
      new NestInstrumentation(),
    ],
  });
  sdk.start();
  bootstrapLogger.info({ service: SERVICE_NAME }, 'OpenTelemetry initialized');
  bootstrapLogger.info(
    {
      service: SERVICE_NAME,
      exporter: isProduction ? 'OTLP' : 'Jaeger',
      endpoint: isProduction
        ? process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT
        : jaegerEndpoint,
    },
    'Trace exporter configured',
  );
  process.on('SIGTERM', () => {
    sdk
      .shutdown()
      .then(() =>
        bootstrapLogger.info(
          { service: SERVICE_NAME },
          'OpenTelemetry terminated',
        ),
      )
      .catch((error: any) =>
        bootstrapLogger.error(
          { err: error, service: SERVICE_NAME },
          'Error terminating OpenTelemetry',
        ),
      )
      .finally(() => process.exit(0));
  });
  return sdk;
}
export function getServiceName(): string {
  return SERVICE_NAME;
}
export function getServiceVersion(): string {
  return SERVICE_VERSION;
}
