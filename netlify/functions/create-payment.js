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
    console.log('Dados recebidos:', JSON.stringify(body, null, 2));

    const { type, amount, description, payer, token, installments, paymentMethodId, docNumber, cardholderName } = body;

    // Validar amount
    if (!amount || amount <= 0) {
      throw new Error('Valor do pagamento inválido');
    }

    let paymentData = {
      transaction_amount: Number(amount),
      description: description || 'Pedido Lanchão Caraguá',
      payer: {
        email: payer.email,
        first_name: payer.first_name || 'Cliente',
        last_name: payer.last_name || '',
        identification: {
          type: 'CPF',
          number: docNumber || '12345678909'
        }
      }
    };

    // ==================== PAGAMENTO PIX ====================
    if (type === 'pix') {
      paymentData.payment_method_id = 'pix';
      
      console.log('Enviando pagamento PIX:', JSON.stringify(paymentData, null, 2));
      
      const response = await mercadopago.payment.create(paymentData);
      
      console.log('Resposta do Mercado Pago:', JSON.stringify(response.body, null, 2));
      
      // Verificar se tem os dados do PIX
      const qrCode = response.body.point_of_interaction?.transaction_data?.qr_code;
      const qrCodeBase64 = response.body.point_of_interaction?.transaction_data?.qr_code_base64;
      
      if (!qrCode) {
        console.error('QR Code não encontrado na resposta');
        throw new Error('Não foi possível gerar o QR Code PIX');
      }
      
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          status: response.body.status,
          status_detail: response.body.status_detail,
          qr_code: qrCode,
          qr_code_base64: qrCodeBase64,
          payment_id: response.body.id,
          transaction_amount: response.body.transaction_amount
        })
      };
    } 
    
    // ==================== PAGAMENTO COM CARTÃO ====================
    else if (type === 'card') {
      if (!token) {
        throw new Error('Token do cartão é obrigatório');
      }
      
      paymentData.token = token;
      paymentData.installments = Number(installments) || 1;
      paymentData.payment_method_id = paymentMethodId || 'visa';
      if (cardholderName) {
        paymentData.cardholder_name = cardholderName;
      }
      
      console.log('Enviando pagamento com cartão:', JSON.stringify(paymentData, null, 2));
      
      const response = await mercadopago.payment.create(paymentData);
      
      console.log('Resposta do cartão:', JSON.stringify(response.body, null, 2));
      
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
    
    else {
      throw new Error(`Tipo de pagamento não suportado: ${type}`);
    }
    
  } catch (error) {
    console.error('Erro detalhado no pagamento:', error);
    
    // Retornar erro detalhado para debug
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        cause: error.cause?.message || error.message,
        status: error.status,
        response: error.response?.data
      })
    };
  }
};
