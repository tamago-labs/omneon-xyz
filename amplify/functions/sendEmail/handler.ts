import type { Handler } from 'aws-lambda';
import type { Schema } from "../../data/resource"
// import { env } from '$amplify/env/faucet';

import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const sesClient = new SESClient({ region: "ap-southeast-1" });

export const handler: Schema["SendEmail"]["functionHandler"] = async (event) => {
    const { userId, walletAddress } = event.arguments

    const recipient = userId || "";
    const subject = "Test Subject";
    const body = "Hello this is a test email. Thanks.";

    const command = new SendEmailCommand({
        Source: "hello@omneon.xyz",
        Destination: {
            ToAddresses: [recipient],
        },
        Message: {
            Body: {
                Text: { Data: body },
            },
            Subject: { Data: subject },
        },
    });

    let message

    try {
        const result = await sesClient.send(command);
        message = `Email sent to ${recipient}: ${result.MessageId}`
    } catch (error: any) {
        console.error(`Error sending email to ${recipient}: ${error}`);
        message = `Failed to send email to ${recipient}: ${error?.message}`
    }

    return {
        userId: userId,
        message
    }
}