import { SendMessageBatchCommandOutput, SendMessageBatchRequestEntry } from '@aws-sdk/client-sqs';
import { SQSContext } from '../types';
import { sendMessageBatch } from './send-message-batch';
import { chunk } from '../utils';

export interface SendMessageAllInput {
    QueueUrl: string;
    Entries: SendMessageBatchRequestEntry[];
}

export const sendMessageAll =
    (context: SQSContext) =>
    async (input: SendMessageAllInput): Promise<SendMessageBatchCommandOutput[]> => {
        const { logger } = context;
        const { QueueUrl, Entries } = input;
        logger?.debug('sendMessageAll:start', { data: { QueueUrl, count: Entries.length } });

        const chunks = chunk(Entries, 10);
        const results: SendMessageBatchCommandOutput[] = [];

        const sendMessageBatchOp = sendMessageBatch(context);

        try {
            for (const batchEntries of chunks) {
                const result = await sendMessageBatchOp({
                    QueueUrl,
                    Entries: batchEntries,
                });
                results.push(result);
            }
            logger?.debug('sendMessageAll:success', { data: { chunksProcessed: results.length } });
            return results;
        } catch (error) {
            logger?.debug('sendMessageAll:error', { error });
            throw error;
        }
    };
