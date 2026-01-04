import {
    ReceiveMessageCommand,
    ReceiveMessageCommandInput,
    ReceiveMessageCommandOutput,
} from '@aws-sdk/client-sqs';
import { SQSContext } from '../types';

export const receiveMessage =
    (context: SQSContext) =>
    async (input: ReceiveMessageCommandInput): Promise<ReceiveMessageCommandOutput> => {
        const { client, logger } = context;
        logger?.debug('receiveMessage:start', { data: input });
        try {
            const command = new ReceiveMessageCommand(input);
            const result = await client.send(command);
            logger?.debug('receiveMessage:success', {
                data: { messageCount: result.Messages?.length },
            });
            return result;
        } catch (error) {
            logger?.debug('receiveMessage:error', { error });
            throw error;
        }
    };
