import {
    DeleteMessageCommand,
    DeleteMessageCommandInput,
    DeleteMessageCommandOutput,
} from '@aws-sdk/client-sqs';
import { SQSContext } from '../types';

export const deleteMessage =
    (context: SQSContext) =>
    async (input: DeleteMessageCommandInput): Promise<DeleteMessageCommandOutput> => {
        const { client, logger } = context;
        logger?.debug('deleteMessage:start', { data: input });
        try {
            const command = new DeleteMessageCommand(input);
            const result = await client.send(command);
            logger?.debug('deleteMessage:success', { data: result });
            return result;
        } catch (error) {
            logger?.debug('deleteMessage:error', { error });
            throw error;
        }
    };
