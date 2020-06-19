const router = require("express").Router();
const _ = require("lodash");
const xlsxFile = require("read-excel-file/node");
const path = require("path");
const fs = require("fs");
const axios = require("axios");

router.use(require("body-parser").json());

router.post("/", async (req, res, next) => {
  try {
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
          PhoneNumber: cur.PhoneNumber,
          Code: cur.Code,
          Amount: cur.Amount,
          SecretKey: process.env.apiSecretKey,
        },
      ],
      []
    );
    let responses = await Promise.all(
      recipients.map(async (elem) => {
        try {
          const req = await axios.post(
            process.env.apiAirtimePurchaseUrl,
            elem,
            {
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: "Bearer " + process.env.apiPublicKey,
              },
            }
          );
          // console.log(req.data);
          return req.data;
        } catch (error) {
          if (
            error.response &&
            error.response.data &&
            error.response.data.ResponseCode
          ) {
            return {
              message: error.response.data.Message,
              ...JSON.parse(error.config.data),
            };
          }
          throw error;
        }
      })
    );
    responses = _.merge(req.body.recipients, responses);
    return res.status(200).json({
      message: "data",
      status: 200,
      responses,
    });
  } catch (error) {
    if (error.response && error.response.data) {
      return res.status(500).json({
        message: error.response.data.Message,
        status: 500,
      });
    }
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
          PhoneNumber: cur[1],
          Code: cur[2],
          Amount: cur[3],
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
