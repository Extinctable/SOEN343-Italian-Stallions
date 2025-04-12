// server/activities/NetworkActivityFactory.js
const QASession = require("./QASession");
const LivePolling = require("./LivePolling");

class StreamingActivityFactory {
  static createActivity(activityType) {
    switch (activityType) {
      case "qa":
        return new QASession();
      case "poll":
        return new LivePolling();
      default:
        throw new Error(`Unknown activity type: ${activityType}`);
    }
  }
}

module.exports = StreamingActivityFactory;
