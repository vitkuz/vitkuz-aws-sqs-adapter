import { SQSClient } from '@aws-sdk/client-sqs';

export interface Logger {
    debug: (message: string, context?: { error?: any; data?: any }) => void;
    [key: string]: any;
}

export interface SQSContext {
    client: SQSClient;
    logger?: Logger;
}
