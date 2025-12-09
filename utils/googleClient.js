const { google } = require('googleapis');

function getOAuthClient(coach) {
  if (!coach.googleTokens || !coach.googleTokens.refresh_token) {
    throw new Error("Coach Google Calendar not connected");
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    refresh_token: coach.googleTokens.refresh_token
  });

  return oauth2Client;
}

module.exports = { getOAuthClient };
