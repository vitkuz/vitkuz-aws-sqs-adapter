import {
    SendMessageCommand,
    SendMessageCommandInput,
    SendMessageCommandOutput,
} from '@aws-sdk/client-sqs';
import { SQSContext } from '../types';

export const sendMessage =
    (context: SQSContext) =>
    async (input: SendMessageCommandInput): Promise<SendMessageCommandOutput> => {
        const { client, logger } = context;
        logger?.debug('sendMessage:start', { data: input });
        try {
            const command = new SendMessageCommand(input);
            const result = await client.send(command);
            logger?.debug('sendMessage:success', { data: result });
            return result;
        } catch (error) {
            logger?.debug('sendMessage:error', { error });
            throw error;
        }
    };
