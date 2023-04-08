# Average hours

> **Note**  
> Moved to [grrr-amsterdam/grrr-bot](https://github.com/grrr-amsterdam/grrr-bot).

API to calculate the average hours worked on a day. The source is the Productive API.

Endpoint: `POST /average-hours`

The GRRR Slack workspace contains [an app with slash command](https://api.slack.com/apps/A025F8AJ7KN/slash-commands?): `/average-hours [days]`.

The Lambda function uses a cache layer to make Parameter Store parameters available in the function:[docs](https://docs.aws.amazon.com/systems-manager/latest/userguide/ps-integration-lambda-extensions.html).

## Known issues and improvements

- Doesn't run locally because it depends on a cache layer which loads the configuration files upfront.
- No CI with auto deploy and Prettier.
- Sentry monitoring is missing.

## Local development

Checkout the code and run `npm install`.

This Lambda function uses a cache layer to fetch the configuration for Parameter Store upon starting the Lambda function. The configuration isn't loaded at runtime.

~~Activate your personal AWS profile. Serverless will create a assume role for the Lambda function.~~

`# npx serverless invoke local --function slack --path test/slack-command-average-hours-20-days.json`

## Deploy

The Lamdba function is currently running in GRRR AWS account.

`npx serverless deploy`
