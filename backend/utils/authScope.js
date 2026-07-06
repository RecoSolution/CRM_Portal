// ── Role-based query scoping helper ─────────────────────
// Founders see everything; Employees are restricted to records
// assigned to them. Reusable across Contact/Task controllers.
//
// Usage inside a controller:
//   const query = applyRoleScope(req, {}, 'assignedTo');
//   const contacts = await Contact.find(query);

const applyRoleScope = (req, baseQuery = {}, employeeField = 'assignedTo') => {
  if (req.user.role === 'founder') {
    return baseQuery; // no restriction
  }
  return { ...baseQuery, [employeeField]: req.user.id };
};

// ── Ownership/assignment check for single-document actions ──
// Returns true if the user is allowed to act on this document.
const canAccessRecord = (req, record, employeeField = 'assignedTo') => {
  if (req.user.role === 'founder') return true;
  const assignedId = record[employeeField]?._id
    ? record[employeeField]._id.toString()
    : record[employeeField]?.toString();
  return assignedId === req.user.id;
};

// ── Contact-specific scope: Founder sees all. Employee sees contacts
// explicitly assigned to them, PLUS contacts they personally created
// that haven't been assigned to anyone yet (assignedTo: null). This
// prevents contacts from silently disappearing during the transition
// from owner-based to assignedTo-based visibility.
const applyContactScope = (req) => {
  if (req.user.role === 'founder') return {};
  return {
    $or: [
      { assignedTo: req.user.id },
      { owner: req.user.id, assignedTo: null },
    ],
  };
};

export { applyRoleScope, canAccessRecord, applyContactScope };