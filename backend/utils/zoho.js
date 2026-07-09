import axios from 'axios';
import { getZohoOwnerId } from './zohoOwnerMap.js';

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

function buildNotesDescription(contact) {
  if (!contact.notes || contact.notes.length === 0) return undefined;

  const sorted = [...contact.notes].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );

  return sorted
    .filter((n) => n.content && n.content.trim())
    .map((n) => {
      const date = n.createdAt
        ? new Date(n.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
        : '';
      return date ? `[${date}] ${n.content}` : n.content;
    })
    .join('\n\n');
}

// Forces the Owner on a Bigin record via a plain Update call. Needed
// because Bigin's insert-time assignment rule overrides any Owner sent
// during upsert's insert leg — Owner only reliably sticks on Update.
async function forceOwnerOnRecord(recordId, ownerId, token) {
  await axios.put(
    `${process.env.ZOHO_API_DOMAIN}/bigin/v2/Contacts`,
    { data: [{ id: recordId, Owner: { id: ownerId } }] },
    { headers: { Authorization: `Zoho-oauthtoken ${token}` } },
  );
}

export async function upsertContactInBigin(contact) {
  const token = await getZohoAccessToken();

  console.log('DEBUG collectedBy:', contact.collectedBy); // temp
  const zohoOwnerId = getZohoOwnerId(contact.collectedBy?.email);
  console.log('DEBUG resolved zohoOwnerId:', zohoOwnerId); // temp

  const payload = {
    data: [
      {
        First_Name: contact.name?.split(' ')[0] || '',
        Last_Name: contact.name?.split(' ').slice(1).join(' ') || contact.name || '-',
        Email: contact.email,
        Phone: contact.phone,
        Title: contact.designation,
        Account_Name: contact.company ? { name: contact.company } : undefined,
        Mailing_Street: contact.address || undefined,
        Website: contact.website || undefined,
        Description: buildNotesDescription(contact),
        Owner: zohoOwnerId ? { id: zohoOwnerId } : undefined,
        Mongo_Contact_Id: contact._id.toString(),
      },
    ],
  };

  const res = await axios.post(
    `${process.env.ZOHO_API_DOMAIN}/bigin/v2/Contacts/upsert`,
    payload,
    { headers: { Authorization: `Zoho-oauthtoken ${token}` } },
  );

  const result = res.data.data[0];
  console.log('DEBUG upsert result:', JSON.stringify(result, null, 2)); // temp

  if (zohoOwnerId && result?.details?.id) {
    console.log('DEBUG attempting to force owner on record:', result.details.id); // temp
    try {
      await forceOwnerOnRecord(result.details.id, zohoOwnerId, token);
      console.log('DEBUG force-owner call succeeded'); // temp
    } catch (err) {
      console.error(
        'Failed to force Owner on Bigin record',
        result.details.id,
        JSON.stringify(err.response?.data || err.message, null, 2), // fuller detail
      );
    }
  } else {
    console.log('DEBUG skipped force-owner — zohoOwnerId or record id missing', { zohoOwnerId, resultId: result?.details?.id }); // temp
  }

  return result;
}