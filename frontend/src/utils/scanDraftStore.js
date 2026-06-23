let draft = {
  imageData: null,
  voiceBlob: null,
  voiceTranscript: '',
  reminder: null,
  extractedContact: null,
  relationType: '',
  contactSource: '',
  collectedBy: '',
}

export function getDraft() {
  return draft
}

export function setDraft(partial) {
  draft = { ...draft, ...partial }
}

export function clearDraft() {
  draft = {
    imageData: null, voiceBlob: null, voiceTranscript: '', reminder: null,
    extractedContact: null, relationType: '', contactSource: '', collectedBy: '',
  }
}