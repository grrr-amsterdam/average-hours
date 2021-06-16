"use strict";
const axios = require("axios");
const subDays = require("date-fns/subDays");
const format = require("date-fns/format");

const extractPersonId = (res) => res.data.data[0].relationships.person.data.id;

const extractWorkedTime = (res) =>
  res.data.data.map((timeReport) => timeReport.attributes.worked_time);

const fetchTimeEntries = (api, personId, start, end) =>
  api.get(
    `time_reports?filter[person_id]=${personId}&filter[group]=day&filter[after]=${format(
      start,
      "yyyy-MM-dd"
    )}&filter[before]=${format(end, "yyyy-MM-dd")}`
  );

const fetchOrganizationMemberships = (api) =>
  api.get("organization_memberships");

module.exports.slack = async (event) => {
  try {
    const eventBody = Buffer.from(event.body, "base64");

    const slackParameters = new URLSearchParams(eventBody.toString("ascii"));

    const api = axios.create({
      baseURL: "https://api.productive.io/api/v2/",
      headers: {
        "Content-Type": "application/vnd.api+json",
        "X-Auth-Token": slackParameters.get("text"),
        "X-Organization-Id": 1376,
      },
    });

    const personId = extractPersonId(await fetchOrganizationMemberships(api));

    const now = Date.now();
    const start = subDays(now, 14 + 1);
    const end = subDays(now, 1);

    const timeReports = await fetchTimeEntries(api, personId, start, end);

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
