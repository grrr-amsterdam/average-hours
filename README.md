# Average hours

API to calculate the average hours worked on a day. The source is the Productive API.

Endpoint: `POST /average-hours`

The GRRR Slack workspace contains an app with exposes a slash command: `/average-hours [days]`.

The Lambda function uses a Go written cache layer: [docs](https://aws.amazon.com/blogs/compute/caching-data-and-configuration-settings-with-aws-lambda-extensions/).

## Known issues and improvements

- Doesn't run locally because it depends on a cache layer which loads the configuration files upfront.
- No CI with auto deploy and Prettier.
- Sentry monitoring is missing.

## Local development

This Lambda function uses a cache layer to fetch the configuration for Parameter Store uppon starting the Lambda function. The configuration isn't loaded at runtime.

~~Activate your personal AWS profile. Serverless will create a assume role for the Lambda function.~~

`# npx serverless invoke local --function slack --path test/slack-command-average-hours-20-days.json`

## Deploy

The Lamdba function is currently running in GRRR AWS account.

`npx serverless deploy`
