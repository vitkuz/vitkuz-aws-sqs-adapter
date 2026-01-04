import { SQSClientConfig } from '@aws-sdk/client-sqs';
import { createSQSClient } from './client';
import { Logger } from './types';
import { sendMessage } from './operations/send-message';
import { receiveMessage } from './operations/receive-message';
import { deleteMessage } from './operations/delete-message';
import { sendMessageBatch } from './operations/send-message-batch';
import { sendMessageAll } from './operations/send-message-all';

export const createAdapter = (config: SQSClientConfig, logger?: Logger) => {
    const client = createSQSClient(config);
    const context = { client, logger };

    return {
        client,
        sendMessage: sendMessage(context),
        receiveMessage: receiveMessage(context),
        deleteMessage: deleteMessage(context),
        sendMessageBatch: sendMessageBatch(context),
        sendMessageAll: sendMessageAll(context),
    };
};
