const router = require("express").Router();
const _ = require("lodash");
const xlsxFile = require("read-excel-file/node");
const path = require("path");
const fs = require("fs");

router.use(require("body-parser").json());

router.post("/", async (req, res, next) => {
  try {
    // Get authentication
    const credentials = {
      apiKey: process.env.apiKey, // use your sandbox app API key for development in the test environment
      username: process.env.username, // use 'sandbox' for development in the test environment
    };

    const AfricasTalking = require("africastalking")(credentials);

    const airtime = AfricasTalking.AIRTIME;

    if (!Array.isArray(req.body.recipients) || !req.body.recipients) {
      return res.status(422).json({
        message: "recipients must be an array",
        status: 422,
        data: req.body,
      });
    }
    const recipients = req.body.recipients.reduce(
      (acc, cur) => [
        ...acc,
        {
          phoneNumber: cur.phoneNumber,
          currencyCode: cur.currencyCode,
          amount: cur.amount,
        },
      ],
      []
    );
    const options = { recipients };
    let data = await airtime.send(options);
    const responses = _.merge(req.body.recipients, data.responses);
    res.status(200).json({
      message: "airtime data:",
      status: 200,
      numSent: data.numSent,
      responses,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/spreadsheet", async (req, res, next) => {
  try {
    const { base64 } = req.body;
    const buff = Buffer.from(base64, "base64");
    const fileName = path.resolve(__dirname, "excelFile.xlsx");
    fs.writeFileSync(fileName, buff);

    let data = await xlsxFile(fileName);
    data = data.reduce(
      (acc, cur) => [
        ...acc,
        {
          username: cur[0],
          phoneNumber: cur[1],
          currencyCode: cur[2],
          amount: cur[3],
        },
      ],
      []
    );
    res.status(200).json({
      message: "data:",
      status: 200,
      data,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
