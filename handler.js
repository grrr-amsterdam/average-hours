"use strict";
const axios = require("axios");

const extractPersonId = (res) => res.data.data[0].relationships.person.data.id;

const sumTimeEntries = (res) =>
  res.data.data.reduce((sum, timeEntry) => sum + timeEntry.attributes.time, 0);

const fetchDay = (api, personId, date) =>
  api.get(
    `time_entries?filter[person_id]=${personId}&filter[after]=${date}&filter[before]=${date}`
  );

module.exports.slack = async (event) => {
  try {
    const eventBody = Buffer.from(event.body, 'base64');

    const slackParameters = new URLSearchParams(eventBody.toString('ascii'));

    const api = axios.create({
      baseURL: "https://api.productive.io/api/v2/",
      headers: {
        "Content-Type": "application/vnd.api+json",
        "X-Auth-Token": slackParameters.get('text'),
        "X-Organization-Id": 1376,
      },
    });

    const organizationResponse = await api.get("organization_memberships");

    const personId = extractPersonId(organizationResponse);

    const days = [
      "2021-06-15",
      "2021-06-16",
    ];

    const timeEntriesPerDay = await Promise.all(days.map((day) => fetchDay(api, personId, day), days));

    const hoursPerDay = timeEntriesPerDay.map(sumTimeEntries);

    const average = hoursPerDay.reduce((a, b) => a + b, 0) / hoursPerDay.length;

    return {
      statusCode: 200,
      body: `On average you worked ${(average / 60).toFixed(1)} hours during the last ${days.length} days.`,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      let body = JSON.stringify(error.response.data.error);
      if (error.response.status === 401) {
        body = `You're not authorized, probably a missing or wrong Productive api key.`;
      }
      return {
        statusCode: 200,
        body: body,
      }
    }
    return {
      statusCode: 500,
      body: error,
    };
  }

};
