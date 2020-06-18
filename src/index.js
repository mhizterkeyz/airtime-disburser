const express = require("express");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();

app.use("/api", require("./routes/api"));

app.use("/", express.static(path.resolve(__dirname, "public")));

app.use((err, req, res, next) => {
  const status = err.status || 500;
  if (process.env.NODE_ENV === "development") {
    console.log({ ...err }, err.stack);
  }
  res.status(status).json({
    message: err.message,
    ...err,
  });
});

app.listen(process.env.PORT, () => {
  console.log(`application started on port ${process.env.PORT}`);
});
