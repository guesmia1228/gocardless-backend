const Email = require('email-templates');
const convertHTMLToPDF = require('pdf-puppeteer');
const pug = require('pug');
const { client } = require("../gocardless");
const fs = require('fs');

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
  console.log(JSON.stringify(req.body, null, 4));
  const { events } = req.body;
  for (let event of events) {
    if (event.resource_type === "mandates" && event.action === 'created') {
      const mandate = event.links.mandate;
      const mandate_detail = await client.mandates.find(mandate);
      const bank_account = await client.customerBankAccounts.find(mandate_detail.links.customer_bank_account);
      const customer = await client.customers.find(mandate_detail.links.customer);

      const mandateHTML = pug.renderFile("./template/mandate_pdf.pug", {
        name: `${customer.given_name} ${customer.family_name}`,
        account_number_ending: bank_account.account_number_ending,
        account_holder_name: bank_account.account_holder_name,
        account_type: bank_account.account_type,
        date: mandate_detail.created_at.slice(0,10),
        ip_address: customer.ip_address
      });

      fs.writeFileSync('mandate.html', mandateHTML);

      convertHTMLToPDF(mandateHTML, (pdf) => {
        fs.writeFileSync("./mandate.pdf", pdf);

        const email = new Email({
          message: {
            from: 'test@example.com'
          },
          // uncomment below to send emails in development/test env:
          send: true,
          transport: {
            host: "sandbox.smtp.mailtrap.io",
            port: 587,
            auth: {
              user: "51b7978516f5cf",
              pass: "4f78b0ced7ffe0"
            },
          }
        });

        email
          .send({
            template: 'debit-authorization',
            message: {
              to: customer.email,
              attachments: [
                {
                  filename: "mandate.pdf",
                  content: pdf
                }
              ]
            },
            locals: {
              full_name: `${customer.given_name} ${customer.family_name}`,
              ref: mandate_detail.reference,
              account_number_ending: bank_account.account_number_ending,
              account_type: bank_account.account_type,
            },
          })
          .then(console.log)
          .catch(console.error);
      }, {}, { args: ["--no-sandbox"] });
    } else if (event.resource_type === "payments" && event.action === 'created') {
      const payment = await client.payments.find(event.links.payment);
      const mandate_detail = await client.mandates.find(payment.links.mandate);
      const bank_account = await client.customerBankAccounts.find(mandate_detail.links.customer_bank_account);
      const customer = await client.customers.find(mandate_detail.links.customer);
      const creditor = await client.creditors.find(payment.links.creditor);

      const email = new Email({
        message: {
          from: 'test@example.com'
        },
        // uncomment below to send emails in development/test env:
        send: true,
        transport: {
          host: "sandbox.smtp.mailtrap.io",
          port: 587,
          auth: {
            user: "51b7978516f5cf",
            pass: "4f78b0ced7ffe0"
          },
        }
      });

      email
        .send({
          template: 'debit-payment',
          message: {
            to: customer.email,
            attachments: []
          },
          locals: {
            full_name: `${customer.given_name} ${customer.family_name}`,
            ref: mandate_detail.reference,
            amount: (payment.amount / 100).toFixed(2),
            product: payment.description,
            creditor: creditor.name,
            account_number_ending: bank_account.account_number_ending,
            account_type: bank_account.account_type,
            charge_date: new Date(payment.charge_date).toLocaleDateString('en-us', { year: "numeric", month: "long", day: "numeric" }),
            created_date: new Date(payment.created_at).toLocaleDateString('en-us', { year: "numeric", month: "long", day: "numeric" }),
          },
        })
        .then(console.log)
        .catch(console.error);
    }
  }

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
