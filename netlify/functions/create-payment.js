const mercadopago = require('mercadopago');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  try {
    mercadopago.configure({
      access_token: process.env.MP_ACCESS_TOKEN
    });

    const body = JSON.parse(event.body);
    const { type, amount, description, payer, token, installments, paymentMethodId, docNumber, cardholderName } = body;

    let paymentData = {
      transaction_amount: Number(amount),
      description: description,
      payment_method_id: paymentMethodId,
      payer: {
        email: payer.email,
        first_name: payer.first_name,
        last_name: payer.last_name,
        identification: {
          type: 'CPF',
          number: docNumber
        }
      }
    };

    // Para PIX
    if (type === 'pix') {
      paymentData.payment_method_id = 'pix';
      const response = await mercadopago.payment.create(paymentData);
      
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          status: response.body.status,
          status_detail: response.body.status_detail,
          qr_code: response.body.point_of_interaction?.transaction_data?.qr_code,
          qr_code_base64: response.body.point_of_interaction?.transaction_data?.qr_code_base64,
          payment_id: response.body.id
        })
      };
    } 
    // Para Cartão de Crédito/Débito
    else if (type === 'card') {
      paymentData.token = token;
      paymentData.installments = Number(installments);
      paymentData.cardholder_name = cardholderName;
      
      const response = await mercadopago.payment.create(paymentData);
      
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          status: response.body.status,
          status_detail: response.body.status_detail,
          payment_id: response.body.id,
          card: {
            last_four_digits: response.body.card?.last_four_digits,
            first_six_digits: response.body.card?.first_six_digits,
            expiration_month: response.body.card?.expiration_month,
            expiration_year: response.body.card?.expiration_year
          }
        })
      };
    }
    
  } catch (error) {
    console.error('Erro no pagamento:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        cause: error.cause || 'Erro ao processar pagamento'
      })
    };
  }
};
