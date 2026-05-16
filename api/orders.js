const DEFAULT_API_BASE_URL = 'https://saju.lotiony.com';

function sendJson(response, statusCode, body) {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(body));
}

function getErrorMessage(payload, fallback) {
  if (!payload) return fallback;
  if (typeof payload.detail === 'string') return payload.detail;
  if (Array.isArray(payload.detail)) {
    return payload.detail
      .map((item) => item?.msg || item?.message)
      .filter(Boolean)
      .join('\n') || fallback;
  }
  if (typeof payload.message === 'string') return payload.message;
  return fallback;
}

module.exports = async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return sendJson(response, 405, { message: 'POST 요청만 가능합니다.' });
  }

  const apiKey = process.env.WEBHOOK_API_KEY;
  const apiBaseUrl = (process.env.WEBHOOK_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, '');

  if (!apiKey) {
    return sendJson(response, 503, { message: '주문 접수 설정이 완료되지 않았습니다.' });
  }

  let body;
  try {
    body = typeof request.body === 'string'
      ? JSON.parse(request.body || '{}')
      : request.body || {};
  } catch {
    return sendJson(response, 400, { message: '요청 형식이 올바르지 않습니다.' });
  }

  try {
    const upstreamResponse = await fetch(`${apiBaseUrl}/api/v1/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
      },
      body: JSON.stringify(body),
    });

    const text = await upstreamResponse.text();
    let payload = null;
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = { message: text };
      }
    }

    if (!upstreamResponse.ok) {
      return sendJson(response, upstreamResponse.status, {
        message: getErrorMessage(payload, '주문 접수 중 문제가 발생했습니다.'),
      });
    }

    return sendJson(response, upstreamResponse.status, payload || {});
  } catch (error) {
    console.error('Order webhook proxy failed:', error);
    return sendJson(response, 502, { message: '주문 접수 서버와 연결할 수 없습니다.' });
  }
};
