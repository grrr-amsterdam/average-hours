"use strict";

const DEFAULT_DAYS = 14;
const PARAMETER_NAME = "slack_app_average_hours";

const axios = require("axios");
const ProductiveClient = require("./src/productiveClient");
const SlackClient = require("./src/slackClient");

const fetchConfigurationVariables = async () => {
  // Load configuration from Parameter store via cache layer
  const response = await axios.get(
    `http://127.0.0.1:2773/systemsmanager/parameters/get`,
    {
      params: {
        name: PARAMETER_NAME,
        withDecryption: true,
      },
      headers: {
        "X-Aws-Parameters-Secrets-Token": process.env.AWS_SESSION_TOKEN,
      },
    }
  );
  return JSON.parse(response.data.Parameter.Value);
};

const parseSlackEvent = (event) => {
  const eventBody = Buffer.from(event.body, "base64");
  const slackParameters = new URLSearchParams(eventBody.toString("ascii"));
  return {
    days: parseInt(slackParameters.get("text"), 10) || DEFAULT_DAYS,
    user_id: slackParameters.get("user_id"),
  };
};

module.exports.slack = async (event) => {
  try {
    const {
      productive_api_key,
      productive_organization_id,
      slack_user_oauth_token,
    } = await fetchConfigurationVariables();

    const { days, user_id } = parseSlackEvent(event);

    const productive = new ProductiveClient(
      productive_api_key,
      productive_organization_id
    );

    const slack = new SlackClient(slack_user_oauth_token);
    const emailAddress = await slack.fetchEmailAddress(user_id);

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
    console.error(error);

    let body = `Something went wrong. The error is logged in CloudWatch with RequestId ${event.requestContext.requestId}.`;

    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        body = `You're not authorized, check the credentials in parameter "${PARAMETER_NAME}".`;
      }
    }

    return {
      statusCode: 200,
      body: body,
    };
  }
};
