let draft = {
  imageData: null,
  backImageData: null,
  isBackSideScan: false,
  cardImageUrl: null,
  voiceBlob: null,
  voiceTranscript: '',
  notes: '',
  reminder: null,
  extractedContact: null,
  relationType: '',
  contactSource: '',
  collectedBy: '',
};

export function getDraft() {
  return draft;
}

export function setDraft(partial) {
  draft = { ...draft, ...partial };
}

export function clearDraft() {
  draft = {
    imageData: null,
    backImageData: null,
    isBackSideScan: false,
    cardImageUrl: null,
    voiceBlob: null,
    voiceTranscript: '',
    notes: '',
    reminder: null,
    extractedContact: null,
    relationType: '',
    contactSource: '',
    collectedBy: '',
  };
}