const Counter = require("../models/Counter");

// prefix: "ADM", "STF", "CUS"
const generateCustomId = async (modelName, prefix) => {
  const counter = await Counter.findOneAndUpdate(
    { model: modelName },
    { $inc: { seq: 1 } },
    { returnDocument: "after", upsert: true }
  );

  return `${prefix}-${String(counter.seq).padStart(6, "0")}`;
};

module.exports = generateCustomId;
