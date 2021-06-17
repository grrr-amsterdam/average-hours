"use strict";
const axios = require("axios");
const subDays = require("date-fns/subDays");
const format = require("date-fns/format");
const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require("@aws-sdk/client-secrets-manager");

const extractWorkedTime = (res) =>
  res.data.data.map((timeReport) => timeReport.attributes.worked_time);

const fetchTimeEntries = (api, personId, start, end) =>
  api.get(
    `time_reports?filter[person_id]=${personId}&filter[group]=day&filter[after]=${format(
      start,
      "yyyy-MM-dd"
    )}&filter[before]=${format(end, "yyyy-MM-dd")}`
  );

const fetchConfigurationVariables = async (secretId) => {
  const client = new SecretsManagerClient();
  const command = new GetSecretValueCommand({ SecretId: secretId });
  const response = await client.send(command);
  return JSON.parse(response.SecretString);
};

const fetchPerson = async (productiveApi, emailAddress) => {
  const response = await productiveApi.get(
    "people?filter[person_type]=1&filter[status]=1"
  );
  return response.data.data.find(
    (people) => people.attributes.email === emailAddress
  );
};

const initProductiveApi = (productive_api_key, productive_organization_id) =>
  axios.create({
    baseURL: "https://api.productive.io/api/v2/",
    headers: {
      "Content-Type": "application/vnd.api+json",
      "X-Auth-Token": productive_api_key,
      "X-Organization-Id": productive_organization_id,
    },
  });

const initSlackApi = (user_oauth_token) =>
  axios.create({
    baseURL: "https://slack.com/api/",
    headers: {
      Authorization: `Bearer ${user_oauth_token}`,
    },
  });

const fetchSlackProfile = (slackApi) => slackApi.get("users.profile.get");

module.exports.slack = async (event) => {
  try {
    const {
      productive_api_key,
      productive_organization_id,
      slack_user_oauth_token,
    } = await fetchConfigurationVariables("slack_app_average_hours");

    const productiveApi = initProductiveApi(
      productive_api_key,
      productive_organization_id
    );
    const slackApi = initSlackApi(slack_user_oauth_token);

    const slackProfile = await fetchSlackProfile(slackApi);

    const person = await fetchPerson(
      productiveApi,
      slackProfile.data.profile.email
    );

    const now = Date.now();
    const start = subDays(now, 14 + 1);
    const end = subDays(now, 1);

    const timeReports = await fetchTimeEntries(
      productiveApi,
      person.id,
      start,
      end
    );

    const hoursPerWorkedDay = extractWorkedTime(timeReports).filter(
      (hours) => hours > 0
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
