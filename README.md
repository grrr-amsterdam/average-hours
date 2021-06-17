# Average hours

API to calculate the average hours worked on a day. The source is the Productive API.

Endpoint: `POST /average-hours`

The GRRR Slack workspace contains an app with exposes a slash command: `/average-hours [api-key]`.

## Known issues and improvements

- The Productive API calls are paginated, but this app doesn't support that. So a high amount of days will be cut off.
- The Slack and Productive API are functions right now. Seperate classes would make the code more readable.
- No CI with auto deploy and Prettier.
- Sentry monitoring is missing.

## Local development

Activate your personal AWS profile. Serverless will create a assume role for the Lambda function.

`npx serverless invoke local --function slack --path test/slack-command-average-hours-20-days.json`

## Deploy

The Lamdba function is currently running in GRRR AWS account.

`npx serverless deploy`
