const mercadopago = require('mercadopago');

// CONFIGURAÇÃO: O Netlify lerá a chave "MP_ACCESS_TOKEN" que você cadastrar no painel deles
mercadopago.configure({
  access_token: process.env.MP_ACCESS_TOKEN 
});

exports.handler = async (event, context) => {
  // Cabeçalhos para permitir que o seu site fale com essa função (CORS)
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Responde a verificações de segurança do navegador
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  // Garante que só aceitamos requisições do tipo POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: 'Método não permitido' })
    };
  }

  try {
    const data = JSON.parse(event.body);

    // Monta a preferência do Mercado Pago
    const preference = {
      items: data.items,
      payer: {
        name: data.payer.name || 'Cliente',
        email: data.payer.email
      },
      external_reference: `pedido_${Date.now()}`,
      back_urls: {
        // Coloque aqui o link do seu site no Netlify
        success: 'https://012lanchescaragua.netlify.app/',
        failure: 'https://012lanchescaragua.netlify.app/',
        pending: 'https://012lanchescaragua.netlify.app/'
      },
      auto_return: 'approved',
      metadata: data.metadata
    };

    // Cria a preferência no Mercado Pago
    const response = await mercadopago.preferences.create(preference);

    // Retorna o link de pagamento (init_point) para o seu site
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ init_point: response.body.init_point })
    };

  } catch (error) {
    console.error('Erro Mercado Pago:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Erro ao gerar pagamento', error: error.message })
    };
  }
};
