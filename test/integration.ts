import {
    CloudFormationClient,
    DescribeStackResourcesCommand,
} from '@aws-sdk/client-cloudformation';
import { CloudWatchLogsClient, FilterLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs';
import type { FilterLogEventsCommandOutput } from '@aws-sdk/client-cloudwatch-logs';
import { createSQSClient, sendMessage } from '../src/index';
import { createLogger } from '@vitkuz/aws-logger';
import * as crypto from 'crypto';

const STACK_NAME = 'vitkuz-testing-sqs';
const REGION = process.env.AWS_REGION || 'us-east-1';

const getStackResources = async () => {
    const cf = new CloudFormationClient({ region: REGION });
    const command = new DescribeStackResourcesCommand({ StackName: STACK_NAME });
    const response = await cf.send(command);

    if (!response.StackResources) throw new Error('No resources found');

    const queue = response.StackResources.find((r) => r.ResourceType === 'AWS::SQS::Queue');
    const lambda = response.StackResources.find(
        (r) =>
            r.ResourceType === 'AWS::Lambda::Function' &&
            r.LogicalResourceId?.includes('SqsHandler'),
    );

    if (!queue?.PhysicalResourceId || !lambda?.PhysicalResourceId) {
        throw new Error('Could not find Queue URL or Lambda Function Name in stack resources');
    }

    return {
        queueUrl: queue.PhysicalResourceId,
        logGroupName: `/aws/lambda/${lambda.PhysicalResourceId}`,
    };
};

const waitForLogs = async (
    logGroupName: string,
    searchString: string,
    timeoutMs = 20000,
): Promise<boolean> => {
    const logs = new CloudWatchLogsClient({ region: REGION });
    const startTime = Date.now();

    console.log(`Polling logs in ${logGroupName} for "${searchString}"...`);

    while (Date.now() - startTime < timeoutMs) {
        try {
            // Search last 1 minute of logs
            const command = new FilterLogEventsCommand({
                logGroupName,
                filterPattern: `"${searchString}"`,
                startTime: Date.now() - 60000,
            });

            const events: FilterLogEventsCommandOutput = await logs.send(command);

            if (events.events && events.events.length > 0) {
                console.log('✅ Found matching log events:');
                events.events.forEach((e) =>
                    console.log(`  [${new Date(e.timestamp!).toISOString()}] ${e.message}`),
                );
                return true;
            }
        } catch (error: any) {
            console.warn(`Error polling logs: ${error.message}`);
        }

        await new Promise((r) => setTimeout(r, 2000));
    }

    return false;
};

const run = async () => {
    try {
        console.log('🔍 Discovering Stack Resources...');
        const { queueUrl, logGroupName } = await getStackResources();
        console.log(`  Queue URL: ${queueUrl}`);
        console.log(`  Log Group: ${logGroupName}`);

        const testId = crypto.randomUUID();
        const requestId = crypto.randomUUID();
        const messageBody = {
            test: 'integration-test',
            timestamp: new Date().toISOString(),
            id: testId,
        };

        console.log(`\n🚀 Sending SQS Message (ID: ${testId}, RequestID: ${requestId})...`);
        const client = createSQSClient({ region: REGION });
        const logger = createLogger();

        // Use the adapter's functional style
        const result = await sendMessage({ client, logger })({
            QueueUrl: queueUrl,
            MessageBody: JSON.stringify(messageBody),
            MessageAttributes: {
                'x-request-id': {
                    DataType: 'String',
                    StringValue: requestId,
                },
            },
        });
        console.log(`  Sent MessageId: ${result.MessageId}`);

        console.log('\n⏳ Waiting for Lambda to process...');
        // We verify the logs contain the custom Request ID, proving it was passed and logged
        const success = await waitForLogs(logGroupName, requestId);

        if (success) {
            console.log('\n✅ Integration Test Passed!');
            process.exit(0);
        } else {
            console.error('\n❌ Verified Failed: Log not found within timeout.');
            process.exit(1);
        }
    } catch (error) {
        console.error('Integration test failed:', error);
        process.exit(1);
    }
};

run();
