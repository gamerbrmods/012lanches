const mercadopago = require('mercadopago');

mercadopago.configure({
  access_token: 'APP_USR-1334029455771509-040420-36979594d79384a46f840b2a7248226b-358581720' // Use variáveis de ambiente por segurança!
});

exports.handler = async (event, context) => {
  // Libera o acesso (CORS)
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Responde a requisições de pre-flight do navegador
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  try {
    const data = JSON.parse(event.body);
    
    const preference = {
      items: data.items,
      payer: data.payer,
      external_reference: `pedido_${Date.now()}`,
      back_urls: {
        success: 'https://012lanchescaragua.netlify.app/',
        failure: 'https://012lanchescaragua.netlify.app/',
      },
      auto_return: 'approved',
    };

    const response = await mercadopago.preferences.create(preference);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ init_point: response.body.init_point })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
