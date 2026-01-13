const NoPrefix = require("../models/NoPrefixSchema");

async function hasNoPrefix(userId) {
  const data = await NoPrefix.findOne({ userId });
  if (!data) return false;

  if (!data.expireAt || data.expireAt <= Date.now()) {
    // expired → remove entry
    await NoPrefix.deleteOne({ userId });
    return false;
  }

  return true; // still active
}

module.exports = hasNoPrefix;
