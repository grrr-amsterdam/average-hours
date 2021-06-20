"use strict";

const axios = require("axios");
const format = require("date-fns/format");
const subDays = require("date-fns/subDays");
const url = require("url");

const PAGE_SIZE = 200;

module.exports = class ProductiveClient {
  constructor(productive_api_key, productive_organization_id) {
    this.client = axios.create({
      baseURL: "https://api.productive.io/api/v2/",
      timeout: 1500,
      headers: {
        "Content-Type": "application/vnd.api+json",
        "X-Auth-Token": productive_api_key,
        "X-Organization-Id": productive_organization_id,
      },
    });
  }

  async fetchPerson(emailAddress) {
    const response = await this.client.get("people", {
      params: {
        "filter[person_type]": 1,
        "filter[status]": 1,
      },
    });
    return response.data.data.find(
      (people) => people.attributes.email === emailAddress
    );
  }

  async fetchWorkedDays(emailAddress, amount) {
    const person = await this.fetchPerson(emailAddress);

    // Skip today
    const end = subDays(Date.now(), 1);

    const params = new url.URLSearchParams({
      "filter[person_id]": person.id,
      "filter[group]": "day",
      "filter[before]": format(end, "yyyy-MM-dd"),
      "page[size]": PAGE_SIZE,
      sort: "-day",
    });
    let next = `time_reports?${params.toString()}`;
    let workedDays = [];

    do {
      const response = await this.client.get(next);
      const { links, data } = response.data;

      const newWorkedDays = data
        .map((timeReport) => timeReport.attributes.worked_time)
        .filter((hours) => hours > 0)
        .slice(0, amount);

      workedDays = workedDays.concat(newWorkedDays);
      amount -= newWorkedDays.length;
      next = links.next;
    } while (next && amount);

    return workedDays;
  }
};
