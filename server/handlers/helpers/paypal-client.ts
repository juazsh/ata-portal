import axios from 'axios';


export async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID as string;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET as string;

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const baseUrl = process.env.NODE_ENV === 'production'
    ? 'https://api.paypal.com'
    : 'https://api.sandbox.paypal.com';

  try {
    const response = await axios({
      method: 'post',
      url: `${baseUrl}/v1/oauth2/token`,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: 'grant_type=client_credentials'
    });

    return response.data.access_token;
  } catch (error) {
    console.error('Error getting PayPal access token:', error);
    throw error;
  }
}

export async function createPayPalProduct(name: string, description: string) {
  const accessToken = await getPayPalAccessToken();
  const baseUrl = process.env.NODE_ENV === 'production'
    ? 'https://api.paypal.com'
    : 'https://api.sandbox.paypal.com';

  try {
    const response = await axios({
      method: 'post',
      url: `${baseUrl}/v1/catalogs/products`,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': `product-${Date.now()}`
      },
      data: {
        name,
        description,
        type: 'DIGITAL',
        category: 'EDUCATIONAL_AND_TEXTBOOKS'
      }
    });

    return response.data.id;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error('PayPal API error:', {
        status: error.response.status,
        data: error.response.data
      });
    } else {
      console.error('Error creating PayPal product:', error);
    }
    throw error;
  }
}

export async function createPayPalPlanForProduct(productId: string, name: string, price: number) {
  const accessToken = await getPayPalAccessToken();
  const baseUrl = process.env.NODE_ENV === 'production'
    ? 'https://api.paypal.com'
    : 'https://api.sandbox.paypal.com';

  try {
    const response = await axios({
      method: 'post',
      url: `${baseUrl}/v1/billing/plans`,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': `plan-${productId}-${Date.now()}`
      },
      data: {
        product_id: productId,
        name: `${name} - One-time Payment`,
        billing_cycles: [
          {
            frequency: {
              interval_unit: "MONTH",
              interval_count: 1
            },
            tenure_type: "REGULAR",
            sequence: 1,
            total_cycles: 1,
            pricing_scheme: {
              fixed_price: {
                value: price.toString(),
                currency_code: "USD"
              }
            }
          }
        ],
        payment_preferences: {
          auto_bill_outstanding: true,
          setup_fee: {
            value: price.toString(),
            currency_code: "USD"
          },
          setup_fee_failure_action: "CANCEL",
          payment_failure_threshold: 1
        }
      }
    });

    return response.data.id;
  } catch (error) {
    console.error('Error creating PayPal plan:', error);
    throw error;
  }
}

export async function updatePayPalProduct(productId: string, name: string, description: string) {
  const accessToken = await getPayPalAccessToken();
  const baseUrl = process.env.NODE_ENV === 'production'
    ? 'https://api.paypal.com'
    : 'https://api.sandbox.paypal.com';

  try {
    await axios({
      method: 'patch',
      url: `${baseUrl}/v1/catalogs/products/${productId}`,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      data: [
        {
          op: 'replace',
          path: '/name',
          value: name
        },
        {
          op: 'replace',
          path: '/description',
          value: description
        }
      ]
    });

    return true;
  } catch (error) {
    console.error('Error updating PayPal product:', error);
    throw error;
  }
}