"use strict";
const axios = require("axios");
const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require("@aws-sdk/client-secrets-manager");
const ProductiveClient = require("./src/productiveClient");
const SlackClient = require("./src/slackClient");

const extractWorkedTime = (res) =>
  res.data.data.map((timeReport) => timeReport.attributes.worked_time);

const fetchConfigurationVariables = async (secretId) => {
  const client = new SecretsManagerClient();
  const command = new GetSecretValueCommand({ SecretId: secretId });
  const response = await client.send(command);
  return JSON.parse(response.SecretString);
};

const getDaysFromEvent = (event) => {
  const eventBody = Buffer.from(event.body, "base64");
  const slackParameters = new URLSearchParams(eventBody.toString("ascii"));
  return parseInt(slackParameters.get("text"), 10);
};

module.exports.slack = async (event) => {
  try {
    const {
      productive_api_key,
      productive_organization_id,
      slack_user_oauth_token,
    } = await fetchConfigurationVariables("slack_app_average_hours");

    const days = getDaysFromEvent(event) || 14;

    const productive = new ProductiveClient(
      productive_api_key,
      productive_organization_id
    );

    const slack = new SlackClient(slack_user_oauth_token);
    const emailAddress = await slack.fetchEmailAddress();

    const hoursPerWorkedDay = await productive.fetchWorkedDays(
      emailAddress,
      days
    );
    const average =
      hoursPerWorkedDay.reduce((a, b) => a + b, 0) / hoursPerWorkedDay.length;

    return {
      statusCode: 200,
      body: `On average you worked ${(average / 60).toFixed(
        1
      )} hours during the last ${hoursPerWorkedDay.length} working days.`,
    };
  } catch (error) {
    let body = "";

    if (axios.isAxiosError(error)) {
      body = JSON.stringify(error.response.data.error);
      if (error.response.status === 401) {
        body = `You're not authorized, probably a missing or wrong Productive api key.`;
      }
    } else {
      console.log(error);
      body = `Something went wrong. The error is logged in CloudWatch with RequestId ${event.requestContext.requestId}.`;
    }

    return {
      statusCode: 200,
      body: body,
    };
  }
};
