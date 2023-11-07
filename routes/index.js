const express = require("express");
const {
  checkout,
  getBillingRequest,
  collectCustomerDetails,
  collectBankDetails,
  fulfil,
  confirm,
  paymentInfo,
  createPayment,
  webhooks,
} = require("../handlers");

const router = express.Router();

router.post("/billing-requests", checkout);
router.get("/billing-requests/:id", getBillingRequest);
router.post(
  "/billing-requests/:id/collect-customer-details",
  collectCustomerDetails
);
router.post("/billing-requests/:id/collect-bank-account", collectBankDetails);
router.post("/billing-requests/:id/confirm", confirm);
router.post("/billing-requests/:id/fulfil", fulfil);
router.get("/payment-info", paymentInfo);

router.post("/webhooks", webhooks);

module.exports = router;
