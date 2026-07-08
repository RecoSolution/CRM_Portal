import axios from 'axios';

let cachedToken = null;
let tokenExpiry = 0;

export async function getZohoAccessToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const res = await axios.post(`${process.env.ZOHO_ACCOUNTS_DOMAIN}/oauth/v2/token`, null, {
    params: {
      refresh_token: process.env.ZOHO_REFRESH_TOKEN,
      client_id: process.env.ZOHO_CLIENT_ID,
      client_secret: process.env.ZOHO_CLIENT_SECRET,
      grant_type: 'refresh_token',
    },
  });

  cachedToken = res.data.access_token;
  tokenExpiry = Date.now() + (res.data.expires_in - 60) * 1000;
  return cachedToken;
}

export async function upsertContactInBigin(contact) {
  const token = await getZohoAccessToken();

  const payload = {
    data: [
      {
        First_Name: contact.name?.split(' ')[0] || '',
        Last_Name: contact.name?.split(' ').slice(1).join(' ') || contact.name || '-',
        Email: contact.email,
        Phone: contact.phone,
        Title: contact.designation,
        // Account_Name is a lookup — sending { name } auto-creates the
        // company in Bigin's Companies module if it doesn't exist yet.
        Account_Name: contact.company ? { name: contact.company } : undefined,
        Mailing_Street: contact.address || undefined,
        Website: contact.website || undefined,
        Mongo_Contact_Id: contact._id.toString(),
      },
    ],
  };

  const res = await axios.post(
    `${process.env.ZOHO_API_DOMAIN}/bigin/v2/Contacts/upsert`,
    payload,
    { headers: { Authorization: `Zoho-oauthtoken ${token}` } },
  );

  return res.data.data[0];
}