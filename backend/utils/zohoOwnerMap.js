  // utils/zohoOwnerMap.js
  const ZOHO_OWNER_MAP = {
    'pranav.desai@recosolution.com': '724472000000981066',
    'deep.bhuva@recosolution.com': '724472000000321001',   
  };

  export function getZohoOwnerId(appEmail) {
    if (!appEmail) return undefined;
    const id = ZOHO_OWNER_MAP[appEmail.toLowerCase()];
    return id && /^\d+$/.test(id) ? id : undefined;
  }