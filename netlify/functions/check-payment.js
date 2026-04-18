const mercadopago = require('mercadopago');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  try {
    mercadopago.configure({
      access_token: process.env.MP_ACCESS_TOKEN
    });

    const paymentId = event.queryStringParameters.id;
    const response = await mercadopago.payment.get(paymentId);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: response.body.status,
        status_detail: response.body.status_detail
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
