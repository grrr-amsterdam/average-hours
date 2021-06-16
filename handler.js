"use strict";
const axios = require("axios");

const extractPersonId = (res) => res.data.data[0].relationships.person.data.id;

const sumTimeEntries = (res) =>
  res.data.data.reduce((sum, timeEntry) => sum + timeEntry.attributes.time, 0);

const fetchDay = (api, personId, date) =>
  api.get(
    `time_entries?filter[person_id]=${personId}&filter[after]=${date}&filter[before]=${date}`
  );

module.exports.hello = async (event) => {
  const api = axios.create({
    baseURL: "https://api.productive.io/api/v2/",
    headers: {
      "Content-Type": "application/vnd.api+json",
      "X-Auth-Token": event.pathParameters.api_key,
      "X-Organization-Id": 1376,
    },
  });

  const organizationResponse = await api.get("organization_memberships");

  const personId = extractPersonId(organizationResponse);

  const timeEntriesPerDay = await Promise.all([
    fetchDay(api, personId, "2021-06-15"),
    fetchDay(api, personId, "2021-06-16"),
  ]);

  const hoursPerDay = timeEntriesPerDay.map(sumTimeEntries);

  const average = hoursPerDay.reduce((a, b) => a + b, 0) / hoursPerDay.length;

  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        average: average / 60,
      },
      null,
      2
    ),
  };

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};
