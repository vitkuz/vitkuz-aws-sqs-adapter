import { SQSClient, SQSClientConfig } from '@aws-sdk/client-sqs';

export const createSQSClient = (config: SQSClientConfig): SQSClient => {
    return new SQSClient(config);
};
