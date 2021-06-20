"use strict";

const axios = require("axios");

module.exports = class SlackClient {
  constructor(user_oauth_token) {
    this.client = axios.create({
      baseURL: "https://slack.com/api/",
      timeout: 1500,
      headers: {
        Authorization: `Bearer ${user_oauth_token}`,
      },
    });
  }

  async fetchEmailAddress() {
    const slackProfile = await this.client.get("users.profile.get");
    return slackProfile.data.profile.email;
  }
};
