# Average hours

API to calculate the average hours worked on a day. The source is the Productive API.

Endpoint: `POST /average-hours`

The GRRR Slack workspace contains an app with exposes a slash command: `/average-hours [api-key]`.

## Local development

Activate your personal AWS profile. Serverless will create a assume role for the Lambda function.

`npx serverless invoke local --function slack --path test/slack-command-average-hours-20-days.json`

## Deploy

`npx serverless deploy`
