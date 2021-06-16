# Average hours

API to calculate the average hours worked on a day. The source is the Productive API.

Endpoint: `POST /average-hours`

The GRRR Slack workspace contains an app with exposes a slash command: `/average-hours [api-key]`.

## Deploy

`npx serverless deploy`

## Local development

`npx serverless invoke local --function slack --path test/slack-command-average-hours.json`
