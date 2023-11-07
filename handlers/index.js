const { client } = require("../gocardless");

const checkout = async (req, res) => {
  try {
    const billingRequest = await client.billingRequests.create({
      mandate_request: {
        scheme: "ach",
        currency: "USD",
      },
      metadata: {
        description: "ABC Service",
        amount: "5000",
        isOneOff: "true",
      },
    });

    return res.json(billingRequest);
  } catch (e) {
    console.log(e);
    return res.status(500).json(e);
  }
};

const collectCustomerDetails = async (req, res) => {
  const br = req.params.id;

  data = req.body;

  try {
    const response = await client.billingRequests.collectCustomerDetails(br, {
      customer: data.customer,
      customer_billing_detail: {
        ...data.customer_billing_detail,
        ip_address: "207.148.3.121",
      },
    });

    return res.json(response);
  } catch (e) {
    return res.status(500).json(e);
  }
};

const collectBankDetails = async (req, res) => {
  const br = req.params.id;

  const { account_number, bank_code, account_holder_name, account_type } =
    req.body;

  try {
    const response = await client.billingRequests.collectBankAccount(br, {
      account_number: account_number,
      bank_code: bank_code,
      account_holder_name: account_holder_name,
      account_type,
      country_code: "US",
    });

    return res.json(response);
  } catch (e) {
    console.log(e);
    return res.status(500).json(e.message);
  }
};

const getBillingRequest = async (req, res) => {
  const brId = req.params.id;

  try {
    const billingRequest = await client.billingRequests.find(brId);

    res.json(billingRequest);
  } catch (e) {
    res.status(500).json(e);
  }
};

const confirm = async (req, res) => {
  const brId = req.params.id;

  try {
    const billingRequest = await client.billingRequests.confirmPayerDetails(
      brId
    );

    res.json(billingRequest);
  } catch (e) {
    res.status(500).json(e);
  }
};

const fulfil = async (req, res) => {
  const brId = req.params.id;

  try {
    const billingRequest = await client.billingRequests.fulfil(brId);
    await client.payments.create({
      amount: 5000,
      currency: "USD",
      links: {
        mandate: billingRequest.links.mandate_request_mandate,
      },
      description: "ABC Service",
    });

    res.json(billingRequest);
  } catch (e) {
    res.status(500).json(e);
  }
};

const paymentInfo = async (req, res) => {
  res.json({
    amount: 50,
    name: "ABC Service",
    isOneOff: true,
  });
};

const webhooks = async (req, res) => {
  console.log(req.body);

  return res.json("okay");
}

module.exports = {
  checkout,
  getBillingRequest,
  collectCustomerDetails,
  collectBankDetails,
  confirm,
  fulfil,
  paymentInfo,
  webhooks
};
