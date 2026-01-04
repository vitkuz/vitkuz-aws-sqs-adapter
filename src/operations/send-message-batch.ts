import {
    SendMessageBatchCommand,
    SendMessageBatchCommandInput,
    SendMessageBatchCommandOutput,
} from '@aws-sdk/client-sqs';
import { SQSContext } from '../types';

export const sendMessageBatch =
    (context: SQSContext) =>
    async (input: SendMessageBatchCommandInput): Promise<SendMessageBatchCommandOutput> => {
        const { client, logger } = context;
        logger?.debug('sendMessageBatch:start', { data: input });
        try {
            const command = new SendMessageBatchCommand(input);
            const result = await client.send(command);
            logger?.debug('sendMessageBatch:success', { data: result });
            return result;
        } catch (error) {
            logger?.debug('sendMessageBatch:error', { error });
            throw error;
        }
    };
